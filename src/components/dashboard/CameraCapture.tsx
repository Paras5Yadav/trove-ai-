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
                    width: { ideal: 3840 },
                    height: { ideal: 2160 },
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
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <canvas ref={canvasRef} className="hidden" />

            {flashActive && (
                <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-pulse" />
            )}

            {/* Top Bar - Timer only */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-center px-6 pt-12 pb-4">
                {isRecording && (
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-medium text-lg tracking-tighter tabular-nums drop-shadow-md">
                            {formatTime(recordingTime)}
                        </span>
                    </div>
                )}
                {!isRecording && (
                    <div className="text-white/70 text-sm font-medium">
                        {files.length} / {maxPhotos} recordings
                    </div>
                )}
            </div>

            {/* Viewfinder */}
            <div className="flex-1 relative overflow-hidden bg-black">
                {error ? (
                    <div className="h-full flex flex-col items-center justify-center text-white px-8 text-center">
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
                        className={`absolute inset-0 w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                    />
                )}
            </div>

            {/* Bottom controls */}
            <div className="bg-black/95 backdrop-blur-sm pb-8">
                
                {/* Video mode label */}
                {!isRecording && (
                    <div className="flex justify-center py-3">
                        <span className="text-xs font-bold tracking-wider text-yellow-400 uppercase">VIDEO</span>
                    </div>
                )}

                {/* Thumbnail strip */}
                {files.length > 0 && !isRecording && (
                    <div className="px-4 pb-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {files.map((file, i) => (
                                <div key={i} className="relative flex-shrink-0 group">
                                    <div className="w-14 h-14 rounded-lg bg-gray-800 border-2 border-white/20 flex items-center justify-center relative overflow-hidden">
                                        <video src={file.url} preload="metadata" playsInline muted className="absolute inset-0 w-full h-full object-cover" />
                                        <div className="absolute bottom-0.5 right-0.5 bg-black/60 rounded px-1">
                                            <Video className="w-3 h-3 text-white" />
                                        </div>
                                    </div>
                                   
                                    <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Shutter Controls */}
                <div className="flex items-center justify-between px-10 pt-4 pb-12">
                    {/* Cancel button — works during recording too */}
                    <button
                        onClick={() => {
                            if (isRecording) stopRecording();
                            handleClose();
                        }}
                        className="text-white text-lg font-normal active:opacity-50 min-w-[60px] text-left"
                    >
                        Cancel
                    </button>

                    {/* Record Button - Video Only */}
                    <div className="flex justify-center relative">
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={!isReady || (files.length >= maxPhotos && !isRecording)}
                            className="w-[76px] h-[76px] rounded-full border-[4px] border-white flex items-center justify-center p-1 active:scale-90 transition-all disabled:opacity-30"
                        >
                            <div className={`transition-all bg-red-600 shadow-inner ${isRecording ? 'w-8 h-8 rounded-lg' : 'w-full h-full rounded-full'}`} />
                        </button>
                        
                        {/* Recording Count Badge */}
                        {files.length > 0 && !isRecording && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradz-green text-gradz-charcoal text-[11px] font-bold rounded-full flex items-center justify-center shadow-lg border-2 border-black">
                                {files.length}
                            </div>
                        )}
                    </div>

                    {/* Camera Flip or Upload Toggle — always visible for layout balance */}
                    {files.length > 0 && !isRecording ? (
                        <button
                            onClick={handleUploadAll}
                            className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-all"
                            title="Upload All"
                        >
                            <Upload className="w-6 h-6" />
                        </button>
                    ) : (
                        <button
                            onClick={switchCamera}
                            disabled={isRecording}
                            className="w-[50px] h-[50px] flex items-center justify-center rounded-full bg-white/15 text-white active:scale-90 transition-all disabled:opacity-0"
                        >
                            <RefreshCcw className="w-6 h-6" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
