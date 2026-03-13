"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Video, X, Upload, RefreshCcw } from "lucide-react";

interface CameraCaptureProps {
    onCapture: (files: File[]) => void;
    onClose: () => void;
    maxPhotos?: number;
}

export function CameraCapture({ onCapture, onClose, maxPhotos = 13 }: CameraCaptureProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const videoChunksRef = useRef<BlobPart[]>([]);

    const [files, setFiles] = useState<{ blob: Blob; url: string; type: "photo" | "video" }[]>([]);
    const [isReady, setIsReady] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [flashActive, setFlashActive] = useState(false);
    
    // Camera settings
    const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
    // Video-only mode — no mode switching
    
    // Video recording states
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const startCamera = useCallback(async (facing: "environment" | "user") => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
        }
        setIsReady(false);
        setError(null);

        try {
            // Demand Maximum Hardware Resolution (4K / 1080p fallback)
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 2560 },
                    height: { ideal: 1440 },
                    frameRate: { ideal: 60 }
                },
                audio: true, // Always require audio for video recording
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.onloadedmetadata = () => {
                    videoRef.current?.play();
                    setIsReady(true);
                };
            }
        } catch (err: any) {
            console.error("Camera error:", err);
            // Fallback for devices that reject the audio permission or strict 4K constraints
            try {
                 const fallbackStream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: facing },
                    audio: false,
                });
                streamRef.current = fallbackStream;
                 if (videoRef.current) {
                    videoRef.current.srcObject = fallbackStream;
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current?.play();
                        setIsReady(true);
                    };
                }
            } catch (fallbackErr) {
                 setError("Camera access denied. Please allow camera permissions and try again.");
            }
        }
    }, []);

    // Start camera on mount
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
        if (isRecording) return;
        const newFacing = facingMode === "environment" ? "user" : "environment";
        setFacingMode(newFacing);
        startCamera(newFacing);
    }, [facingMode, startCamera, isRecording]);

    // --- PHOTO CAPTURE --
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || files.length >= maxPhotos || isRecording) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (facingMode === "user") {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.setTransform(1, 0, 0, 1, 0, 0);

        setFlashActive(true);
        setTimeout(() => setFlashActive(false), 150);

        canvas.toBlob(
            (blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    setFiles((prev) => [...prev, { blob, url, type: "photo" }]);
                }
            },
            "image/jpeg",
            0.92
        );
    }, [files.length, maxPhotos, facingMode, isRecording]);


    // --- VIDEO RECORDING ---
    const startRecording = useCallback(() => {
        if (!streamRef.current || files.length >= maxPhotos) return;

        // Detect best supported video codec (Safari doesn't support webm/vp9)
        let recorderOptions: MediaRecorderOptions | undefined = undefined;
        if (MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus")) {
            recorderOptions = { mimeType: "video/webm;codecs=vp9,opus" };
        } else if (MediaRecorder.isTypeSupported("video/webm;codecs=vp8,opus")) {
            recorderOptions = { mimeType: "video/webm;codecs=vp8,opus" };
        } else if (MediaRecorder.isTypeSupported("video/webm")) {
            recorderOptions = { mimeType: "video/webm" };
        } else if (MediaRecorder.isTypeSupported("video/mp4")) {
            recorderOptions = { mimeType: "video/mp4" };
        } // Otherwise fallback to browser default

        const mediaRecorder = new MediaRecorder(streamRef.current, recorderOptions);

        mediaRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const finalMimeType = recorderOptions?.mimeType || mediaRecorder.mimeType || "video/mp4";
            const ext = finalMimeType.includes("webm") ? "webm" : "mp4";
            const blob = new Blob(videoChunksRef.current, { type: finalMimeType });
            const url = URL.createObjectURL(blob);
            setFiles((prev) => [...prev, { blob, url, type: "video" }]);
            
            setIsRecording(false);
            setRecordingTime(0);
            if (timerRef.current) clearInterval(timerRef.current);
        };

        mediaRecorder.start(100);
        setIsRecording(true);
        setRecordingTime(0);

        timerRef.current = setInterval(() => {
            setRecordingTime((prev) => prev + 1);
        }, 1000);

    }, [files.length, maxPhotos]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
        }
    }, []);


    // --- UI ACTIONS ---
    const removeFile = useCallback((index: number) => {
        setFiles((prev) => {
            const removed = prev[index];
            URL.revokeObjectURL(removed.url);
            return prev.filter((_, i) => i !== index);
        });
    }, []);

    const handleUploadAll = useCallback(() => {
        const outFiles = files.map((f, i) => {
            const timestamp = Date.now();
            const ext = f.type === "photo" ? "jpg" : (f.blob.type.includes("webm") ? "webm" : "mp4");
            const mime = f.type === "photo" ? "image/jpeg" : f.blob.type;
            return new File([f.blob], `capture_${timestamp}_${i + 1}.${ext}`, { type: mime });
        });

        files.forEach((p) => URL.revokeObjectURL(p.url));
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        
        onCapture(outFiles);
    }, [files, onCapture]);

    const handleClose = useCallback(() => {
        files.forEach((p) => URL.revokeObjectURL(p.url));
        if (streamRef.current) streamRef.current.getTracks().forEach((t) => t.stop());
        if (timerRef.current) clearInterval(timerRef.current);
        onClose();
    }, [files, onClose]);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black overflow-hidden">
            <canvas ref={canvasRef} className="hidden" />

            {flashActive && (
                <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-pulse" />
            )}

            {/* Full-Screen Viewfinder */}
            <div className="absolute inset-0 z-0">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-white px-8 text-center bg-black">
                        <Camera className="w-16 h-16 mb-4 text-white/40" />
                        <p className="text-lg font-medium mb-2">Camera Unavailable</p>
                        <p className="text-white/60 text-sm mb-6">{error}</p>
                        <button onClick={handleClose} className="px-6 py-2 bg-white/20 rounded-full text-white font-medium">
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
            </div>

            {/* Top Bar - Timer / Counter only, no dark overlay */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center pt-14 pointer-events-none">
                {isRecording ? (
                    <div className="bg-[#ff3b30] rounded px-3 py-1 pointer-events-auto">
                        <span className="text-white font-medium tracking-widest text-[13px] tabular-nums">{formatTime(recordingTime)}</span>
                    </div>
                ) : (
                    <div className="text-white text-xs font-medium drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                        {files.length} / {maxPhotos} recordings
                    </div>
                )}
            </div>

            {/* Bottom Controls - minimal, no gradient */}
            <div className="absolute bottom-0 left-0 right-0 z-30 pb-10 pt-4">
                <div className="flex items-center justify-between px-10">
                    {/* Left: Cancel */}
                    <button
                        onClick={() => {
                            if (isRecording) stopRecording();
                            handleClose();
                        }}
                        className="text-white text-base font-medium active:opacity-50 min-w-[60px] text-left drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                    >
                        Cancel
                    </button>

                    {/* Center: Record Button */}
                    <div className="flex justify-center relative">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!isReady || (files.length >= maxPhotos && !isRecording)}
                            className="w-[74px] h-[74px] rounded-full border-[4px] border-white flex items-center justify-center p-1 active:scale-95 transition-all disabled:opacity-30 shadow-[0_2px_8px_rgba(0,0,0,0.4)]"
                        >
                            <div className={`transition-all bg-[#ff3b30] ${isRecording ? 'w-[28px] h-[28px] rounded-md' : 'w-full h-full rounded-full'}`} />
                        </button>
                    </div>

                    {/* Right: Camera Flip or Upload */}
                    <div className="min-w-[60px] flex justify-end relative">
                        {files.length > 0 && !isRecording ? (
                            <button
                                onClick={handleUploadAll}
                                className="w-[44px] h-[44px] flex items-center justify-center rounded-full bg-white text-black active:scale-90 transition-all shadow-lg"
                                title="Upload All"
                            >
                                <Upload className="w-5 h-5" />
                            </button>
                        ) : (
                            <button
                                onClick={switchCamera}
                                disabled={isRecording}
                                className="w-[44px] h-[44px] flex items-center justify-center rounded-full text-white active:scale-90 transition-all disabled:opacity-0 drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]"
                            >
                                <RefreshCcw className="w-6 h-6" />
                            </button>
                        )}
                        
                        {/* Upload Count Badge */}
                        {files.length > 0 && !isRecording && (
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#ff3b30] text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                                {files.length}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
