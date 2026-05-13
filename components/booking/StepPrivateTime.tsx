import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import axios from "axios";

interface StepPrivateTimeProps {
  onNext: (data: { time: string }) => void;
  date: string | null;
  durationHours: number;
  selectedTime: string | null;
}

interface Slot {
  slot: string;
  isAvailable: boolean;
  message: string;
}

export const StepPrivateTime = ({ onNext, date, durationHours, selectedTime }: StepPrivateTimeProps) => {
  const [slots, setSlots] = useState<Slot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!date) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Robust YYYY-MM-DD parsing to avoid timezone shifts
        const d = new Date(date);
        const formattedDate = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
        
        console.group(`💎 Private Event Analysis for ${formattedDate} (${durationHours} Hours)`);
        
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
          setSlots(response.data.slots);
          console.log("Raw Private Slots Data:", response.data.slots);
          
          const blocked = response.data.slots.filter((s: any) => !s.isAvailable);
          if (blocked.length > 0) {
            console.warn("🚫 BLOCKED SLOTS FOR BUYOUT:", blocked.map((s: any) => `${s.slot} (${s.message})`));
          } else {
            console.log("✅ All slots are available for a private buyout!");
          }
        } else {
          setError(response.data.message || "Failed to load availability");
        }
        console.groupEnd();
      } catch (err: any) {
        setError(err.response?.data?.message || "An error occurred while checking availability");
        console.groupEnd();
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailability();
  }, [date, durationHours]);

  const formattedDateString = date ? format(new Date(date), "EEEE, MMMM do, yyyy") : "";

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="font-headline italic text-primary text-base">02.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">The Timeline</span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          When shall we <span className="text-gold-gradient">begin?</span>
        </h2>
        <p className="text-white/60 font-body text-lg font-light max-w-xl">
          Select the starting hour for your {durationHours}-hour exclusive event on {formattedDateString}.
        </p>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
          <p className="text-white/50 font-label uppercase tracking-widest text-xs">Syncing with our concierge...</p>
        </div>
      ) : error ? (
        <div className="glass-card p-8 border-red-500/30 bg-red-500/5 flex flex-col items-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-red-400" />
          <p className="text-red-200 font-body">{error}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {slots.map(({ slot, isAvailable, message }) => (
            <button 
              key={slot}
              onClick={() => isAvailable && onNext({ time: slot })}
              disabled={!isAvailable}
              className={cn(
                "p-4 md:p-8 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center gap-1 md:gap-2 group relative overflow-hidden",
                selectedTime === slot 
                  ? "bg-[#E5E7EB] border-[#E5E7EB] shadow-2xl shadow-black/40" 
                  : isAvailable
                    ? "glass-card border-white/15 hover:bg-white/10 hover:border-white/30 hover:scale-[1.02]"
                    : "opacity-40 cursor-not-allowed border-white/5 bg-black/20"
              )}
            >
              {/* Highlight gradient for selected state */}
              {selectedTime === slot && (
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent mix-blend-overlay"></div>
              )}
              
              <span className={cn(
                "font-headline text-2xl md:text-4xl transition-colors duration-300 relative z-10",
                selectedTime === slot ? "text-gray-900" : isAvailable ? "text-white group-hover:text-primary" : "text-white/30"
              )}>
                {slot}
              </span>
              <span className={cn(
                "font-label text-[9px] md:text-[10px] uppercase tracking-widest relative z-10 font-bold",
                selectedTime === slot ? "text-gray-600" : isAvailable ? "text-primary/70 group-hover:text-primary" : "text-white/20"
              )}>
                {isAvailable ? `${durationHours} HR BLOCK` : "Unavailable"}
              </span>

              {!isAvailable && (
                <span className="absolute bottom-2 text-[8px] uppercase tracking-wider text-red-400/70 font-label">
                  {message}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      
      {slots.filter(s => s.isAvailable).length === 0 && !isLoading && !error && (
        <div className="mt-8 p-6 rounded-xl border border-primary/20 bg-primary/5 text-center">
          <p className="text-primary font-body">
            We're sorry, but the venue cannot be secured for a continuous {durationHours}-hour block on this date. 
            Please try selecting a shorter duration or a different date.
          </p>
        </div>
      )}
    </div>
  );
};
