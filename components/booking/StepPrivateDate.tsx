"use client";

import { useState } from "react";
import { Calendar } from "@/components/booking/Calendar";
import { format } from "date-fns";
import { Calendar as CalendarIcon, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepPrivateDateProps {
  onNext: (data: { date: string }) => void;
  initialData: { date: string | null };
}

export const StepPrivateDate = ({ onNext, initialData }: StepPrivateDateProps) => {
  const [date, setDate] = useState<Date | undefined>(
    initialData.date ? new Date(initialData.date) : undefined
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleDateSelect = (selectedDate: Date) => {
    setDate(selectedDate);
    setIsTransitioning(true);

    // Automatically transition to the next step with smooth feedback
    setTimeout(() => {
      onNext({
        date: selectedDate.toISOString(),
      });
    }, 280);
  };

  const handleManualContinue = () => {
    if (date && !isTransitioning) {
      setIsTransitioning(true);
      onNext({
        date: date.toISOString(),
      });
    }
  };

  const formattedDate = date ? format(date, "EEEE, MMMM do, yyyy") : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-brand text-base">01.</span>
          <div className="h-[1px] w-8 bg-brand-fg/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-brand-fg/50 font-bold">
            Step 01 &bull; Calendar Date
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-brand-fg leading-tight">
          Select Your <span className="text-gold-gradient">Event Date</span>
        </h2>
        <p className="text-brand-fg/60 font-body text-base md:text-lg font-light max-w-2xl">
          Click any available date on the calendar below. You will automatically proceed to customize your guest count, duration, and time slot.
        </p>
      </header>

      {/* Calendar Section */}
      <div className="glass-card rounded-3xl p-4 sm:p-6 md:p-8 border-brand-fg/10 bg-brand-fg/[0.02] shadow-2xl space-y-6">
        <Calendar
          selectedDate={date || null}
          onSelect={handleDateSelect}
          showAvailabilityBadges={true}
        />

        {/* Selected Date Indicator & Auto-Transition Status */}
        <div className="pt-4 border-t border-brand-fg/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          {date ? (
            <div className="flex items-center gap-3 text-brand-light bg-brand/10 border border-brand/30 px-4 py-2.5 rounded-full">
              {isTransitioning ? (
                <Loader2 className="w-4 h-4 text-brand animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4 text-brand" />
              )}
              <span className="font-headline text-base sm:text-lg font-bold">
                {formattedDate}
              </span>
              {isTransitioning && (
                <span className="text-xs text-brand font-label uppercase tracking-wider animate-pulse ml-1">
                  Loading schedule...
                </span>
              )}
            </div>
          ) : (
            <p className="text-brand-fg/40 font-body text-sm italic">
              Please click any available date on the calendar above to continue.
            </p>
          )}

          <button
            onClick={handleManualContinue}
            disabled={!date || isTransitioning}
            className={cn(
              "w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-label uppercase tracking-widest text-xs font-black transition-all duration-300 shadow-xl",
              date
                ? "bg-gradient-to-r from-brand via-brand-light to-brand text-brand-ink hover:scale-105 shadow-[0_0_25px_rgb(var(--brand)/0.35)] cursor-pointer"
                : "bg-brand-fg/5 text-brand-fg/20 cursor-not-allowed border border-brand-fg/5"
            )}
          >
            <span>{isTransitioning ? "Continuing..." : date ? "Continue to Guests & Time" : "Select a Date"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
