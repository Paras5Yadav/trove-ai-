"use client";

import { useState, useRef } from "react";
import { CloudUpload, CheckCircle2, Loader2, AlertCircle, FileIcon, X, Info } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";
import { registerUploadedFileAction } from "@/app/actions/vault";

const MAX_FILES = 13;

// Generates a consistent per-user factor between 0.90 and 1.10 from a seed string
function getUserVariationFactor(seed: string): number {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    const normalized = (Math.abs(hash) % 1000) / 1000;
    return 0.90 + (normalized * 0.20);
}

interface FileUploadState {
    file: File;
    progress: number;
    status: "pending" | "verifying" | "registering" | "done" | "error";
    error?: string;
}

export function FileUploadArea({ referralCode = "" }: { referralCode?: string }) {
    const [uploads, setUploads] = useState<FileUploadState[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isAllDone, setIsAllDone] = useState(false);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [totalSizeMB, setTotalSizeMB] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [uploadCategory, setUploadCategory] = useState<"photos" | "notes">("photos");

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            startUpload(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            startUpload(e.dataTransfer.files);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const startUpload = async (fileList: FileList) => {
        const files = Array.from(fileList).slice(0, MAX_FILES);

        if (files.length === 0) return;

        // Constraint: Max 2GB per upload batch to prevent browser freezing
        const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
        if (totalBytes > 2 * 1024 * 1024 * 1024) {
            setGlobalError("Upload batch exceeds 2GB maximum limit. Please select fewer or smaller files.");
            return;
        }

        // Strict UI Type Validation
        const hasInvalidTypes = files.some(
            (f) => !f.type.startsWith("image/") && !f.type.startsWith("video/") && !f.type.startsWith("audio/") && f.type !== "application/pdf"
        );
        if (hasInvalidTypes) {
            setGlobalError("Unsupported file type detected. Only Photos, Videos, Audio, and PDFs are allowed.");
            return;
        }

        const states: FileUploadState[] = files.map((f) => ({
            file: f,
            progress: 0,
            status: "pending" as const,
        }));

        setUploads(states);
        setIsUploading(true);
        setIsAllDone(false);
        setGlobalError(null);

        let combinedSizeMB = 0;
        let combinedEarnings = 0;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Upload in progress. Leaving now will cancel the transfer.";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        // Upload files sequentially to avoid overwhelming the server
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            setUploads((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], status: "registering", progress: 30 };
                return next;
            });

            try {
                // Register upload directly
                const res = await fetch("/api/upload/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fileName: file.name,
                        contentType: file.type || "application/octet-stream",
                        fileSize: file.size,
                        category: uploadCategory,
                    }),
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Upload connection failed");
                }

                const registerData = await res.json();
                const uniqueFileName = registerData.uniqueFileName;

                // 3. Complete Vault Ledger
                const registerVaultRes = await registerUploadedFileAction(
                    uniqueFileName,
                    file.size,
                    file.type || "application/octet-stream",
                    uniqueFileName,
                    uploadCategory
                );

                if (!registerVaultRes.success) {
                    throw new Error(registerVaultRes.error || "Failed to save upload details");
                }

                const fileSizeMB = file.size / (1024 * 1024);
                combinedSizeMB += fileSizeMB;
                combinedEarnings += fileSizeMB * godModeConfig.payRatePerMB;

                setUploads((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], status: "done", progress: 100 };
                    return next;
                });
            } catch (err: unknown) {
                console.error(`Upload error for ${file.name}:`, err instanceof Error ? err.message : "Unknown");
                setUploads((prev) => {
                    const next = [...prev];
                    next[i] = {
                        ...next[i],
                        status: "error",
                        error: (err as Error).message || "Upload failed",
                    };
                    return next;
                });
            }
        }

        window.removeEventListener("beforeunload", handleBeforeUnload);

        setTotalSizeMB(parseFloat(combinedSizeMB.toFixed(2)));
        setTotalEarnings(parseFloat(combinedEarnings.toFixed(2)));
        setIsUploading(false);
        setIsAllDone(true);

        // Auto-reset after 8 seconds
        setTimeout(() => {
            setIsAllDone(false);
            setUploads([]);
            setTotalSizeMB(0);
            setTotalEarnings(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }, 8000);
    };

    const formatFileSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / 1024).toFixed(0)} KB`;
    };

    const isIdle = !isUploading && !isAllDone && !globalError;

    return (
        <div
            className="w-full relative group cursor-pointer"
            onClick={(e) => {
                if ((e.target as HTMLElement).tagName.toLowerCase() === "input") return;
                if (isIdle && fileInputRef.current) {
                    fileInputRef.current.click();
                }
            }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
        >
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                accept="image/*,video/*,audio/*,application/pdf"
                multiple
            />

            {/* Data Consent Reminder */}
            {isIdle && (
                <div className="flex flex-col gap-3 mb-4">
                    <div className="flex flex-col gap-2 px-5 py-3.5 rounded-xl bg-moss/5 border border-moss/15">
                        <div className="flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-moss flex-shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-[12px] text-moss/90 font-bold">
                                    How it works:
                                </p>
                                <ul className="list-disc list-inside text-[11px] text-moss/80 font-medium space-y-0.5">
                                    <li>Files you upload enter our quality review queue.</li>
                                    <li>Once verified, your data is matched to buyers (AI companies/researchers).</li>
                                    <li>Funds are added to your withdrawable balance <strong>only after</strong> your file is successfully sold.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <label htmlFor="category" className="text-[11px] font-semibold text-gradz-charcoal uppercase tracking-widest">
                            Dataset Category:
                        </label>
                        <select
                            id="category"
                            value={uploadCategory}
                            onChange={(e) => setUploadCategory(e.target.value as any)}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white border border-gradz-charcoal/10 rounded-lg text-sm px-3 py-1.5 outline-none focus:ring-2 focus:ring-gradz-green/50 w-full max-w-[200px]"
                        >
                            <option value="photos">Photos, Videos & Audio</option>
                            <option value="notes">Notes & Documents</option>
                        </select>
                    </div>
                </div>
            )}

            <div
                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-300 ${isDragging ? "border-gradz-green bg-gradz-green/5" : "border-gradz-charcoal/20 bg-white"} min-h-[400px]`}
            >
                {/* IDLE STATE */}
                {isIdle && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradz-cream/50 group-hover:bg-gradz-cream rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors duration-300">
                            <CloudUpload className="w-10 h-10 text-gradz-charcoal/40 group-hover:text-gradz-charcoal transition-colors duration-300" />
                        </div>
                        <h4 className="text-2xl font-bold text-gradz-charcoal mb-2">Drag & drop files here</h4>
                        <p className="text-gradz-charcoal/60 max-w-sm mb-2">
                            Photos, Videos, Audio, and PDFs supported. Up to {MAX_FILES} files at once.
                        </p>
                        <p className="text-gradz-charcoal/40 text-xs mb-8">
                            Max 2 GB per upload
                        </p>
                        <button className="bg-gradz-charcoal text-gradz-cream px-8 py-4 rounded-full font-medium group-hover:bg-black transition-colors transform duration-200">
                            Browse Files
                        </button>
                    </div>
                )}

                {/* UPLOADING STATE */}
                {isUploading && (
                    <div className="w-full max-w-lg space-y-3">
                        <div className="flex items-center gap-2 mb-4">
                            <Loader2 className="w-5 h-5 text-gradz-green animate-spin" />
                            <span className="text-sm font-mono text-gradz-charcoal/60 uppercase tracking-widest">
                                Processing {uploads.length} file{uploads.length > 1 ? "s" : ""}
                            </span>
                        </div>
                        {uploads.map((u, i) => (
                            <div key={i} className="flex flex-col gap-1 bg-gradz-cream/50 rounded-xl px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <FileIcon className="w-4 h-4 text-gradz-charcoal/40 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-xs text-gradz-charcoal/60 mb-1">
                                            <span className="truncate max-w-[200px]">{u.file.name}</span>
                                            <span className="flex-shrink-0 ml-2">
                                                {u.status === "done" ? (
                                                    <CheckCircle2 className="w-4 h-4 text-gradz-green inline" />
                                                ) : u.status === "error" ? (
                                                    <X className="w-4 h-4 text-red-500 inline" />
                                                ) : u.status === "registering" ? (
                                                    <span className="text-gradz-green/70 flex items-center gap-1">
                                                        <Loader2 className="w-3 h-3 animate-spin"/> Processing...
                                                    </span>
                                                ) : (
                                                    `${u.progress}%`
                                                )}
                                            </span>
                                        </div>
                                        <div className="w-full h-1.5 bg-gradz-charcoal/10 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-300 ${u.status === "error" ? "bg-red-400" :
                                                    u.status === "done" ? "bg-gradz-green" :
                                                        "bg-gradz-green/70"
                                                    }`}
                                                style={{ width: `${u.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[10px] text-gradz-charcoal/40 flex-shrink-0">{formatFileSize(u.file.size)}</span>
                                </div>
                                {u.error && <span className="text-[10px] text-red-500 ml-7">{u.error}</span>}
                            </div>
                        ))}
                    </div>
                )}

                {/* ERROR STATE */}
                {globalError && (
                    <div className="flex flex-col items-center text-red-500 w-full max-w-md">
                        <AlertCircle className="w-16 h-16 mb-4 text-red-500 drop-shadow-md" />
                        <h3 className="text-xl font-bold font-serif mb-2">Upload Failed</h3>
                        <p className="text-red-500/80 font-medium mb-6 text-center">{globalError}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); setGlobalError(null); setUploads([]); }}
                            className="px-6 py-2 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {/* SUCCESS STATE */}
                {isAllDone && !isUploading && (
                    <div className="flex flex-col items-center w-full max-w-lg">
                        <CheckCircle2 className="w-20 h-20 mb-4 text-gradz-green drop-shadow-lg" />
                        <h3 className="text-2xl font-bold font-serif text-gradz-charcoal mb-2">
                            Upload Complete
                        </h3>
                        <p className="text-gradz-charcoal/60 font-medium mb-6">
                            {uploads.filter((u) => u.status === "done").length} file{uploads.filter((u) => u.status === "done").length > 1 ? "s" : ""} secured and added to batch for reviewing.
                            {uploads.some((u) => u.status === "error") && (
                                <span className="text-red-500"> · {uploads.filter((u) => u.status === "error").length} failed</span>
                            )}
                        </p>

                        <div className="w-full bg-gradz-cream border border-gradz-charcoal/10 rounded-xl p-4 flex justify-between items-center text-left">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Total Uploaded</span>
                                <span className="text-gradz-charcoal font-semibold">{totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB} MB`}</span>
                            </div>
                            <div className="h-8 w-px bg-gradz-charcoal/10 mx-4" />
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Estimated Pay</span>
                                <span className="text-gradz-green font-bold text-lg">₹{((totalEarnings / 6) * (referralCode ? getUserVariationFactor(referralCode) : 1.0)).toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
