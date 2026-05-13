import { useState, useEffect } from "react";
import { Calendar } from "@/components/booking/Calendar";
import { Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

interface StepPrivateDateProps {
  onNext: (data: { date: string; guests: number; durationHours: number }) => void;
  initialData: { date: string | null; guests: number; durationHours: number };
}

export const StepPrivateDate = ({ onNext, initialData }: StepPrivateDateProps) => {
  const [date, setDate] = useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : undefined
  );
  const [guests, setGuests] = useState<number>(initialData.guests || 2);
  const [durationHours, setDurationHours] = useState<number>(initialData.durationHours || 3);
  const [maxCapacity, setMaxCapacity] = useState<number>(50);

  useEffect(() => {
    const fetchCapacity = async () => {
      try {
        const { data } = await api.get("/bookings/venue-capacity");
        if (data.success) {
          setMaxCapacity(data.totalCapacity);
          if (guests > data.totalCapacity) {
            setGuests(data.totalCapacity);
          }
        }
      } catch (error) {
        console.error("Failed to fetch capacity:", error);
      }
    };
    fetchCapacity();
  }, []);

  const handleNext = () => {
    if (date) {
      onNext({
        date: date.toISOString(),
        guests,
        durationHours,
      });
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="font-headline italic text-primary text-base">01.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Event Basics</span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Reserve Our <span className="text-gold-gradient">Sanctuary</span>
        </h2>
        <p className="text-white/60 font-body text-lg font-light max-w-xl">
          Book Tropica exclusively for your private event. Experience uninterrupted luxury.
        </p>
      </header>

      <div className="grid md:grid-cols-2 gap-12">
        <div className="space-y-4">
          <label className="font-label text-xs uppercase tracking-widest text-white/60 mb-2 block">
            Select Date
          </label>
          <div className="bg-[#1a1c1b] rounded-2xl p-6 border border-[#C8A96A]/10 shadow-[0_0_30px_rgba(0,0,0,0.3)]">
            <Calendar
              selectedDate={date || null}
              onSelect={setDate}
            />
          </div>
        </div>

        <div className="space-y-10">
          {/* Guest Count */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-label text-xs uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                Guest Count
              </label>
              <div className="flex flex-col items-end">
                <span className="font-label text-[9px] text-white/40 uppercase tracking-widest mb-1">Venue Capacity: {maxCapacity}</span>
                <input
                  type="number"
                  min="1"
                  max={maxCapacity}
                  value={guests}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (isNaN(val)) setGuests(0);
                    else setGuests(Math.min(val, maxCapacity));
                  }}
                  className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 font-headline text-2xl text-white text-center outline-none focus:border-primary/50 transition-colors"
                />
              </div>
            </div>
            <p className="text-[10px] text-white/40 italic font-body text-right">Maximum occupancy based on current floor plan.</p>
          </div>

          {/* Duration */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="font-label text-xs uppercase tracking-widest text-white/60 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Duration (Hours)
              </label>
              <span className="font-headline text-2xl text-white">{durationHours}</span>
            </div>
            <input
              type="range"
              min="2"
              max="12"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>2 Hours</span>
              <span>12 Hours</span>
            </div>
          </div>

          {/* Fixed Pricing Note */}
          <div className="glass-card rounded-xl p-6 border-primary/20 bg-primary/5">
            <h3 className="font-headline italic text-xl text-primary mb-2">Venue Buyout</h3>
            <p className="text-white/60 font-body text-sm mb-4">
              Private venue bookings are charged at a flat rate of <span className="text-white font-medium">$500 per hour</span>, regardless of guest count.
            </p>
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <span className="font-label uppercase text-[10px] tracking-widest text-white/50">Estimated Cost</span>
              <span className="font-headline text-2xl text-white">${durationHours * 500}</span>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!date}
            className={cn(
              "w-full py-4 rounded-xl font-label uppercase tracking-widest text-xs font-bold transition-all duration-300",
              date
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_rgba(212,175,55,0.3)] hover:shadow-[0_0_30px_rgba(212,175,55,0.5)] transform hover:-translate-y-1"
                : "bg-white/5 text-white/20 cursor-not-allowed"
            )}
          >
            Check Availability
          </button>
        </div>
      </div>
    </div>
  );
};
