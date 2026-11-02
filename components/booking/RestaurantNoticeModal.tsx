"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { UtensilsCrossed, X, Building2, Receipt, Bell, Truck, ArrowRight } from "lucide-react";

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
  restaurantName = "Partner Restaurant & Menus",
  restaurantEmoji = "🍽️",
  restaurantCuisine = "Chef Curated Event Dining"
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
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto"
      style={{ height: "100dvh", minHeight: "100vh" }}
      onClick={onClose}
    >
      <div
        className="bg-[#0f1713] border border-[#C8A96A]/50 rounded-2xl p-4 sm:p-5 max-w-[390px] w-full space-y-3 relative overflow-hidden shadow-2xl my-auto animate-in zoom-in-95 duration-150 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold accent bar */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-base shrink-0 shadow-inner">
              {restaurantEmoji || <UtensilsCrossed className="w-4 h-4 text-[#C8A96A]" />}
            </div>
            <div className="min-w-0">
              <span className="font-label text-[9px] uppercase tracking-widest text-[#E3C281] font-bold block">
                Catering Notice
              </span>
              <h2 className="font-headline italic text-base sm:text-lg text-white leading-tight truncate">
                Menu &amp; Catering Info
              </h2>
            </div>
          </div>

          {/* Close Button */}
          <button
            onClick={onClose}
            type="button"
            className="text-white/50 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            aria-label="Close notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Restaurant Pill */}
        <div className="px-3 py-1.5 rounded-xl bg-white/[0.04] border border-[#C8A96A]/20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-base shrink-0">{restaurantEmoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{restaurantName}</p>
              <p className="text-[10px] text-white/50 truncate">{restaurantCuisine}</p>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 shrink-0 font-label">
            Add-on
          </span>
        </div>

        {/* 3 Tight Core Notice Points */}
        <div className="space-y-2 text-xs text-white/85 font-body">
          {/* Point 1: Not added to venue price */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#C8A96A]/10 border border-[#C8A96A]/25 flex items-center justify-center shrink-0 mt-0.5">
              <Building2 className="w-3.5 h-3.5 text-[#C8A96A]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-white text-xs">
                Venue Booking Covers Venue Only
              </p>
              <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
                The food platters are <strong>not included</strong> in the venue fee and are billed separately.
              </p>
            </div>
          </div>

          {/* Point 2: We will notify final dish price */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#E3C281]/10 border border-[#E3C281]/25 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-3.5 h-3.5 text-[#E3C281]" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-[#E3C281] text-xs">
                We Will Review &amp; Send Final Quote
              </p>
              <p className="text-[11px] text-white/70 mt-0.5 leading-snug">
                Pick your menu dishes; our team will review and <strong>notify you with final itemized pricing</strong>.
              </p>
            </div>
          </div>

          {/* Point 3: Confirm, Pay & Fresh Delivery */}
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-amber-300 text-xs">
                Confirm, Pay &amp; Delivered Fresh
              </p>
              <p className="text-[11px] text-white/80 mt-0.5 leading-snug">
                Once paid, the kitchen prepares and <strong>delivers platters hot directly to your event</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons - Compact Side by Side */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2.5 rounded-xl text-[11px] font-semibold bg-white/10 hover:bg-white/15 text-white/80 hover:text-white transition-all cursor-pointer font-label uppercase tracking-wider shrink-0"
          >
            Back
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] shadow-md transition-all cursor-pointer font-label active:scale-[0.99]"
          >
            <span>Continue to Menu</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
