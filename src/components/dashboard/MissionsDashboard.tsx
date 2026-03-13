"use client";

import { useState, useRef } from "react";
import { Camera, Video, Mic, ChevronRight, CheckCircle2, Loader2, FileIcon, X, AlertCircle } from "lucide-react";
import { godModeConfig } from "@/config/god-mode";
import { registerUploadedFileAction } from "@/app/actions/vault";
import { CameraCapture } from "./CameraCapture";
import { VoiceRecorder } from "./VoiceRecorder";

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

type MissionType = "photo" | "video" | "audio";

interface Mission {
    id: string;
    title: string;
    description: string;
    type: MissionType;
    quantity: number;
    icon: typeof Camera;
}

const MISSIONS: Mission[] = [
    {
        id: "street-food",
        title: "Indian Street Food Carts",
        description: "Capture a clear photo of a street food cart or vendor in daylight",
        type: "photo",
        quantity: 5,
        icon: Camera,
    },
    {
        id: "traffic",
        title: "Traffic at Intersections",
        description: "Record 30 seconds of an active traffic intersection",
        type: "video",
        quantity: 3,
        icon: Video,
    },
    {
        id: "hindi-read",
        title: "Read Aloud in Hindi",
        description: "Record yourself reading a sentence clearly in Hindi",
        type: "audio",
        quantity: 10,
        icon: Mic,
    },
    {
        id: "pharmacy",
        title: "Pharmacy & Medical Shops",
        description: "Photograph pharmacy storefronts showing signage clearly",
        type: "photo",
        quantity: 5,
        icon: Camera,
    },
    {
        id: "market-crowds",
        title: "Local Market Crowds",
        description: "Record busy market or bazaar scenes for 20-30 seconds",
        type: "video",
        quantity: 3,
        icon: Video,
    },
    {
        id: "regional-lang",
        title: "Regional Language Audio",
        description: "Speak naturally in your regional language for 30 seconds",
        type: "audio",
        quantity: 10,
        icon: Mic,
    },
];

interface FileUploadState {
    file: File;
    progress: number;
    status: "pending" | "registering" | "done" | "error";
    error?: string;
}

function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const CARD_COLORS = { bg: "bg-gradz-cream/30", text: "text-gradz-charcoal", badge: "bg-gradz-charcoal/10 text-gradz-charcoal", border: "border-gradz-charcoal/15" };

const TYPE_LABELS: Record<MissionType, string> = {
    photo: "📸 Photo",
    video: "🎥 Video",
    audio: "🎙️ Audio",
};

