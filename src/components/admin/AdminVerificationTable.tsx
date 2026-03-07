"use client";

import { useState } from "react";
import { PendingFile } from "@/app/actions/admin";
import { CheckCircle2, XCircle, Loader2, Image as ImageIcon, Video, FolderGit2, FileUp } from "lucide-react";
import { approveFileAction, rejectFileAction } from "@/app/actions/admin";

interface AdminVerificationTableProps {
    files: PendingFile[];
    photoCount: number;
    videoCount: number;
}

export function AdminVerificationTable({ files, photoCount, videoCount }: AdminVerificationTableProps) {
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    const handleAction = async (fileId: string, action: "approve" | "reject") => {
        setProcessingIds(prev => new Set(prev).add(fileId));
        
        try {
            if (action === "approve") {
                await approveFileAction(fileId);
            } else {
                await rejectFileAction(fileId);
            }
        } catch (error) {
            console.error(`Failed to ${action} file:`, error);
            alert(`Error: Failed to ${action} file`);
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(fileId);
                return next;
            });
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes >= 1024 * 1024 * 1024) return (bytes / (1024 * 1024 * 1024)).toFixed(2) + " GB";
        if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + " MB";
        return (bytes / 1024).toFixed(0) + " KB";
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString("en-US", {
            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
        });
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-gray-50 rounded-lg">
                        <FolderGit2 className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Pending Files</div>
                        <div className="text-xl font-bold">{files.length}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-blue-50 rounded-lg">
                        <ImageIcon className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Photos</div>
                        <div className="text-xl font-bold">{photoCount}</div>
                    </div>
                </div>
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-3">
                    <div className="p-2.5 bg-purple-50 rounded-lg">
                        <Video className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                        <div className="text-xs uppercase font-bold text-gray-400 tracking-wider">Videos</div>
                        <div className="text-xl font-bold">{videoCount}</div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/50 border-b border-gray-200">
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">File Details</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploader</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Category & Size</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider">Uploaded</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {files.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-gray-400">
                                        <div className="flex flex-col items-center justify-center">
                                            <CheckCircle2 className="w-10 h-10 text-green-300 mb-3" />
                                            <p className="text-lg font-medium text-gray-600">All caught up!</p>
                                            <p className="text-sm">There are no files pending verification right now.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                files.map((file) => (
                                    <tr key={file.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 px-6 font-medium text-sm text-gray-900 truncate max-w-[200px]" title={file.file_name}>
                                            {file.file_name}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="text-sm font-medium text-gray-900">{file.profiles?.display_name || 'Unknown User'}</div>
                                            <div className="text-xs text-gray-500">{file.profiles?.email || 'No email provided'}</div>
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                {file.file_category === 'image' ? (
                                                    <ImageIcon className="w-4 h-4 text-blue-500" />
                                                ) : file.file_category === 'video' ? (
                                                    <Video className="w-4 h-4 text-purple-500" />
                                                ) : (
                                                    <FileUp className="w-4 h-4 text-gray-400" />
                                                )}
                                                <span className="text-sm capitalize font-medium text-gray-700">{file.file_category}</span>
                                            </div>
                                            <span className="text-xs text-gray-500 font-mono tracking-wider">{formatSize(file.file_size)}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-500">
                                            {formatDate(file.created_at)}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center justify-end gap-2">
                                                {processingIds.has(file.id) ? (
                                                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                                                ) : (
                                                    <>
                                                        <button 
                                                            onClick={() => handleAction(file.id, 'reject')}
                                                            title="Reject File"
                                                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                        >
                                                            <XCircle className="w-5 h-5" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleAction(file.id, 'approve')}
                                                            title="Approve File & Distribute Earnings"
                                                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                        >
                                                            <CheckCircle2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
