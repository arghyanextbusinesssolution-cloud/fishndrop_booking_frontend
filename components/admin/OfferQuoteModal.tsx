"use client";

import { useState } from "react";
import { Booking } from "@/types";
import api from "@/lib/axios";
import toast from "react-hot-toast";
import { parseCateringDetails } from "@/lib/cateringRestaurants";
import { formatTimeTo12Hour, formatBookingDate } from "@/lib/utils";
import {
  X,
  DollarSign,
  UtensilsCrossed,
  Music,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Camera,
  Plus,
  Minus
} from "lucide-react";

interface OfferQuoteModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: (updated: Booking) => void;
}

export function OfferQuoteModal({ isOpen, booking, onClose, onSuccess }: OfferQuoteModalProps) {
  const initialBase = booking?.foodBasePrice !== undefined
    ? String(booking.foodBasePrice)
    : (booking?.offerPrice !== undefined ? String(Math.max(0, booking.offerPrice - 50)) : (booking ? String(booking.totalAmount) : ""));

  const [basePriceInput, setBasePriceInput] = useState<string>(initialBase);
  const [notes, setNotes] = useState<string>(booking?.negotiationNotes || "");
  const [saving, setSaving] = useState(false);

  const cateringInfo = booking ? parseCateringDetails(booking) : parseCateringDetails({ cateringMenu: "none" });
  const [dishQtys, setDishQtys] = useState<Record<string, number>>(() => {
    return cateringInfo.dishQuantities || {};
  });

  if (!isOpen || !booking) return null;

  const parsedBase = parseFloat(basePriceInput) || 0;
  const markupFee = 50;
  const totalCustomerQuote = parsedBase > 0 ? parsedBase + markupFee : 0;

  const updateDishQty = (dishName: string, delta: number) => {
    setDishQtys((prev) => {
      const current = prev[dishName] || 1;
      const nextVal = Math.max(1, Math.min(50, current + delta));
      return { ...prev, [dishName]: nextVal };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedBase <= 0) {
      toast.error("Please enter a valid base price");
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch(`/admin/bookings/${booking._id}/offer`, {
        offerPrice: totalCustomerQuote,
        basePrice: parsedBase,
        alreadyHasMarkup: true,
        negotiationNotes: notes.trim(),
        dishQuantities: dishQtys
      });

      if (data.success) {
        toast.success(`Quote ($${totalCustomerQuote.toFixed(2)}) sent to guest & dispatched to GHL!`);
        onSuccess(data.booking || {
          ...booking,
          foodBasePrice: parsedBase,
          foodServiceFee: markupFee,
          offerPrice: totalCustomerQuote,
          negotiationNotes: notes.trim(),
          offerStatus: "offered",
          dishQuantities: dishQtys,
          foodPaymentStatus: booking.foodPaymentStatus || "unpaid"
        });
        onClose();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update offer quote");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#121417] border border-[#C8A96A]/30 rounded-2xl max-w-2xl w-full p-6 sm:p-8 space-y-6 relative shadow-2xl text-on-surface max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-surface-container text-outline hover:text-on-surface transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-primary/10 text-primary border border-primary/25">
              Quote &amp; Pricing Management
            </span>
            <span className="text-xs font-mono text-outline">#{booking._id.slice(-6).toUpperCase()}</span>
          </div>
          <h2 className="text-2xl font-headline italic text-on-surface font-normal">
            Offer Quote for {booking.customerName}
          </h2>
          <p className="text-xs text-secondary font-body">
            Input the base catering cost. Tropica automatically adds +$50 extra catering fee before presenting the final quote to the guest.
          </p>
        </div>

        {/* Event Summary Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-surface-container-low/60 border border-outline-variant/15 text-xs">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">Event Date</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-on-surface font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{formatBookingDate(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
            <span className="text-[11px] text-secondary flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3" /> {formatTimeTo12Hour(booking.bookingTime)} ({booking.durationHours || 5}h)
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">Guests &amp; Occasion</span>
            <div className="flex items-center gap-1.5 mt-0.5 text-on-surface font-medium">
              <Users className="w-3.5 h-3.5 text-primary shrink-0" />
              <span>{booking.partySize} Guests</span>
            </div>
            <span className="text-[11px] text-secondary capitalize block mt-0.5">
              ✨ {booking.occasion}
            </span>
          </div>

          <div>
            <span className="text-[10px] uppercase tracking-wider text-outline block font-bold">Venue Total &amp; Deposit</span>
            <div className="mt-0.5 font-headline text-sm italic text-on-surface font-bold">
              ${(booking.totalAmount || 0).toFixed(2)} Total
            </div>
            <div className="text-[10px] text-secondary">
              <span className="text-emerald-400 font-bold">✓ ${(booking.depositAmount || 300).toFixed(2)} Paid</span>
              {(booking.remainingAmount ?? 0) > 0 && <span className="text-amber-400 font-bold block">${booking.remainingAmount} Venue Bal.</span>}
              <div className="flex flex-wrap gap-1 pt-0.5 text-[9px] text-[#C8A96A] font-semibold">
                {booking.needDj && <span>• Incl. DJ (+$300)</span>}
                {booking.needPhotographer && <span>• Incl. 📷 Photo (+${300 + Math.max(0, (booking.photographerHours || 2) - 2) * 150})</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Catering Details */}
        <div className="p-4 rounded-xl bg-surface-container-low/40 border border-outline-variant/10 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase tracking-wider text-outline font-bold flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-primary" />
              Restaurant &amp; Selected Dishes
            </span>
            <span className="font-semibold text-primary">{cateringInfo.restaurantLabel}</span>
          </div>

          {cateringInfo.dishes.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {cateringInfo.dishes.map((dish, i) => {
                const qty = dishQtys[dish] || 1;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 text-on-surface text-xs"
                  >
                    <span className="font-medium text-white/90">{dish}</span>
                    <div className="flex items-center gap-1 bg-black/40 px-1.5 py-0.5 rounded border border-white/15">
                      <button
                        type="button"
                        onClick={() => updateDishQty(dish, -1)}
                        className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10"
                        title="Decrease platters"
                      >
                        <Minus className="w-2.5 h-2.5" />
                      </button>
                      <span className="font-bold text-[#C8A96A] text-[11px] min-w-[14px] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateDishQty(dish, 1)}
                        className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-white hover:bg-white/10"
                        title="Increase platters"
                      >
                        <Plus className="w-2.5 h-2.5" />
                      </button>
                    </div>
                    <span className="text-[10px] text-white/40">
                      {qty === 1 ? "platter" : "platters"}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-secondary italic">No custom dishes chosen yet.</p>
          )}

          {cateringInfo.dietaryNotes && (
            <p className="text-xs text-amber-300/80 pt-1">
              <strong>Dietary Notes:</strong> {cateringInfo.dietaryNotes}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-outline-variant/10 text-xs text-secondary">
            <div className="flex items-center gap-1.5">
              <Music className="w-3.5 h-3.5 text-primary" />
              <span>{booking.needDj ? "DJ Service Requested (+$300 included in venue total)" : "No DJ service"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-[#C8A96A]" />
              <span className={booking.needPhotographer ? "text-[#E8CB8A] font-semibold" : ""}>
                {booking.needPhotographer
                  ? `📷 Photographer: ${booking.photographerHours || 2} hrs (+${300 + Math.max(0, (booking.photographerHours || 2) - 2) * 150} included in venue total)`
                  : "No photographer"}
              </span>
            </div>
          </div>
        </div>

        {/* Existing Quote Banner if set */}
        {booking.offerPrice && (
          <div className="p-3.5 rounded-xl bg-gold-gradient/10 border border-primary/30 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-primary font-bold block">Current Active Quote</span>
              <span className="text-secondary text-[11px]">Status: {booking.offerStatus || "offered"} · Food Payment: {booking.foodPaymentStatus || "unpaid"}</span>
            </div>
            <div className="text-right">
              <span className="font-headline text-xl italic font-bold text-primary">${booking.offerPrice.toFixed(2)}</span>
              {booking.foodBasePrice && (
                <span className="block text-[10px] text-outline">(${booking.foodBasePrice.toFixed(2)} base + $50 fee)</span>
              )}
            </div>
          </div>
        )}

        {/* Quote Form */}
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-outline font-bold block">
              Base Food / Catering Quote ($ USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary font-bold">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={basePriceInput}
                onChange={(e) => setBasePriceInput(e.target.value)}
                placeholder="e.g. 350.00"
                className="w-full pl-9 pr-4 py-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface text-base font-semibold focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            
            {/* Automatic +$50 Live Calculation Box */}
            {parsedBase > 0 && (
              <div className="p-3.5 rounded-xl bg-surface-container-low/80 border border-primary/30 space-y-2 text-xs animate-in fade-in">
                <div className="flex justify-between items-center text-secondary text-xs">
                  <span>Base Food Cost (Restaurant):</span>
                  <span className="font-mono text-on-surface font-semibold">${parsedBase.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-[#C8A96A] text-xs font-bold">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Automatic Tropica Catering Fee (+ $50 extra):
                  </span>
                  <span className="font-mono">+${markupFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-outline-variant/15 font-bold">
                  <span className="uppercase text-[11px] tracking-wider text-primary">Total Delivered Quote to Guest:</span>
                  <span className="font-headline text-2xl italic text-[#C8A96A]">${totalCustomerQuote.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-wider text-outline font-bold block">
              Quote Notes &amp; Inclusions for Guest
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Includes full Jerk Chicken buffet for 40 guests, 2 customized platters, plus complimentary island punch."
              className="w-full p-3 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-on-surface text-xs font-body focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-2.5 rounded-full border border-outline-variant/30 text-secondary text-xs font-bold uppercase tracking-widest hover:text-on-surface hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-full bg-[#C8A96A] hover:bg-[#d8b97a] text-black text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Quote...</span>
                </>
              ) : (
                <>
                  <DollarSign className="w-4 h-4" />
                  <span>Deliver Quote (${totalCustomerQuote.toFixed(2)})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