export function MissionsDashboard({ referralCode = "" }: { referralCode?: string }) {
    const [activeMissionId, setActiveMissionId] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [completedCounts, setCompletedCounts] = useState<Record<string, number>>({});

    // Upload state
    const [uploads, setUploads] = useState<FileUploadState[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadDone, setUploadDone] = useState(false);
    const [totalSizeMB, setTotalSizeMB] = useState(0);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [globalError, setGlobalError] = useState<string | null>(null);

    const photoInputRef = useRef<HTMLInputElement>(null);

    const startMission = (mission: Mission) => {
        setActiveMissionId(mission.id);
        setUploadDone(false);
        setGlobalError(null);

        if (mission.type === "photo") {
            photoInputRef.current?.click();
        } else if (mission.type === "video") {
            setShowCamera(true);
        } else if (mission.type === "audio") {
            setShowVoiceRecorder(true);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            startUpload(e.target.files);
        }
        // Reset input so the same file can be selected again
        if (photoInputRef.current) photoInputRef.current.value = "";
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
        setShowVoiceRecorder(false);
        const dt = new DataTransfer();
        dt.items.add(file);
        startUpload(dt.files);
    };

    const startUpload = async (fileList: FileList) => {
        const files = Array.from(fileList).slice(0, 13);
        if (files.length === 0) return;

        const totalBytes = files.reduce((acc, f) => acc + f.size, 0);
        if (totalBytes > 2 * 1024 * 1024 * 1024) {
            setGlobalError("Upload batch exceeds 2GB limit.");
            return;
        }

        const states: FileUploadState[] = files.map((f) => ({
            file: f,
            progress: 0,
            status: "pending" as const,
        }));

        setUploads(states);
        setIsUploading(true);
        setUploadDone(false);
        setGlobalError(null);

        let combinedSizeMB = 0;
        let combinedEarnings = 0;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = "Upload in progress.";
        };
        window.addEventListener("beforeunload", handleBeforeUnload);

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            setUploads((prev) => {
                const next = [...prev];
                next[i] = { ...next[i], status: "registering", progress: 30 };
                return next;
            });

            try {
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
                    throw new Error(errorData.error || "Upload failed");
                }

                const registerData = await res.json();
                const uniqueFileName = registerData.uniqueFileName;

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
            } catch (err: any) {
                setUploads((prev) => {
                    const next = [...prev];
                    next[i] = { ...next[i], status: "error", progress: 100, error: err.message };
                    return next;
                });
            }
        }

        window.removeEventListener("beforeunload", handleBeforeUnload);

        setTotalSizeMB(Math.round(combinedSizeMB * 100) / 100);
        setTotalEarnings(combinedEarnings);
        setIsUploading(false);
        setUploadDone(true);

        // Update completed count for the active mission
        if (activeMissionId) {
            const successCount = files.length; // approximate
            setCompletedCounts((prev) => ({
                ...prev,
                [activeMissionId]: (prev[activeMissionId] || 0) + successCount,
            }));
        }
    };

    const activeMission = MISSIONS.find((m) => m.id === activeMissionId);
    const isShowingUploadState = isUploading || uploadDone || globalError;

    return (
        <div className="space-y-4">
            {/* Hidden native photo input */}
            <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handlePhotoSelect}
            />

            {/* Upload Progress Overlay */}
            {isShowingUploadState && (
                <div className="bg-white border-2 border-gradz-charcoal/10 rounded-2xl p-6 space-y-4">
                    {activeMission && (
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-mono text-gradz-charcoal/50 uppercase tracking-widest">
                                Mission: {activeMission.title}
                            </span>
                        </div>
                    )}

                    {isUploading && (
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
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
                                                            <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                                                        </span>
                                                    ) : (
                                                        `${u.progress}%`
                                                    )}
                                                </span>
                                            </div>
                                            <div className="w-full h-1.5 bg-gradz-charcoal/10 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-300 ${u.status === "error" ? "bg-red-400" : u.status === "done" ? "bg-gradz-green" : "bg-gradz-green/70"}`}
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

                    {globalError && (
                        <div className="flex flex-col items-center text-red-500">
                            <AlertCircle className="w-12 h-12 mb-3" />
                            <p className="text-sm font-medium mb-4 text-center">{globalError}</p>
                            <button
                                onClick={() => { setGlobalError(null); setUploads([]); setActiveMissionId(null); }}
                                className="px-5 py-2 bg-red-50 text-red-600 rounded-full font-semibold hover:bg-red-100 transition-colors text-sm"
                            >
                                Try Again
                            </button>
                        </div>
                    )}

                    {uploadDone && !isUploading && (
                        <div className="flex flex-col items-center">
                            <CheckCircle2 className="w-14 h-14 mb-3 text-gradz-green" />
                            <h3 className="text-lg font-bold text-gradz-charcoal mb-1">Upload Complete</h3>
                            <p className="text-gradz-charcoal/60 text-sm mb-4">
                                {uploads.filter((u) => u.status === "done").length} file{uploads.filter((u) => u.status === "done").length > 1 ? "s" : ""} secured.
                            </p>

                            <div className="w-full bg-gradz-cream border border-gradz-charcoal/10 rounded-xl p-4 flex justify-between items-center mb-4">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Total Uploaded</span>
                                    <span className="text-gradz-charcoal font-semibold">{totalSizeMB > 1024 ? `${(totalSizeMB / 1024).toFixed(2)} GB` : `${totalSizeMB} MB`}</span>
                                </div>
                                <div className="h-8 w-px bg-gradz-charcoal/10 mx-4" />
                                <div className="flex flex-col text-right">
                                    <span className="text-[10px] font-mono text-gradz-charcoal/50 uppercase tracking-widest mb-1">Asset Value</span>
                                    <span className="text-gradz-green font-bold text-lg">₹{((totalEarnings / 6) * (referralCode ? getUserVariationFactor(referralCode) : 1.0)).toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={() => { setUploadDone(false); setUploads([]); setActiveMissionId(null); }}
                                className="px-6 py-2.5 bg-gradz-charcoal text-gradz-cream rounded-full font-semibold hover:bg-black transition-colors text-sm"
                            >
                                Back to Missions
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Mission Cards Grid */}
            {!isShowingUploadState && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {MISSIONS.map((mission) => {
                        const completed = completedCounts[mission.id] || 0;
                        const isDone = completed >= mission.quantity;
                        const colors = CARD_COLORS;
                        const Icon = mission.icon;

                        return (
                            <div
                                key={mission.id}
                                className={`relative rounded-2xl border-2 ${isDone ? "border-gradz-green/30 bg-gradz-green/5" : `${colors.border} ${colors.bg}`} p-5 flex flex-col gap-3 transition-all hover:shadow-md`}
                            >
                                {/* Type Badge & Progress */}
                                <div className="flex items-center justify-between">
                                    <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${colors.badge}`}>
                                        {TYPE_LABELS[mission.type]}
                                    </span>
                                    <span className="text-xs font-mono text-gradz-charcoal/50">
                                        {Math.min(completed, mission.quantity)}/{mission.quantity}
                                    </span>
                                </div>

                                {/* Title & Description */}
                                <div>
                                    <h4 className="text-base font-bold text-gradz-charcoal leading-tight mb-1">
                                        {mission.title}
                                    </h4>
                                    <p className="text-xs text-gradz-charcoal/60 leading-relaxed">
                                        {mission.description}
                                    </p>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full h-1.5 bg-gradz-charcoal/10 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${isDone ? "bg-gradz-green" : "bg-gradz-charcoal/30"}`}
                                        style={{ width: `${Math.min((completed / mission.quantity) * 100, 100)}%` }}
                                    />
                                </div>

                                {/* Action Button */}
                                <button
                                    onClick={() => startMission(mission)}
                                    disabled={isDone}
                                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                                        isDone
                                            ? "bg-gradz-green/20 text-gradz-green cursor-default"
                                            : "bg-gradz-charcoal text-white hover:bg-black active:scale-[0.98]"
                                    }`}
                                >
                                    {isDone ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            Completed
                                        </>
                                    ) : (
                                        <>
                                            <Icon className="w-4 h-4" />
                                            Start Mission
                                            <ChevronRight className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Camera Overlay */}
            {showCamera && (
                <CameraCapture
                    onCapture={handleCameraCapture}
                    onClose={() => setShowCamera(false)}
                    maxPhotos={5}
                />
            )}

            {/* Voice Recorder */}
            {showVoiceRecorder && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="font-bold text-gradz-charcoal">Record Audio</h4>
                            <button onClick={() => setShowVoiceRecorder(false)} className="text-gradz-charcoal/40 hover:text-gradz-charcoal">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        {activeMission && (
                            <p className="text-xs text-gradz-charcoal/60 mb-4">{activeMission.description}</p>
                        )}
                        <VoiceRecorder
                            onRecordingComplete={handleVoiceNote}
                            maxDurationMinutes={2}
                            autoStart
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
