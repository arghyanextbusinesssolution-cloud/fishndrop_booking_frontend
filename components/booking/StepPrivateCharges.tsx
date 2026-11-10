"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar, Clock, Users, Sparkles, Check, ArrowRight, ShieldCheck } from "lucide-react";
import { formatTimeTo12Hour } from "@/lib/utils";
import api from "@/lib/axios";

interface StepPrivateChargesProps {
  onNext: () => void;
  date: string | null;
  time: string | null;
  guests: number;
  durationHours: number;
}

const calculateSlotEndTime = (startSlot: string, duration: number): string => {
  const [hStr, mStr] = startSlot.split(":");
  const startHour = parseInt(hStr, 10);
  const mins = mStr || "00";
  const totalHours = startHour + duration;
  const endHour = totalHours >= 24 ? totalHours - 24 : totalHours;
  const formattedEnd = `${endHour < 10 ? "0" : ""}${endHour}:${mins}`;
  return formatTimeTo12Hour(formattedEnd);
};

export const StepPrivateCharges = ({
  onNext,
  date,
  time,
  guests,
  durationHours,
}: StepPrivateChargesProps) => {
  const [perGuestPrice, setPerGuestPrice] = useState<number>(50);
  const [extraHourPrice, setExtraHourPrice] = useState<number>(125);
  const [minDepositAmount, setMinDepositAmount] = useState<number>(200);

  useEffect(() => {
    api.get("/bookings/venue-capacity").then(({ data }) => {
      if (data?.success) {
        setPerGuestPrice(data.perGuestPrice || 50);
        setExtraHourPrice(data.extraHourPrice || 125);
        setMinDepositAmount(data.minDepositAmount || 200);
      }
    }).catch(() => {});
  }, []);

  const guestCost = (guests || 1) * perGuestPrice;
  const extraHours = Math.max(0, durationHours - 5);
  const extraHoursCost = extraHours * extraHourPrice;
  const totalCharges = guestCost + extraHoursCost;
  const depositDue = Math.min(totalCharges, minDepositAmount);
  const balanceRemaining = Math.max(0, totalCharges - depositDue);

  const formattedDate = date ? format(new Date(date), "EEEE, MMMM do, yyyy") : "";
  const timeWindow = time ? `${formatTimeTo12Hour(time)} – ${calculateSlotEndTime(time, durationHours)}` : "";

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">03.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Step 03 of 07 &bull; Booking Charges
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          How Much <span className="text-gold-gradient">Charges</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light max-w-2xl">
          Transparent, per-guest pricing for your private sanctuary buyout. Review your calculated booking charges before choosing your celebration details.
        </p>
      </header>

      {/* Overview Tag Bar */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-xs font-label">
        <span className="inline-flex items-center gap-1.5 text-[#C8A96A] bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-3.5 py-1.5 rounded-full font-bold">
          <Calendar className="w-3.5 h-3.5" />
          {formattedDate}
        </span>
        <span className="inline-flex items-center gap-1.5 text-white/80 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full font-bold">
          <Clock className="w-3.5 h-3.5 text-[#C8A96A]" />
          {timeWindow} ({durationHours} Hours)
        </span>
        <span className="inline-flex items-center gap-1.5 text-white/80 bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full font-bold">
          <Users className="w-3.5 h-3.5 text-[#C8A96A]" />
          {guests} Guests
        </span>
      </div>

      {/* Main Charges Breakdown Card */}
      <div className="rounded-3xl border border-[#C8A96A]/35 bg-gradient-to-b from-[#141b17] via-[#0d1410] to-[#070b09] p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
              Private Venue Sanctuary Buyout
            </span>
            <h3 className="font-headline italic text-2xl sm:text-3xl text-white mt-1">
              {guests} Guests @ ${perGuestPrice}/guest
            </h3>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase tracking-widest text-white/40 font-mono">Total Estimated Cost</span>
            <div className="font-headline text-3xl sm:text-4xl text-[#E8CB8A] font-bold">
              ${totalCharges.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="space-y-3 font-mono text-xs sm:text-sm">
          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/80 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#C8A96A]" />
              Base Guest Charges ({guests} Guests × ${perGuestPrice})
            </span>
            <span className="text-white font-bold">${guestCost.toLocaleString()}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/80 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C8A96A]" />
              Sanctuary Duration ({durationHours} Hours Private Access)
            </span>
            <span className="text-[#C8A96A] font-bold">
              {extraHours > 0 ? `+$${extraHoursCost} (${extraHours} hrs extra)` : "Included (5 hrs base)"}
            </span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/80 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C8A96A]" />
              2 Complimentary Champagne Bottles
            </span>
            <span className="text-emerald-400 font-bold">Free ($0.00)</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-white/5">
            <span className="text-white/80 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C8A96A]" />
              Digital QR Guest Invitations (Up to {guests} passes)
            </span>
            <span className="text-emerald-400 font-bold">Included</span>
          </div>
        </div>

        {/* Deposit Summary Box */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="space-y-1">
            <p className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">
              Deposit to Lock &amp; Confirm Date
            </p>
            <p className="font-headline text-2xl text-white font-bold">
              ${depositDue.toLocaleString()}
            </p>
            <p className="text-white/50 text-[11px] font-body">
              Payable upon checkout via Stripe or Zelle to reserve your sanctuary date.
            </p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-white/10 sm:pl-4">
            <p className="font-label text-[10px] uppercase tracking-widest text-white/40 font-bold">
              Remaining Balance
            </p>
            <p className="font-headline text-2xl text-white/80 font-bold">
              ${balanceRemaining.toLocaleString()}
            </p>
            <p className="text-white/50 text-[11px] font-body">
              Due prior to your event. Add-on services (DJ, photo, catering) can be added next.
            </p>
          </div>
        </div>

        {/* What is Included List */}
        <div className="pt-2 space-y-2 text-xs text-white/70">
          <p className="flex items-center gap-2 text-white/90 font-medium">
            <Check className="w-4 h-4 text-[#C8A96A] shrink-0" />
            <span>Complete private buyout — Entire sanctuary closed to public.</span>
          </p>
          <p className="flex items-center gap-2 text-white/90 font-medium">
            <Check className="w-4 h-4 text-[#C8A96A] shrink-0" />
            <span>Dedicated bartender, sound system controls, and ambient lighting.</span>
          </p>
          <p className="flex items-center gap-2 text-white/90 font-medium">
            <Check className="w-4 h-4 text-[#C8A96A] shrink-0" />
            <span>Shareable digital invitation link with real QR check-in passes for {guests} guests.</span>
          </p>
        </div>

        {/* CTA Continue */}
        <div className="pt-4 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-10 py-4.5 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-label text-xs uppercase tracking-[0.2em] font-black rounded-xl hover:scale-105 transition-all shadow-xl shadow-[#C8A96A]/30 cursor-pointer"
          >
            <span>Continue to Party Occasion</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

