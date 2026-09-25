"use client";

import { ShieldCheck, X, AlertTriangle } from "lucide-react";

interface BookingPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept?: () => void;
  amount?: number;
}

export const BookingPolicyModal = ({ isOpen, onClose, onAccept, amount }: BookingPolicyModalProps) => {
  if (!isOpen) return null;

  const displayAmount = amount !== undefined ? `$${amount.toFixed(2)}` : "$200";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#111412] border-2 border-[#C8A96A]/40 rounded-2xl p-6 md:p-8 max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A]" />

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-6 h-6 text-[#C8A96A]" />
          </div>
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">Important Notice</span>
            <h2 className="font-headline italic text-2xl text-white">Booking &amp; Payment Policy</h2>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs md:text-sm text-white/80 font-body leading-relaxed">
          <div className="p-4 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
            <p className="font-semibold text-white">
              A <span className="text-[#C8A96A]">{displayAmount} USD payment</span> is required at the time of booking to reserve your event date with Tropica.
            </p>
          </div>

          <p>
            Once the <strong className="text-white">{displayAmount} payment</strong> is received, your selected date will be held for <strong className="text-[#C8A96A]">48 hours</strong> while the remaining booking requirements are completed.
          </p>

          <p>
            If the required booking process is not completed within 48 hours, the reservation may be canceled and the date released for another customer.
          </p>

          <div className="pt-2 border-t border-white/10 space-y-2">
            <h4 className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">Refund Processing</h4>
            <p className="text-white/70">
              If a payment is eligible for a refund, please allow up to 10 business days for the refund to be processed and returned to the original payment method.
            </p>
          </div>

          <p className="text-[11px] italic text-[#C8A96A] font-semibold">
            No event date is reserved without the required {displayAmount} payment.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {onAccept ? (
            <button
              onClick={() => {
                onAccept();
                onClose();
              }}
              className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all"
            >
              I Understand &amp; Agree ({displayAmount} Payment)
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all"
            >
              I Understand &amp; Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
