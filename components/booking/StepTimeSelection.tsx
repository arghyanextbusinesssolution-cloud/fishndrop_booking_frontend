"use client";

import { cn } from "@/lib/utils";

interface StepTimeSelectionProps {
  onNext: (data: { time: string }) => void;
  selectedTime: string | null;
}

export const StepTimeSelection = ({ onNext, selectedTime }: StepTimeSelectionProps) => {
  const timeSlots = [
    "18:00", "18:30", "19:00", "19:30", 
    "20:00", "20:30", "21:00", "21:30"
  ];

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
        {timeSlots.map(time => (
          <button 
            key={time}
            onClick={() => onNext({ time })}
            className={cn(
              "p-8 rounded-xl border transition-all duration-500 flex flex-col items-center justify-center gap-2 group",
              selectedTime === time 
                ? "bg-primary-container border-transparent shadow-xl shadow-primary-container/20" 
                : "bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-lowest hover:border-primary-container/30 hover:ambient-shadow"
            )}
          >
            <span className={cn(
              "font-headline text-3xl italic transition-colors duration-500",
              selectedTime === time ? "text-on-primary-container" : "text-on-surface group-hover:text-gold-gradient"
            )}>
              {time}
            </span>
            <span className={cn(
              "text-[9px] uppercase tracking-widest font-bold",
              selectedTime === time ? "text-on-primary-container/60" : "text-outline group-hover:text-primary"
            )}>
              Available
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
