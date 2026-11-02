"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UtensilsCrossed, X, AlertCircle, Building2, Receipt, ArrowRight } from "lucide-react";

interface RestaurantNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  restaurantName?: string;
  restaurantEmoji?: string;
  restaurantCuisine?: string;
}

export function RestaurantNoticeModal({
  isOpen,
  onClose,
  onConfirm,
  restaurantName = "Partner Restaurant",
  restaurantEmoji = "🍽️",
  restaurantCuisine = "Catering Partner"
}: RestaurantNoticeModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-4 md:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto"
      style={{ height: "100dvh", minHeight: "100vh" }}
      onClick={onClose}
    >
      <div
        className="bg-[#0f1713] border-2 border-[#C8A96A]/60 rounded-2xl p-6 sm:p-7 max-w-lg w-full space-y-6 relative overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-white/50 hover:text-white p-1 rounded-lg transition-colors"
          aria-label="Close notice"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center flex-shrink-0 text-2xl shadow-inner">
            {restaurantEmoji || <UtensilsCrossed className="w-6 h-6 text-[#C8A96A]" />}
          </div>
          <div>
            <span className="font-label text-[10px] uppercase tracking-widest text-amber-400 font-bold block">
              Important Catering Notice
            </span>
            <h2 className="font-headline italic text-2xl sm:text-3xl text-white leading-tight">
              Catering is an Add-on Service
            </h2>
          </div>
        </div>

        {/* Selected Restaurant Pill */}
        <div className="p-3 rounded-xl bg-white/[0.04] border border-[#C8A96A]/30 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{restaurantEmoji}</span>
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">{restaurantName}</p>
              <p className="text-[10px] text-white/60">{restaurantCuisine}</p>
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-wider font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            Add-on Option
          </span>
        </div>

        {/* Core Notice Points */}
        <div className="space-y-3 text-xs sm:text-sm text-white/85 font-body">
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
            <Building2 className="w-5 h-5 text-[#C8A96A] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">
                Website Booking Covers Venue Only
              </p>
              <p className="text-[11px] sm:text-xs text-white/70 mt-0.5 leading-relaxed">
                The reservation fee and deposit on this website only contain the <strong>private sanctuary venue rental</strong> and hours.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-start gap-3">
            <Receipt className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-white text-xs sm:text-sm">
                Restaurant Menu &amp; Dishes Are Extra Cost
              </p>
              <p className="text-[11px] sm:text-xs text-white/70 mt-0.5 leading-relaxed">
                Catering is an <strong>add-on</strong> and is <strong>not included in the venue price</strong>. Food and drink charges will be billed separately by the restaurant.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-amber-300 text-xs sm:text-sm">
                Cost Notification After Menu Selection
              </p>
              <p className="text-[11px] sm:text-xs text-white/80 mt-0.5 leading-relaxed">
                After you choose your dishes or platters in the next step, the restaurant partner will review your order and <strong>notify you directly with the dish pricing and invoice</strong> prior to your event.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all order-2 sm:order-1"
          >
            Cancel / Keep Venue Only
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-bold uppercase tracking-wider bg-gold-gradient text-black hover:brightness-110 shadow-lg transition-all order-1 sm:order-2"
          >
            <span>I Understand &amp; Add Catering</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
