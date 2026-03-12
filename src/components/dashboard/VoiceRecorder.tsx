"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, Square, Loader2, AlertCircle } from "lucide-react";

interface VoiceRecorderProps {
    onRecordingComplete: (file: File) => void;
    maxDurationMinutes?: number;
}

export function VoiceRecorder({ onRecordingComplete, maxDurationMinutes = 2 }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isPreparing, setIsPreparing] = useState(false);

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
        return cleanup;
    }, [cleanup]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const startRecording = async () => {
        try {
            setError(null);
            setIsPreparing(true);
            
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            let options: MediaRecorderOptions | undefined = undefined;
            if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
                options = { mimeType: "audio/webm;codecs=opus" };
            } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
                options = { mimeType: "audio/mp4" };
            } else if (MediaRecorder.isTypeSupported("audio/webm")) {
                options = { mimeType: "audio/webm" };
            } // Otherwise fallback to browser default

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
                
                onRecordingComplete(file);
                cleanup();
            };

            mediaRecorder.start(100); // collect 100ms chunks
            setIsRecording(true);
            setIsPreparing(false);
            setRecordingTime(0);

            // Start timer
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => {
                    const newTime = prev + 1;
                    if (newTime >= maxDurationMinutes * 60) {
                        stopRecording();
                        return prev; // don't update state to avoid jump before stop
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

    // If there's an error, show a small reset button
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

    if (isRecording) {
        return (
            <button
                onClick={stopRecording}
                className="flex items-center justify-center gap-3 px-6 py-4 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 transition-colors group animate-pulse"
            >
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-red-700 font-medium tabular-nums w-12 text-center">
                        {formatTime(recordingTime)}
                    </span>
                </div>
                <div className="w-px h-5 bg-red-200" />
                <Square className="w-5 h-5 text-red-600 group-hover:scale-95 transition-transform drop-shadow-sm" fill="currentColor" />
            </button>
        );
    }

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
