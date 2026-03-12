"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, X, RotateCcw, SwitchCamera, Upload } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (files: File[]) => void;
    onClose: () => void;
    maxPhotos?: number;
}

export function CameraCapture({ onCapture, onClose, maxPhotos = 13 }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const [photos, setPhotos] = useState<{ blob: Blob; url: string }[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flashActive, setFlashActive] = useState(false);
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

    const startCamera = useCallback(async (facing: "environment" | "user") => {
        // Stop any existing stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
        setIsReady(false);
        setError(null);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
                },
                audio: false,
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsReady(true);
                };
            }
        } catch (err) {
            console.error("Camera error:", err);
            setError("Camera access denied. Please allow camera permissions and try again.");
        }
    }, []);

    useEffect(() => {
        startCamera(facingMode);

        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const switchCamera = useCallback(() => {
        const newFacing = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacing);
        startCamera(newFacing);
    }, [facingMode, startCamera]);

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || photos.length >= maxPhotos) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        // Use the actual video resolution for max quality
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Mirror if front camera
        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Reset transform
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        // Flash effect
        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 150);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setPhotos((prev) => [...prev, { blob, url }]);
                }
            },
            "image/jpeg",
            0.92
        );
    }, [photos.length, maxPhotos, facingMode]);

    const removePhoto = useCallback((index: number) => {
        setPhotos((prev) => {
            const removed = prev[index];
            URL.revokeObjectURL(removed.url);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const handleUploadAll = useCallback(() => {
        const files = photos.map((p, i) => {
            const timestamp = Date.now();
            return new File([p.blob], `capture_${timestamp}_${i + 1}.jpg`, {
                type: "image/jpeg",
            });
        });

        // Clean up URLs
        photos.forEach((p) => URL.revokeObjectURL(p.url));

        // Stop camera
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }

        onCapture(files);
    }, [photos, onCapture]);

    const handleClose = useCallback(() => {
        // Clean up
        photos.forEach((p) => URL.revokeObjectURL(p.url));
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
        onClose();
    }, [photos, onClose]);

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            {/* Hidden canvas for capture */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Flash overlay */}
            {flashActive && (
                <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-pulse" />
            )}

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={handleClose}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                <div className="text-white/80 text-sm font-medium">
                    {photos.length} / {maxPhotos} photos
                </div>

                <button
                    onClick={switchCamera}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm"
                >
                    <SwitchCamera className="w-5 h-5 text-white" />
                </button>
            </div>

            {/* Camera viewfinder */}
            <div className="flex-1 relative overflow-hidden">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-white px-8 text-center">
                        <Camera className="w-16 h-16 mb-4 text-white/40" />
                        <p className="text-lg font-medium mb-2">Camera Unavailable</p>
                        <p className="text-white/60 text-sm mb-6">{error}</p>
                        <button
                            onClick={handleClose}
                            className="px-6 py-2 bg-white/20 rounded-full text-white font-medium"
                        >
                            Go Back
                        </button>
                    </div>
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                    />
                )}

                {!isReady && !error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black">
                        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Bottom controls */}
            <div className="bg-black/95 backdrop-blur-sm">
                {/* Thumbnail strip */}
                {photos.length > 0 && (
                    <div className="px-4 pt-3 pb-2">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {photos.map((photo, i) => (
                                <div key={i} className="relative flex-shrink-0 group">
                                    <img
                                        src={photo.url}
                                        alt={`Capture ${i + 1}`}
                                        className="w-14 h-14 rounded-lg object-cover border-2 border-white/20"
                                    />
                                    <button
                                        onClick={() => removePhoto(i)}
                                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg"
                                    >
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                    <span className="absolute bottom-0.5 right-1 text-[9px] font-bold text-white drop-shadow-lg">
                                        {i + 1}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shutter + Upload */}
                <div className="flex items-center justify-between px-8 py-4 pb-8">
                    {/* Reset / Clear */}
                    <button
                        onClick={() => {
                            photos.forEach((p) => URL.revokeObjectURL(p.url));
                            setPhotos([]);
                        }}
                        disabled={photos.length === 0}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 disabled:opacity-30"
                    >
                        <RotateCcw className="w-5 h-5 text-white" />
                    </button>

                    {/* Shutter */}
                    <button
                        onClick={capturePhoto}
                        disabled={!isReady || photos.length >= maxPhotos}
                        className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-transform"
                    >
                        <div className="w-[58px] h-[58px] rounded-full bg-white" />
                    </button>

                    {/* Upload All */}
                    <button
                        onClick={handleUploadAll}
                        disabled={photos.length === 0}
                        className="w-12 h-12 flex items-center justify-center rounded-full bg-gradz-green disabled:opacity-30 relative"
                    >
                        <Upload className="w-5 h-5 text-gradz-charcoal" />
                        {photos.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                                {photos.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
