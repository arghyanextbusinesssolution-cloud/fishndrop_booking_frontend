"use client";

import { useEffect } from "react";
import { AlertTriangle, Trash2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    variant?: "danger" | "warning";
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    variant = "danger",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [open, onCancel]);

    if (!open) return null;

    const Icon = variant === "danger" ? Trash2 : AlertTriangle;
    const iconBg = variant === "danger" ? "bg-red-500/10" : "bg-amber-500/10";
    const iconColor = variant === "danger" ? "text-red-400" : "text-amber-400";
    const confirmBg = variant === "danger"
        ? "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/30"
        : "bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30";

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            onClick={onCancel}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

            {/* Dialog */}
            <div
                className="relative w-full max-w-sm rounded-2xl border border-outline-variant/20 bg-surface-container-lowest shadow-2xl shadow-black/60 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Top accent bar */}
                <div className={cn("h-1 w-full", variant === "danger" ? "bg-red-500" : "bg-amber-500")} />

                <div className="p-8 space-y-6">
                    {/* Icon + Title */}
                    <div className="flex items-center gap-4">
                        <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", iconBg)}>
                            <Icon className={cn("w-5 h-5", iconColor)} strokeWidth={1.5} />
                        </div>
                        <div>
                            <p className="font-label text-[9px] uppercase tracking-[0.25em] text-outline font-bold mb-0.5">
                                Confirmation Required
                            </p>
                            <h2 className="font-headline text-xl italic text-on-surface leading-tight">
                                {title}
                            </h2>
                        </div>
                    </div>

                    {/* Message */}
                    <p className="font-body text-sm text-secondary leading-relaxed pl-[60px]">
                        {message}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            onClick={onCancel}
                            className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/60 transition-all duration-300"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            className={cn(
                                "px-6 py-2.5 rounded-full text-[9px] uppercase tracking-widest font-bold transition-all duration-300 hover:scale-[1.03] active:scale-95",
                                confirmBg
                            )}
                        >
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
