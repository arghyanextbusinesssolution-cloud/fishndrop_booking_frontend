"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

interface StepTimeSelectionProps {
  onNext: (data: { time: string; assignedNote?: string }) => void;
  selectedTime: string | null;
  date: string | null;
  guests: number;
}

interface SlotAvailability {
  slot: string;
  isAvailable: boolean;
  message: string;
  assignedNote?: string;
}

const getEffectiveDate = (d: string | null): string => {
  if (d && d.trim().length >= 8) return d;
  const now = new Date();
  if (now.getHours() >= 22) now.setDate(now.getDate() + 1);
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const StepTimeSelection = ({ onNext, selectedTime, date, guests }: StepTimeSelectionProps) => {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  const activeDate = getEffectiveDate(date);

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/bookings/availability?date=${activeDate}&partySize=${guests}`);
        if (data.success) {
          setSlots(data.slots || []);
          
          // Enhanced Console Logging for Debugging
          console.group(`🕒 Availability Analysis for ${activeDate} (${guests} Guests)`);
          console.log("Raw Slots Data:", data.slots);
          
          const blockedSlots = (data.slots || []).filter((s: any) => !s.isAvailable);
          const venueBuyouts = blockedSlots.filter((s: any) => s.message?.includes("Private Event") || s.message?.includes("Venue partially or fully booked"));
          
          if (venueBuyouts.length > 0) {
            console.warn("⚠️ VENUE BUYOUTS DETECTED:", venueBuyouts.map((s: any) => `${s.slot} (${s.message})`));
          } else {
            console.log("✅ No private venue buyouts detected for this date.");
          }

          if (blockedSlots.length > venueBuyouts.length) {
            const standardBlocked = blockedSlots.filter((s: any) => !venueBuyouts.includes(s));
            console.log("🚫 Table Capacity Limit Reached for:", standardBlocked.map((s: any) => s.slot));
          }
          console.groupEnd();
        }
      } catch (error) {
        console.error("Failed to fetch availability", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [activeDate, guests]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="font-headline text-xl italic text-on-surface">Checking availability...</p>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">
            The Perfect Moment
          </span>
          <span className="text-white/20 text-xs">•</span>
          <span className="text-xs uppercase tracking-widest text-[#C8A96A] font-bold">
            {new Date(activeDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
          </span>
          <span className="text-white/20 text-xs">•</span>
          <span className="text-xs uppercase tracking-widest text-white/60 font-semibold">
            {guests} {guests === 1 ? "Guest" : "Guests"}
          </span>
        </div>
        <h2 className="font-headline text-5xl md:text-7xl italic text-on-surface">
          02. <span className="text-gold-gradient">The Hour</span>
        </h2>
        <p className="text-on-surface/70 font-body text-lg font-light max-w-xl">
          Time is the most precious vintage we serve. Select the moment your evening begins.
        </p>
      </div>

      {slots.length === 0 ? (
        <div className="text-center py-16 p-8 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-md">
          <p className="font-headline text-2xl italic text-white/90">No available time slots found for this date.</p>
          <p className="text-white/50 text-sm mt-2 font-light">Please try selecting a different party size or date.</p>
        </div>
      ) : (

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {slots.map(({ slot, isAvailable, message, assignedNote }) => (
          <button 
            key={slot}
            onClick={() => isAvailable && onNext({ time: slot, assignedNote })}
            disabled={!isAvailable}
            className={cn(
              "p-4 md:p-8 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center gap-1 md:gap-2 group relative overflow-hidden",
              selectedTime === slot 
                ? "bg-[#E5E7EB] border-[#E5E7EB] shadow-2xl shadow-black/40" 
                : isAvailable
                  ? "glass-card border-white/15 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02]"
                  : "glass-card border-white/5 cursor-not-allowed opacity-30"
            )}
          >
            <span className={cn(
              "font-headline text-2xl md:text-3xl italic transition-colors duration-500",
              selectedTime === slot ? "text-[#111412]" : "text-white group-hover:text-white"
            )}>
              {(() => {
                const h = parseInt(slot.split(":")[0], 10);
                const ampm = h >= 12 ? "PM" : "AM";
                return `${h % 12 || 12}:00 ${ampm}`;
              })()}
            </span>
            <span className={cn(
              "text-[9px] uppercase tracking-widest font-bold",
              selectedTime === slot 
                ? "text-[#111412]/60" 
                : isAvailable 
                  ? "text-white/50 group-hover:text-white/80"
                  : "text-red-400/60"
            )}>
              {isAvailable ? "Available" : "Fully Booked"}
            </span>
            {selectedTime === slot && (
              <div className="absolute bottom-0 left-0 w-full h-1 bg-gold-gradient" />
            )}
            {!isAvailable && (
               <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-white/10 rotate-45 transform"></div>
               </div>
            )}
          </button>
        ))}
      </div>
      )}
    </div>
  );
};
