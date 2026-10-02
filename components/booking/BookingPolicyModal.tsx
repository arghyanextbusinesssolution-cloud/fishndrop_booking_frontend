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

  const displayAmount = amount !== undefined ? `$${amount.toFixed(2)}` : "$300";

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
            <span className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">Package &amp; Deposit Policy</span>
            <h2 className="font-headline italic text-2xl text-white">Tropica October Booking Special</h2>
          </div>
        </div>

        {/* Policy Content */}
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 text-xs md:text-sm text-white/80 font-body leading-relaxed">
          <div className="p-4 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-sm">
                Tropica October Booking Special — <span className="text-[#C8A96A]">$1,000 Total</span>
              </p>
              <p className="text-xs text-white/70 mt-0.5">
                Includes <strong className="text-white">5 hours total</strong> (with 1 complimentary extra hour) &amp; <strong className="text-white">2 bottles of champagne</strong>.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs border border-white/10 rounded-xl p-3 bg-white/5">
            <div>
              <p className="text-white/50 uppercase tracking-widest text-[9px] font-bold">Total Price</p>
              <p className="text-white font-bold text-base">$1,000</p>
            </div>
            <div>
              <p className="text-white/50 uppercase tracking-widest text-[9px] font-bold">Deposit to Secure</p>
              <p className="text-[#C8A96A] font-bold text-base">{displayAmount}</p>
            </div>
            <div>
              <p className="text-white/50 uppercase tracking-widest text-[9px] font-bold">Remaining Balance</p>
              <p className="text-white font-bold text-base">$700</p>
            </div>
            <div>
              <p className="text-white/50 uppercase tracking-widest text-[9px] font-bold">Duration</p>
              <p className="text-white font-bold text-base">5 Hours Total</p>
            </div>
          </div>

          <div className="space-y-2 border-t border-white/10 pt-3">
            <h4 className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">Cancellation &amp; Refund Rules</h4>
            <ul className="space-y-1.5 list-disc pl-4 text-xs text-white/80">
              <li>
                <strong className="text-white">Refund Window:</strong> Customers can cancel within <strong className="text-[#C8A96A]">48 hours of booking</strong> for a full refund.
              </li>
              <li>
                <strong className="text-white">After 48 Hours:</strong> The <strong className="text-red-400">$300 deposit is strictly non-refundable</strong>.
              </li>
              <li>
                <strong className="text-white">Balance Deadline:</strong> Pay the remaining <strong className="text-[#C8A96A]">$700 at least 72 hours before the event</strong>.
              </li>
              <li>
                <strong className="text-white">Unpaid Balance:</strong> If the remaining balance is unpaid 72 hours prior to the event, the reservation <strong className="text-amber-400">may be canceled</strong>.
              </li>
            </ul>
          </div>

          <p className="text-[11px] italic text-[#C8A96A] font-semibold pt-1">
            No event date is reserved without securing the required {displayAmount} deposit.
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
              I Understand &amp; Agree ({displayAmount} Deposit)
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
