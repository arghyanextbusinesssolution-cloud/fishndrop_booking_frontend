"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "primary";
}

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "primary",
}: ConfirmationModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-md bg-surface-container-lowest rounded-2xl overflow-hidden shadow-2xl border border-outline-variant/10 pointer-events-auto"
            >
              {/* Branded Header Area */}
              <div className="relative h-2 bg-gold-gradient" />
              
              <div className="p-8 space-y-6">
                <div className="flex items-start justify-between">
                  <div className={cn(
                    "p-3 rounded-xl",
                    variant === 'danger' ? "bg-error/10 text-error" : "bg-primary/10 text-primary"
                  )}>
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <button 
                    onClick={onClose}
                    className="p-2 hover:bg-surface-container-high rounded-full transition-colors text-outline"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-2">
                  <h3 className="font-headline text-3xl italic text-on-surface tracking-tight">
                    {title}
                  </h3>
                  <p className="font-body text-sm font-light text-secondary leading-relaxed italic">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    onClick={onConfirm}
                    className={cn(
                      "flex-1 px-6 py-3 rounded-lg font-label tracking-widest uppercase text-[10px] font-bold transition-all duration-300",
                      variant === 'danger' 
                        ? "bg-error text-on-error hover:bg-error/90 shadow-lg shadow-error/20" 
                        : "bg-gold-gradient text-on-primary shadow-lg shadow-primary/20"
                    )}
                  >
                    {confirmText}
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-6 py-3 rounded-lg font-label tracking-widest uppercase text-[10px] font-bold text-outline border border-outline-variant/20 hover:bg-surface-container-high transition-all"
                  >
                    {cancelText}
                  </button>
                </div>
              </div>

              {/* Decorative Footer */}
              <div className="px-8 py-4 bg-surface-container-low/50 border-t border-outline-variant/5 flex justify-center">
                <span className="text-[8px] uppercase tracking-[0.4em] text-outline/30 font-bold">
                  Tropica Sanctuary Experience
                </span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
