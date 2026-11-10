"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Loader2, AlertCircle, Clock, Calendar, Users, CheckCircle2, ArrowRight } from "lucide-react";
import { cn, formatTimeTo12Hour } from "@/lib/utils";
import axios from "axios";
import api from "@/lib/axios";

interface StepPrivateTimeProps {
  onNext: (data: { durationHours: number; time: string }) => void;
  date: string | null;
  guests: number;
  initialDurationHours: number;
  selectedTime: string | null;
}

interface Slot {
  slot: string;
  isAvailable: boolean;
  message: string;
}

/**
 * Calculates human-readable end time given a starting HH:MM slot and duration in hours.
 */
const calculateSlotEndTime = (startSlot: string, duration: number): string => {
  const [hStr, mStr] = startSlot.split(":");
  const startHour = parseInt(hStr, 10);
  const mins = mStr || "00";
  const totalHours = startHour + duration;
  const endHour = totalHours >= 24 ? totalHours - 24 : totalHours;
  const formattedEnd = `${endHour < 10 ? "0" : ""}${endHour}:${mins}`;
  return formatTimeTo12Hour(formattedEnd);
};

export const StepPrivateTime = ({
  onNext,
  date,
  guests,
  initialDurationHours,
  selectedTime,
}: StepPrivateTimeProps) => {
  const [durationHours, setDurationHours] = useState<number>(initialDurationHours || 5);
  const [maxCapacity, setMaxCapacity] = useState<number>(40);
  const [perGuestPrice, setPerGuestPrice] = useState<number>(50);
  const [extraHourPrice, setExtraHourPrice] = useState<number>(125);
  const [minDepositAmount, setMinDepositAmount] = useState<number>(200);

  const [slots, setSlots] = useState<Slot[]>([]);
  const [activeTime, setActiveTime] = useState<string | null>(selectedTime);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch venue capacity and pricing configuration
  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const { data } = await api.get("/bookings/venue-capacity");
        if (data.success) {
          setMaxCapacity(data.totalCapacity || 40);
          setPerGuestPrice(data.perGuestPrice || 50);
          setExtraHourPrice(data.extraHourPrice || 125);
          setMinDepositAmount(data.minDepositAmount || 200);
        }
      } catch (err) {
        console.error("Failed to fetch capacity:", err);
      }
    };
    fetchCapacity();
  }, []);

  // Fetch slot availability whenever date or duration changes
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date) return;

      setIsLoading(true);
      setError(null);

      try {
        const d = new Date(date);
        const formattedDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;

        const response = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/bookings/private-availability`,
          {
            params: {
              date: formattedDate,
              duration: durationHours,
            },
          }
        );

        if (response.data.success) {
          setSlots(response.data.slots || []);
          if (selectedTime && response.data.slots?.some((s: Slot) => s.slot === selectedTime && s.isAvailable)) {
            setActiveTime(selectedTime);
          }
        } else {
          setError(response.data.message || "Failed to load availability");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred while checking availability");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [date, durationHours, selectedTime]);

  const formattedDateString = date ? format(new Date(date), "EEEE, MMMM do, yyyy") : "";

  // Live pricing calculations
  const guestCost = (guests || 1) * perGuestPrice;
  const extraHours = Math.max(0, durationHours - 5);
  const extraHoursCost = extraHours * extraHourPrice;
  const totalCost = guestCost + extraHoursCost;

  const confirmBarRef = useRef<HTMLDivElement>(null);
  const [pickedByUser, setPickedByUser] = useState(0);

  const handleSelectSlot = (slot: string) => {
    setActiveTime(slot);
    setPickedByUser((n) => n + 1);
  };

  // After the guest taps a time, glide down to the confirm / continue bar
  useEffect(() => {
    if (!pickedByUser) return;
    const t = setTimeout(() => confirmBarRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }), 80);
    return () => clearTimeout(t);
  }, [pickedByUser]);

  const handleConfirm = () => {
    if (activeTime) {
      onNext({
        durationHours,
        time: activeTime,
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">03.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Step 03 &bull; Time &amp; Duration
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Pick Your <span className="text-gold-gradient">Time</span>
        </h2>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 text-white/70 text-sm font-body">
          <span className="inline-flex items-center gap-1.5 text-[#C8A96A] font-semibold bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-3.5 py-1 rounded-full text-xs">
            <Calendar className="w-3.5 h-3.5" />
            {formattedDateString}
          </span>
          <span className="inline-flex items-center gap-1.5 text-[#E8CB8A] bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-3.5 py-1 rounded-full text-xs font-bold font-label uppercase">
            {guests} Guests
          </span>
        </div>
      </header>

      {/* ─── Duration & live total ─── */}
      <div className="glass-card rounded-3xl p-6 border-white/10 bg-white/[0.03] shadow-xl grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="font-label text-xs uppercase tracking-widest text-white/80 flex items-center gap-2 font-bold">
              <Clock className="w-4 h-4 text-[#C8A96A]" />
              Party Duration
            </label>
            <span className="font-headline text-2xl text-[#E8CB8A] font-bold">{durationHours} Hours</span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
            {[5, 6, 7, 8, 9, 10, 11, 12].map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setDurationHours(h)}
                className={cn(
                  "py-2 rounded-lg text-xs font-bold transition-all cursor-pointer",
                  durationHours === h ? "bg-[#C8A96A] text-[#0d1612] shadow-md" : "bg-white/5 text-white/60 hover:bg-white/15 hover:text-white"
                )}
              >
                {h}h
              </button>
            ))}
          </div>
          <p className="text-[11px] text-white/40 mt-2">5 hours included · +${extraHourPrice} per extra hour</p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#C8A96A]/15 to-[#C8A96A]/5 border border-[#C8A96A]/30 space-y-1.5">
          <div className="flex justify-between text-xs text-white/70">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C8A96A]" /> {guests} guests × ${perGuestPrice}
            </span>
            <span>${guestCost.toLocaleString()}</span>
          </div>
          {extraHours > 0 && (
            <div className="flex justify-between text-xs text-white/70">
              <span>{extraHours} extra hour{extraHours === 1 ? "" : "s"} × ${extraHourPrice}</span>
              <span>${extraHoursCost.toLocaleString()}</span>
            </div>
          )}
          <div className="flex items-end justify-between pt-2 border-t border-[#C8A96A]/20">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#C8A96A] font-label">Total</span>
            <span className="font-headline text-3xl text-[#E8CB8A] font-bold">${totalCost.toLocaleString()}</span>
          </div>
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 font-bold font-mono text-right">
            ${minDepositAmount} deposit to lock · add-ons at checkout
          </p>
        </div>
      </div>

      {/* ─── Part 2: Available Time Slots (Clean 10 AM, 11 AM... Grid) ─── */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-headline italic text-2xl sm:text-3xl text-white">
              Available <span className="text-gold-gradient">Time Slots</span>
            </h3>
            <p className="text-xs text-white/50 font-body mt-0.5">
              Select your start time below. Each continuous {durationHours}-hour buyout reserves the entire sanctuary exclusively.
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 space-y-4">
            <Loader2 className="w-10 h-10 text-[#C8A96A] animate-spin" />
            <p className="text-white/50 font-label uppercase tracking-widest text-xs">
              Checking available time slots for {formattedDateString}...
            </p>
          </div>
        ) : error ? (
          <div className="glass-card p-8 border-red-500/30 bg-red-500/5 flex flex-col items-center text-center space-y-4 rounded-2xl">
            <AlertCircle className="w-12 h-12 text-red-400" />
            <p className="text-red-200 font-body">{error}</p>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 rounded-2xl border border-white/10 bg-black/40 text-center space-y-2">
            <p className="text-white font-bold text-lg">No Time Slots Available For This Date</p>
            <p className="text-white/60 text-xs">Please choose another date on the calendar.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Clean, sleek time buttons in a grid from 10 AM, 11 AM... */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
              {slots.map(({ slot, isAvailable, message }) => {
                const startTime12 = formatTimeTo12Hour(slot);
                const endTime12 = calculateSlotEndTime(slot, durationHours);
                const isSelected = activeTime === slot;

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => isAvailable && handleSelectSlot(slot)}
                    disabled={!isAvailable}
                    className={cn(
                      "p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center text-center gap-1 group relative overflow-hidden",
                      isSelected
                        ? "bg-gradient-to-br from-[#E5C77A] via-[#E8CB8A] to-[#C8A96A] border-[#E5C77A] text-[#0d1612] shadow-xl shadow-[#C8A96A]/30 scale-105 font-bold"
                        : isAvailable
                          ? "bg-white/[0.04] border-white/15 hover:bg-white/[0.09] hover:border-[#C8A96A]/50 text-white cursor-pointer active:scale-95"
                          : "opacity-30 cursor-not-allowed border-white/5 bg-black/30 text-white/30"
                    )}
                  >
                    {/* Time display: 10:00 AM, 11:00 AM, etc. */}
                    <span
                      className={cn(
                        "font-headline text-xl sm:text-2xl font-bold tracking-tight",
                        isSelected ? "text-[#0d1612]" : "text-white group-hover:text-[#E8CB8A]"
                      )}
                    >
                      {startTime12}
                    </span>

                    <span
                      className={cn(
                        "text-[9px] uppercase tracking-wider font-mono",
                        isSelected ? "text-[#0d1612]/70" : isAvailable ? "text-[#C8A96A]" : "text-red-400/60"
                      )}
                    >
                      {isAvailable ? `Ends ${endTime12}` : message || "Booked"}
                    </span>

                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#0d1612]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Bottom Schedule Confirmation Bar */}
            {activeTime && (
              <div ref={confirmBarRef} className="scroll-mt-24 p-5 rounded-2xl bg-gradient-to-r from-[#0d1612] to-[#14231c] border-2 border-[#C8A96A] shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-[#C8A96A]" />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">
                      Selected Time Slot: {formatTimeTo12Hour(activeTime)} – {calculateSlotEndTime(activeTime, durationHours)}
                    </p>
                    <p className="font-headline text-lg sm:text-xl text-white font-bold">
                      {guests} Guests &bull; ${totalCost.toLocaleString()} Total (${minDepositAmount} Deposit)
                    </p>
                    <p className="text-white/60 text-xs">
                      {formattedDateString} &bull; Private Sanctuary Buyout
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleConfirm}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:scale-105 transition-all shadow-xl shadow-[#C8A96A]/30 shrink-0 cursor-pointer"
                >
                  <span>Continue to Booker Verification</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
