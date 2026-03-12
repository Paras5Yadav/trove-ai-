"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle, Play, Pause, RotateCcw, Upload } from "lucide-react";

interface VoiceRecorderProps {
    onRecordingComplete: (file: File) => void;
    maxDurationMinutes?: number;
}

export function VoiceRecorder({ onRecordingComplete, maxDurationMinutes = 2 }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPreparing, setIsPreparing] = useState(false);

    // Preview state
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<BlobPart[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const cleanup = useCallback(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
        }
    }, []);

    useEffect(() => {
        return () => {
            cleanup();
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [cleanup, previewUrl]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const startRecording = async () => {
        try {
            setError(null);
            setIsPreparing(true);
            // Clear any previous preview
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewFile(null);
            setPreviewUrl(null);
            setIsPlaying(false);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let options: MediaRecorderOptions | undefined = undefined;
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                options = { mimeType: "audio/webm;codecs=opus" };
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                options = { mimeType: "audio/mp4" };
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                options = { mimeType: "audio/webm" };
            }

            const mediaRecorder = new MediaRecorder(stream, options);

            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = () => {
                const finalMimeType = options?.mimeType || mediaRecorder.mimeType || "audio/mp4";
                const ext = finalMimeType.includes("webm") ? "webm" : "m4a";
                const blob = new Blob(chunksRef.current, { type: finalMimeType });
                const timestamp = Date.now();
                const file = new File([blob], `voice_note_${timestamp}.${ext}`, { type: finalMimeType });
                
                // Go to preview instead of immediate upload
                const url = URL.createObjectURL(blob);
                setPreviewFile(file);
                setPreviewUrl(url);
                cleanup();
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setIsPreparing(false);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const newTime = prev + 1;
                    if (newTime >= maxDurationMinutes * 60) {
                        stopRecording();
                        return prev;
                    }
                    return newTime;
                });
            }, 1000);

        } catch (err: any) {
            console.error("Audio recording error:", err);
            setError("Microphone access denied or unavailable.");
            setIsPreparing(false);
            cleanup();
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const togglePlayback = () => {
        if (!audioRef.current || !previewUrl) return;
        
        if (isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        } else {
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    const handleUpload = () => {
        if (previewFile) {
            onRecordingComplete(previewFile);
            if (previewUrl) URL.revokeObjectURL(previewUrl);
            setPreviewFile(null);
            setPreviewUrl(null);
            setIsPlaying(false);
        }
    };

    const handleDiscard = () => {
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewFile(null);
        setPreviewUrl(null);
        setIsPlaying(false);
        setRecordingTime(0);
    };

    // Error state
    if (error) {
        return (
            <button
                onClick={() => setError(null)}
                className="flex items-center justify-center gap-2 px-4 py-4 rounded-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 transition-colors"
                title={error}
            >
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm font-medium">Mic Error (Retry)</span>
            </button>
        );
    }

    // Preview state — listen, re-record, or upload
    if (previewFile && previewUrl) {
        return (
            <div className="flex items-center gap-2">
                <audio
                    ref={audioRef}
                    src={previewUrl}
                    onEnded={() => setIsPlaying(false)}
                    className="hidden"
                />
                
                {/* Play / Pause */}
                <button
                    onClick={togglePlayback}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-gradz-green/15 text-gradz-charcoal hover:bg-gradz-green/25 transition-colors"
                    title={isPlaying ? "Pause" : "Play"}
                >
                    {isPlaying ? (
                        <Pause className="w-4 h-4" fill="currentColor" />
                    ) : (
                        <Play className="w-4 h-4 ml-0.5" fill="currentColor" />
                    )}
                </button>

                {/* Duration label */}
                <span className="text-xs font-mono text-gradz-charcoal/60 tabular-nums min-w-[40px] text-center">
                    {formatTime(recordingTime)}
                </span>

                {/* Re-record */}
                <button
                    onClick={handleDiscard}
                    className="w-11 h-11 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                    title="Re-record"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>

                {/* Upload */}
                <button
                    onClick={handleUpload}
                    className="px-5 py-2.5 rounded-full bg-gradz-green text-gradz-charcoal font-semibold text-sm hover:brightness-95 transition-all flex items-center gap-1.5"
                    title="Upload voice note"
                >
                    <Upload className="w-4 h-4" />
                    Upload
                </button>
            </div>
        );
    }

    // Recording state
    if (isRecording) {
        return (
            <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 transition-colors group animate-pulse"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-red-700 font-medium tabular-nums w-12 text-center">
                        {formatTime(recordingTime)}
                    </span>
                </div>
                <div className="w-px h-5 bg-red-200" />
                <Square className="w-5 h-5 text-red-600 group-hover:scale-95 transition-transform drop-shadow-sm" fill="currentColor" />
            </button>
        );
    }

    // Idle state
    return (
        <button
            onClick={startRecording}
            disabled={isPreparing}
            className="flex items-center justify-center gap-2 px-6 py-4 rounded-full bg-gradz-green/10 text-gradz-charcoal font-medium hover:bg-gradz-green/20 transition-colors transform duration-200 disabled:opacity-50"
            title="Record Voice Note"
        >
            {isPreparing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <Mic className="w-5 h-5" />
            )}
            <span className="hidden sm:inline">Voice Note</span>
        </button>
    );
}
