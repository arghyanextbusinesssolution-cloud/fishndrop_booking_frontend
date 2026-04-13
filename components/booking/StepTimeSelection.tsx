"use client";

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

interface StepTimeSelectionProps {
  onNext: (data: { time: string }) => void;
  selectedTime: string | null;
  date: string | null;
  guests: number;
}

interface SlotAvailability {
  slot: string;
  isAvailable: boolean;
  message: string;
}

export const StepTimeSelection = ({ onNext, selectedTime, date, guests }: StepTimeSelectionProps) => {
  const [slots, setSlots] = useState<SlotAvailability[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date) return;
      setLoading(true);
      try {
        const { data } = await api.get(`/bookings/availability?date=${date}&partySize=${guests}`);
        if (data.success) {
          setSlots(data.slots);
        }
      } catch (error) {
        console.error("Failed to fetch availability", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [date, guests]);

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
        <h2 className="font-headline text-5xl md:text-7xl italic text-on-surface">
          02. <span className="text-gold-gradient">The Hour</span>
        </h2>
        <p className="text-secondary font-body text-lg font-light max-w-xl">
          Time is the most precious vintage we serve. Select the moment your evening begins.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {slots.map(({ slot, isAvailable, message }) => (
          <button 
            key={slot}
            onClick={() => isAvailable && onNext({ time: slot })}
            disabled={!isAvailable}
            className={cn(
              "p-4 md:p-8 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center gap-1 md:gap-2 group relative overflow-hidden",
              selectedTime === slot 
                ? "bg-primary-container border-transparent shadow-xl shadow-primary-container/20" 
                : isAvailable
                  ? "bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-lowest hover:border-primary-container/30 hover:ambient-shadow"
                  : "bg-surface-container-low/50 border-outline-variant/5 cursor-not-allowed opacity-60"
            )}
          >
            <span className={cn(
              "font-headline text-2xl md:text-3xl italic transition-colors duration-500",
              selectedTime === slot ? "text-on-primary-container" : "text-on-surface group-hover:text-gold-gradient"
            )}>
              {slot}
            </span>
            <span className={cn(
              "text-[9px] uppercase tracking-widest font-bold",
              selectedTime === slot 
                ? "text-on-primary-container/60" 
                : isAvailable 
                  ? "text-outline group-hover:text-primary"
                  : "text-error"
            )}>
              {isAvailable ? "Available" : "Fully Booked"}
            </span>
            {!isAvailable && (
               <div className="absolute inset-0 bg-error/5 flex items-center justify-center">
                  <div className="w-full h-[1px] bg-error/20 rotate-45 transform"></div>
               </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
