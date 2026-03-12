"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Video, X, RotateCcw, SwitchCamera, Upload, Square } from "lucide-react";

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
    const [mode, setMode] = useState<"photo" | "video">("photo");
    
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
                audio: mode === "video", // Only ask for audio if in video mode
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
    }, [mode]);

    // Restart camera if mode changes (to grab microphone for video)
    useEffect(() => {
        startCamera(facingMode);
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach((t) => t.stop());
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode]);

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

        const mediaRecorder = new MediaRecorder(streamRef.current, {
            mimeType: "video/webm;codecs=vp9,opus" // High quality codec
        });

        mediaRecorderRef.current = mediaRecorder;
        videoChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) videoChunksRef.current.push(e.data);
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
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
            const ext = f.type === "photo" ? "jpg" : "webm";
            const mime = f.type === "photo" ? "image/jpeg" : "video/webm";
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
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
            <canvas ref={canvasRef} className="hidden" />

            {flashActive && (
                <div className="absolute inset-0 z-40 bg-white pointer-events-none animate-pulse" />
            )}

            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
                <button
                    onClick={handleClose}
                    disabled={isRecording}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm disabled:opacity-50"
                >
                    <X className="w-5 h-5 text-white" />
                </button>

                {isRecording ? (
                    <div className="flex items-center gap-2 bg-red-500/20 px-3 py-1 rounded-full backdrop-blur-sm border border-red-500/50">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        <span className="text-white font-mono tabular-nums">{formatTime(recordingTime)}</span>
                    </div>
                ) : (
                    <div className="text-white/80 text-sm font-medium">
                        {files.length} / {maxPhotos} captures
                    </div>
                )}

                <button
                    onClick={switchCamera}
                    disabled={isRecording}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white/15 backdrop-blur-sm disabled:opacity-50"
                >
                    <SwitchCamera className="w-5 h-5 text-white" />
                </button>
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
                        className={`w-full h-full object-cover ${facingMode === "user" ? "scale-x-[-1]" : ""}`}
                    />
                )}
            </div>

            {/* Bottom controls */}
            <div className="bg-black/95 backdrop-blur-sm pb-8">
                
                {/* Mode Selector */}
                {!isRecording && (
                    <div className="flex justify-center gap-6 py-4">
                         <button 
                            onClick={() => setMode("photo")}
                            className={`text-sm font-medium transition-colors ${mode === "photo" ? "text-gradz-green" : "text-white/50"}`}
                        >
                            PHOTO
                        </button>
                        <button 
                            onClick={() => setMode("video")}
                            className={`text-sm font-medium transition-colors ${mode === "video" ? "text-red-500" : "text-white/50"}`}
                        >
                            VIDEO
                        </button>
                    </div>
                )}

                {/* Thumbnail strip */}
                {files.length > 0 && !isRecording && (
                    <div className="px-4 pb-4">
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {files.map((file, i) => (
                                <div key={i} className="relative flex-shrink-0 group">
                                    {file.type === "photo" ? (
                                         <img src={file.url} alt={`Capture ${i + 1}`} className="w-14 h-14 rounded-lg object-cover border-2 border-white/20" />
                                    ) : (
                                         <div className="w-14 h-14 rounded-lg bg-gray-800 border-2 border-white/20 flex items-center justify-center relative overflow-hidden">
                                             <video src={file.url} className="absolute inset-0 w-full h-full object-cover opacity-50" />
                                             <Video className="w-5 h-5 text-white z-10 drop-shadow-md" />
                                         </div>
                                    )}
                                   
                                    <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                                        <X className="w-3 h-3 text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between px-8 py-2">
                    {/* Clear Button */}
                    <button
                        onClick={() => {
                            files.forEach((p) => URL.revokeObjectURL(p.url));
                            setFiles([]);
                        }}
                        disabled={files.length === 0 || isRecording}
                        className={`w-12 h-12 flex items-center justify-center rounded-full bg-white/10 ${files.length === 0 || isRecording ? 'opacity-30' : ''}`}
                    >
                        <RotateCcw className="w-5 h-5 text-white" />
                    </button>

                    {/* Shutter Button */}
                    <div className="flex-1 flex justify-center">
                        {mode === "photo" ? (
                            <button
                                onClick={capturePhoto}
                                disabled={!isReady || files.length >= maxPhotos}
                                className="w-[72px] h-[72px] rounded-full border-[4px] border-white flex items-center justify-center disabled:opacity-30 active:scale-90 transition-all"
                            >
                                <div className="w-[58px] h-[58px] rounded-full bg-white" />
                            </button>
                        ) : (
                            <button
                                onClick={isRecording ? stopRecording : startRecording}
                                disabled={!isReady || (files.length >= maxPhotos && !isRecording)}
                                className={`w-[72px] h-[72px] rounded-full border-[4px] flex items-center justify-center transition-all ${isRecording ? 'border-red-500/50' : 'border-red-500'} ${(!isReady || (files.length >= maxPhotos && !isRecording)) ? 'opacity-30' : ''}`}
                            >
                                <div className={`transition-all bg-red-500 ${isRecording ? 'w-8 h-8 rounded-md' : 'w-[58px] h-[58px] rounded-full'}`} />
                            </button>
                        )}
                    </div>

                    {/* Upload All */}
                    <button
                        onClick={handleUploadAll}
                        disabled={files.length === 0 || isRecording}
                        className={`w-12 h-12 flex items-center justify-center rounded-full bg-gradz-green relative ${(files.length === 0 || isRecording) ? 'opacity-30' : ''}`}
                    >
                        <Upload className="w-5 h-5 text-gradz-charcoal" />
                        {files.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-black text-[10px] font-bold rounded-full flex items-center justify-center shadow">
                                {files.length}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
