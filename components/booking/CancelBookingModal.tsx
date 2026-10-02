"use client";

import { useState } from "react";
import { Booking } from "@/types";
import { AlertTriangle, ShieldAlert, X, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface CancelBookingModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onConfirmCancel: (bookingId: string) => Promise<void>;
}

export const CancelBookingModal = ({
  isOpen,
  booking,
  onClose,
  onConfirmCancel,
}: CancelBookingModalProps) => {
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !booking) return null;

  const createdAtDate = booking.createdAt ? new Date(booking.createdAt) : new Date();
  const elapsedHours = (Date.now() - createdAtDate.getTime()) / (1000 * 60 * 60);
  const isWithin48Hours = elapsedHours <= 48;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirmCancel(booking._id);
      onClose();
    } catch {
      // Error handled by parent
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 md:p-8 max-w-lg w-full space-y-6 relative shadow-2xl">
        <button
          onClick={onClose}
          disabled={submitting}
          className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 border",
              isWithin48Hours
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                : "bg-amber-500/10 border-amber-500/30 text-amber-500"
            )}
          >
            {isWithin48Hours ? (
              <ShieldAlert className="w-6 h-6" />
            ) : (
              <AlertTriangle className="w-6 h-6" />
            )}
          </div>
          <div>
            <span
              className={cn(
                "text-[10px] uppercase tracking-widest font-bold block",
                isWithin48Hours ? "text-emerald-500" : "text-amber-500"
              )}
            >
              {isWithin48Hours ? "Eligible For Refund (Within 48 Hours)" : "Non-Refundable Window (After 48 Hours)"}
            </span>
            <h2 className="font-headline italic text-2xl text-on-surface">
              {isWithin48Hours ? "Cancel Reservation" : "Cancel Reservation (No Refund)"}
            </h2>
          </div>
        </div>

        {/* Booking Creation & Event Info */}
        <div className="p-4 rounded-xl bg-surface-container-low/50 border border-outline-variant/10 space-y-2 text-xs">
          <div className="flex justify-between items-center text-outline">
            <span>Booking Made On:</span>
            <span className="font-mono text-on-surface font-semibold">
              {createdAtDate.toLocaleString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
              })}
            </span>
          </div>
          <div className="flex justify-between items-center text-outline">
            <span>Time Elapsed Since Booking:</span>
            <span className="font-bold text-primary font-mono">
              {elapsedHours < 1
                ? `${Math.round(elapsedHours * 60)} minutes ago`
                : `${elapsedHours.toFixed(1)} hours ago`}
            </span>
          </div>
          <div className="flex justify-between items-center text-outline border-t border-outline-variant/10 pt-2">
            <span>Event Date:</span>
            <span className="text-on-surface font-semibold">
              {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}{" "}
              at {booking.bookingTime}
            </span>
          </div>
        </div>

        {/* Dynamic Cancellation Message */}
        {isWithin48Hours ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2 text-xs text-emerald-300">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-emerald-200">Refund Notice:</strong> Your money will be refunded according to our terms and conditions because this cancellation is made within 48 hours of booking.
              </p>
            </div>
            <p className="text-[11px] text-emerald-400/80 italic pl-6">
              For details, please check our terms and conditions policy.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 text-xs text-amber-300">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-amber-200">No Refund Warning:</strong> Note: Since more than 48 hours have passed since you made this booking, no money will be refunded for this cancellation as per our terms and conditions.
              </p>
            </div>
            <p className="text-[11px] text-amber-400/80 italic pl-6">
              Your deposit and any paid balance are non-refundable after the 48-hour window from booking creation time.
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="w-full sm:w-1/2 py-3.5 rounded-xl border border-outline-variant/30 text-outline hover:text-on-surface hover:border-outline-variant/60 text-xs font-bold uppercase tracking-widest transition-all"
          >
            Keep Reservation
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={submitting}
            className={cn(
              "w-full sm:w-1/2 py-3.5 rounded-xl text-white font-bold text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2",
              isWithin48Hours
                ? "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-900/30"
                : "bg-red-600 hover:bg-red-700 shadow-red-900/30"
            )}
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isWithin48Hours ? (
              "Confirm & Cancel (Refund)"
            ) : (
              "Confirm & Cancel (No Refund)"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
