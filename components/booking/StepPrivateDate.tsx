import { useState, useEffect, useRef } from "react";
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
  const [durationHours, setDurationHours] = useState<number>(initialData.durationHours || 5);
  const [maxCapacity, setMaxCapacity] = useState<number>(50);
  const nextSectionRef = useRef<HTMLDivElement>(null);

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

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    // Mobile only: scroll down smoothly to the next step / package options
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setTimeout(() => {
        nextSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };

  const handleNext = () => {
    if (date) {
      onNext({
        date: date.toISOString(),
        guests,
        durationHours,
      });
    }
  };

  const calculatedCost = 500 + (durationHours > 5 ? (durationHours - 5) * 125 : 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <header className="space-y-3">
        <div className="flex items-center gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">01.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Step 01 of 06 &bull; Calendar Date &amp; Package</span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Reserve Our <span className="text-gold-gradient">Sanctuary</span>
        </h2>
        <p className="text-white/60 font-body text-lg font-light max-w-xl">
          Book Tropica exclusively with the <strong className="text-[#C8A96A]">Tropica Private Venue Booking</strong>.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Big Spacious Calendar Column */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <Calendar
            selectedDate={date || null}
            onSelect={handleDateSelect}
            showAvailabilityBadges={true}
          />
        </div>

        {/* Guest Count, Duration & Package Column */}
        <div ref={nextSectionRef} className="lg:col-span-5 xl:col-span-4 space-y-6 lg:sticky lg:top-24 scroll-mt-24">
          {/* Guest Count */}
          <div className="glass-card rounded-2xl p-5 border-white/10 bg-white/[0.03] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label text-xs uppercase tracking-widest text-white/80 flex items-center gap-2 font-bold">
                <Users className="w-4 h-4 text-[#C8A96A]" />
                Guest Count
              </label>
              <div className="flex flex-col items-end">
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
                  className="w-24 bg-white/10 border border-white/20 rounded-xl p-2 font-headline text-2xl text-white text-center outline-none focus:border-[#C8A96A] focus:ring-1 focus:ring-[#C8A96A] transition-colors"
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-[11px] text-white/50 font-label">
              <span>Venue Capacity: {maxCapacity} guests</span>
              <span className="italic">Private buyout</span>
            </div>
          </div>

          {/* Duration */}
          <div className="glass-card rounded-2xl p-5 border-white/10 bg-white/[0.03] space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-label text-xs uppercase tracking-widest text-white/80 flex items-center gap-2 font-bold">
                <Clock className="w-4 h-4 text-[#C8A96A]" />
                Duration (Hours)
              </label>
              <span className="font-headline text-2xl text-[#E3C281] font-bold">{durationHours} Hours</span>
            </div>
            <input
              type="range"
              min="5"
              max="12"
              value={durationHours}
              onChange={(e) => setDurationHours(parseInt(e.target.value))}
              className="w-full accent-[#C8A96A] cursor-pointer"
            />
            <div className="flex justify-between text-xs text-white/40 font-mono">
              <span>5 Hours (Base)</span>
              <span>12 Hours ($125/hr extra)</span>
            </div>
          </div>

          {/* Tropica Private Venue Booking Pricing Card */}
          <div className="rounded-2xl p-5 border border-[#C8A96A]/30 bg-gradient-to-b from-[#C8A96A]/15 to-[#C8A96A]/5 space-y-3 shadow-lg">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">Sanctuary Buyout</span>
                <h3 className="font-headline italic text-xl text-white">Private Venue Package</h3>
              </div>
              <span className="font-headline text-2xl text-[#E3C281] font-bold">${calculatedCost.toLocaleString()}</span>
            </div>
            <div className="space-y-1.5 text-xs text-white/80 border-t border-white/10 pt-3">
              <p className="flex items-center gap-2">
                <span className="text-[#C8A96A] font-bold">✓ {durationHours} Hours Private Access</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-[#C8A96A] font-bold">✓ 2 Bottles of Complimentary Champagne</span>
              </p>
              <p className="flex items-center gap-2">
                <span className="text-white font-bold">$200 Deposit to Lock Date</span>
              </p>
            </div>
          </div>

          <button
            onClick={handleNext}
            disabled={!date}
            className={cn(
              "w-full py-4 rounded-xl font-label uppercase tracking-widest text-xs font-bold transition-all duration-300 shadow-xl",
              date
                ? "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] transform hover:-translate-y-0.5 cursor-pointer"
                : "bg-white/5 text-white/20 cursor-not-allowed border border-white/5"
            )}
          >
            {date ? "Continue to Select Time ➔" : "Select a Date to Continue"}
          </button>
        </div>
      </div>
    </div>
  );
};
