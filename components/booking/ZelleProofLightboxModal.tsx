"use client";

import { X, ShieldCheck } from "lucide-react";
import { Booking } from "@/types";

interface ZelleProofLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  booking: Booking | null;
  proofType?: "deposit" | "balance";
  onClose: () => void;
}

export const ZelleProofLightboxModal = ({
  isOpen,
  imageUrl,
  booking,
  proofType = "deposit",
  onClose,
}: ZelleProofLightboxModalProps) => {
  if (!isOpen || !imageUrl || !booking) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-2xl p-6 max-w-lg w-full space-y-4 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-outline hover:text-on-surface p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <span className="text-[10px] uppercase tracking-widest font-extrabold text-purple-400 block flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            {proofType === "balance" ? "Remaining Balance Zelle Proof" : "Deposit Zelle Proof"}
          </span>
          <h3 className="text-xl font-headline italic text-on-surface">
            {booking.customerName}
          </h3>
          <p className="text-xs text-outline font-mono">Booking ID: {booking._id}</p>
        </div>

        <div className="rounded-xl overflow-hidden border border-outline-variant/20 bg-black max-h-[60vh] flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded Zelle Document Proof"
            className="max-h-[60vh] w-auto object-contain"
          />
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-outline border-t border-outline-variant/10">
          <span>Status: <strong className="text-primary capitalize">{booking.zelleVerificationStatus || "pending"}</strong></span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-xl font-bold uppercase tracking-wider text-[10px]"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
