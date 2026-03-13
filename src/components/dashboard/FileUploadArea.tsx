"use client";

import { useState, useRef } from "react";
import { CloudUpload, CheckCircle2, Loader2, AlertCircle, FileIcon, X, Info, Camera, Video, Mic, ChevronUp } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";
import { registerUploadedFileAction } from "@/app/actions/vault";
import { VoiceRecorder } from "./VoiceRecorder";
import { CameraCapture } from "./CameraCapture";

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


    const fileInputRef = useRef<HTMLInputElement>(null);
    const photoInputRef = useRef<HTMLInputElement>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showCaptureMenu, setShowCaptureMenu] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            startUpload(e.target.files);
        }
    };

    const handleCameraCapture = (files: File[]) => {
        setShowCamera(false);
        if (files.length > 0) {
            const dt = new DataTransfer();
            files.forEach((f) => dt.items.add(f));
            startUpload(dt.files);
        }
    };

    const handleVoiceNote = (file: File) => {
        const dt = new DataTransfer();
        dt.items.add(file);
        startUpload(dt.files);
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
                        category: "photos",
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
                    "photos"
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
                // Don't trigger any file picker from parent click — all capture is button-driven
                e.stopPropagation();
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
            {/* Native Photo Capture — forces camera, no gallery */}
            <input
                type="file"
                ref={photoInputRef}
                onChange={handleFileSelect}
                onClick={(e) => e.stopPropagation()}
                className="hidden"
                accept="image/*"
                capture="environment"
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
                                    <li>Assets you capture enter our quality review queue.</li>
                                    <li>Once verified, your data is matched to buyers (AI companies/researchers).</li>
                                    <li>Funds are added to your withdrawable balance <strong>only after</strong> your asset is successfully sold.</li>
                                </ul>
                            </div>
                        </div>
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
                        <h4 className="text-2xl font-bold text-gradz-charcoal mb-2">Start a Contribution</h4>
                        <p className="text-gradz-charcoal/60 max-w-sm mb-2">
                            Capture and submit authentic high-value data to build your digital vault.
                        </p>
                        <p className="text-gradz-charcoal/40 text-xs mb-6">
                            Max 2 GB per upload
                        </p>

                        {/* High-Value Data Tips */}
                        <div className="w-full max-w-md mb-8">
                            <p className="text-[11px] font-bold text-gradz-charcoal/70 uppercase tracking-wider mb-3">💡 What earns more?</p>
                            <div className="grid grid-cols-2 gap-2 text-left">
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">📝 Handwritten Notes</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Notebooks, letters, diaries</p>
                                </div>
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">🍛 Street Food Vendors</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Carts, stalls, local food</p>
                                </div>
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">👥 Social Gatherings</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Groups playing, events, crowds</p>
                                </div>
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">🗣️ Regional Languages</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Speak in Rajasthani, Hindi, Tamil, etc.</p>
                                </div>
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">🚗 Busy Intersections</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Traffic, roads, vehicles</p>
                                </div>
                                <div className="bg-gradz-cream/60 rounded-xl px-3 py-2.5 border border-gradz-charcoal/5">
                                    <span className="text-xs font-semibold text-gradz-charcoal">🎭 Cultural Festivals</span>
                                    <p className="text-[10px] text-gradz-charcoal/50 mt-0.5">Holi, Diwali, local fairs</p>
                                </div>

                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-center gap-4">
                            {/* Single Capture Button */}
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCaptureMenu(!showCaptureMenu); }}
                                    className="bg-gradz-charcoal text-gradz-cream px-10 py-4 rounded-full font-semibold hover:bg-black transition-colors duration-200 flex items-center gap-3 text-lg shadow-lg"
                                >
                                    <CloudUpload className="w-6 h-6" />
                                    Capture Asset
                                    <ChevronUp className={`w-5 h-5 transition-transform duration-200 ${showCaptureMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Popup Menu */}
                                {showCaptureMenu && (
                                    <>
                                        {/* Backdrop */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={(e) => { e.stopPropagation(); setShowCaptureMenu(false); }}
                                        />
                                        {/* Menu */}
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 z-50 w-56 bg-white rounded-2xl shadow-2xl border border-gradz-charcoal/10 overflow-hidden animate-in slide-in-from-bottom-2 duration-200">
                                            {/* Take Photo */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCaptureMenu(false);
                                                    photoInputRef.current?.click();
                                                }}
                                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gradz-cream/50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradz-charcoal/8 flex items-center justify-center flex-shrink-0">
                                                    <Camera className="w-5 h-5 text-gradz-charcoal" />
                                                </div>
                                                <p className="text-sm font-semibold text-gradz-charcoal">Take Photo</p>
                                            </button>

                                            <div className="h-px bg-gradz-charcoal/8 mx-4" />

                                            {/* Record Video */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCaptureMenu(false);
                                                    setShowCamera(true);
                                                }}
                                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gradz-cream/50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradz-charcoal/8 flex items-center justify-center flex-shrink-0">
                                                    <Video className="w-5 h-5 text-gradz-charcoal" />
                                                </div>
                                                <p className="text-sm font-semibold text-gradz-charcoal">Record Video</p>
                                            </button>

                                            <div className="h-px bg-gradz-charcoal/8 mx-4" />

                                            {/* Voice Note */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowCaptureMenu(false);
                                                    setShowVoiceRecorder(true);
                                                }}
                                                className="w-full flex items-center gap-4 px-5 py-4 hover:bg-gradz-cream/50 transition-colors text-left"
                                            >
                                                <div className="w-10 h-10 rounded-full bg-gradz-charcoal/8 flex items-center justify-center flex-shrink-0">
                                                    <Mic className="w-5 h-5 text-gradz-charcoal" />
                                                </div>
                                                <p className="text-sm font-semibold text-gradz-charcoal">Voice Note</p>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Inline Voice Recorder (shown when selected from menu) */}
                            {showVoiceRecorder && (
                                <div className="mt-2">
                                    <VoiceRecorder
                                        onRecordingComplete={(file) => {
                                            handleVoiceNote(file);
                                            setShowVoiceRecorder(false);
                                        }}
                                        maxDurationMinutes={2}
                                        autoStart
                                    />
                                </div>
                            )}
                        </div>
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

            {/* Camera Overlay */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                    maxPhotos={5}
                />
            )}
        </div>
    );
}
