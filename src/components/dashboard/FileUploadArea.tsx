"use client";

import { useState, useRef } from "react";
import { CloudUpload, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";
import { registerUploadedFileAction } from "@/app/actions/vault";

export function FileUploadArea() {
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const [uploadSizeMB, setUploadSizeMB] = useState(0);
    const [estimatedEarnings, setEstimatedEarnings] = useState(0);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleUploadProcess(e.target.files);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleUploadProcess(e.dataTransfer.files);
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

    const handleUploadProcess = async (files: FileList) => {
        setIsUploading(true);
        setProgress(0);
        setIsSuccess(false);
        setError(null);

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = 'Upload in progress. Leaving now will cancel the transfer.';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        try {
            const file = files[0];
            const fileSizeMB = file.size / (1024 * 1024);

            const earnings = fileSizeMB * godModeConfig.payRatePerMB;
            setUploadSizeMB(parseFloat(fileSizeMB.toFixed(2)));
            setEstimatedEarnings(parseFloat(earnings.toFixed(4)));

            // 1. Get Presigned URL
            const res = await fetch('/api/upload/presign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fileName: file.name,
                    contentType: file.type,
                    fileSize: file.size
                }),
            });

            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || 'Failed to get upload URL');
            }

            const { url, uniqueFileName, isValidationMock } = await res.json();

            // 2. Upload to Cloudflare R2
            if (!isValidationMock) {
                await new Promise<void>((resolve, reject) => {
                    const xhr = new XMLHttpRequest();
                    xhr.upload.onprogress = (e) => {
                        if (e.lengthComputable) {
                            setProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    };
                    xhr.onload = () => {
                        if (xhr.status >= 200 && xhr.status < 300) {
                            resolve();
                        } else {
                            reject(new Error(`Upload failed securely (Status: ${xhr.status})`));
                        }
                    };
                    xhr.onerror = () => reject(new Error('Network error during secure file transfer'));
                    xhr.open('PUT', url);
                    xhr.setRequestHeader('Content-Type', file.type);
                    xhr.send(file);
                });
            } else {
                // Mock Storage enabled: simulate timing visually
                for (let i = 0; i <= 100; i += 10) {
                    setProgress(i);
                    await new Promise(resolve => setTimeout(resolve, 200));
                }
            }

            // 3. Register mathematically verified upload
            const registerRes = await registerUploadedFileAction(
                uniqueFileName,
                file.size,
                file.type,
                uniqueFileName
            );

            if (!registerRes.success) {
                throw new Error(registerRes.error || "Failed to register upload for payout");
            }

            finishUploadSuccess();
        } catch (err: unknown) {
            console.error("Upload error:", err instanceof Error ? err.message : "Unknown");
            setError((err as Error).message || "An unexpected error occurred");
            setIsUploading(false);
        } finally {
            window.removeEventListener('beforeunload', handleBeforeUnload);
        }
    };

    const finishUploadSuccess = () => {
        setIsUploading(false);
        setIsSuccess(true);
        setTimeout(() => {
            setIsSuccess(false);
            setProgress(0);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }, 5000);
    };

    return (
        <div
            className="w-full relative group cursor-pointer"
            onClick={(e) => {
                if ((e.target as HTMLElement).tagName.toLowerCase() === 'input') return;
                if (!isUploading && !isSuccess && !error && fileInputRef.current) {
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
                accept="video/mp4,video/quicktime,video/webm,image/jpeg,image/png,image/webp,application/zip,text/csv,application/pdf,application/json"
            />

            <div
                className={`border-2 border-dashed rounded-3xl p-12 flex flex-col items-center justify-center text-center transition-colors duration-300 ${isDragging ? "border-gradz-green bg-gradz-green/5" : "border-gradz-charcoal/20 bg-white"} min-h-[400px]`}
            >
                {!isUploading && !isSuccess && !error && (
                    <div className="flex flex-col items-center">
                        <div className="w-20 h-20 bg-gradz-cream/50 group-hover:bg-gradz-cream rounded-full flex items-center justify-center mb-6 shadow-sm transition-colors duration-300">
                            <CloudUpload className="w-10 h-10 text-gradz-charcoal/40 group-hover:text-gradz-charcoal transition-colors duration-300" />
                        </div>
                        <h4 className="text-2xl font-bold text-gradz-charcoal mb-2">Drag & drop files here</h4>
                        <p className="text-gradz-charcoal/60 max-w-sm mb-8">
                            Supported formats: PNG, JPG, MP4, WAV, PDF.
                            <br />Max file size: 50MB.
                        </p>
                        <button className="bg-gradz-charcoal text-gradz-cream px-8 py-4 rounded-full font-medium group-hover:bg-black transition-colors transform duration-200">
                            Browse Files
                        </button>
                    </div>
                )}

                {isUploading && !error && (
                    <div className="w-full max-w-md flex flex-col items-center">
                        <div className="w-16 h-16 mb-8 flex items-center justify-center rounded-full border-4 border-gradz-charcoal/10 border-t-gradz-green">
                            <Loader2 className="w-6 h-6 text-gradz-green absolute animate-spin" />
                        </div>

                        <div className="w-full">
                            <div className="flex justify-between text-sm text-gradz-charcoal/60 mb-3 font-medium font-mono uppercase tracking-widest">
                                <span>Encrypting & Uploading</span>
                                <span className="text-gradz-green">{progress}%</span>
                            </div>
                            <div className="h-2 w-full bg-gradz-cream rounded-full overflow-hidden">
                                <div
                                    style={{ width: `${progress}%` }}
                                    className="h-full bg-gradz-green transition-all duration-300"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="flex flex-col items-center text-red-500 w-full max-w-md">
                        <AlertCircle className="w-16 h-16 mb-4 text-red-500 drop-shadow-md" />
                        <h3 className="text-xl font-bold font-serif mb-2">Upload Failed</h3>
                        <p className="text-red-500/80 font-medium mb-6 text-center">{error}</p>
                        <button
                            onClick={(e) => { e.stopPropagation(); setError(null); }}
                            className="px-6 py-2 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors"
                        >
                            Try Again
                        </button>
                    </div>
                )}

                {isSuccess && !error && (
                    <div className="flex flex-col items-center w-full max-w-md">
                        <CheckCircle2 className="w-20 h-20 mb-4 text-gradz-green drop-shadow-lg" />
                        <h3 className="text-2xl font-bold font-serif text-gradz-charcoal mb-2">
                            Upload Complete
                        </h3>
                        <p className="text-gradz-charcoal/60 font-medium mb-8">
                            Files secured and added to batch awaiting approval.
                        </p>

                        <div className="w-full bg-gradz-cream border border-gradz-charcoal/10 rounded-xl p-4 flex justify-between items-center text-left">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Uploaded</span>
                                <span className="text-gradz-charcoal font-semibold">{uploadSizeMB} MB</span>
                            </div>
                            <div className="h-8 w-px bg-gradz-charcoal/10 mx-4" />
                            <div className="flex flex-col text-right">
                                <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Estimated Pay</span>
                                <span className="text-gradz-green font-bold text-lg">${estimatedEarnings.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
