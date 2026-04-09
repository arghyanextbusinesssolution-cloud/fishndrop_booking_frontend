"use client";

import { User, Users, Group, Landmark } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepGuestCountProps {
  onNext: (data: { guests: number }) => void;
  selectedGuests: number;
}

const guestOptions = [
  { value: 1, label: "Soloist", desc: "A moment for quiet reflection", icon: User },
  { value: 2, label: "Duo", desc: "The intimacy of conversation", icon: Users },
  { value: 3, label: "Trio", desc: "A gathering of kin", icon: Group },
  { value: 4, label: "Quartet", desc: "The richness of a shared table", icon: Landmark },
];

export const StepGuestCount = ({ onNext, selectedGuests }: StepGuestCountProps) => {
  return (
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <h2 className="font-headline text-5xl md:text-7xl italic text-on-surface">
          03. <span className="text-gold-gradient">The Ensemble</span>
        </h2>
        <p className="text-secondary font-body text-lg font-light max-w-xl">
          Whether seeking the intimacy of a solo retreat or the warmth of a shared quartet.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {guestOptions.map(option => {
          const Icon = option.icon;
          const isSelected = selectedGuests === option.value || (option.value === 4 && selectedGuests >= 4);

          return (
            <button 
              key={option.value}
              onClick={() => onNext({ guests: option.value })}
              className={cn(
                "group relative bg-surface-container-low rounded-xl p-8 cursor-pointer transition-all duration-500 ambient-glow flex flex-col items-center justify-between min-h-[360px] border",
                isSelected 
                  ? "bg-surface-container-lowest border-primary-container/30 shadow-2xl shadow-primary-container/10" 
                  : "border-transparent hover:bg-surface-container-lowest hover:border-outline-variant/20"
              )}
            >
              <div className="w-full flex justify-end">
                <Icon className={cn(
                  "w-5 h-5 transition-colors duration-500",
                  isSelected ? "text-primary" : "text-outline-variant group-hover:text-primary"
                )} />
              </div>
              
              <div className="text-center">
                <span className={cn(
                  "font-headline text-8xl italic block mb-4 transition-colors duration-500",
                  isSelected ? "text-gold-gradient" : "text-outline-variant/20 group-hover:text-primary-container/40"
                )}>
                  {option.value}{option.value === 4 ? "+" : ""}
                </span>
                <h3 className="font-label text-xs uppercase tracking-[0.2em] text-on-surface mb-2 font-bold">{option.label}</h3>
                <p className="text-[10px] text-secondary font-light font-body tracking-wider">{option.desc}</p>
              </div>

              <div className="h-4 flex items-center">
                <div className={cn(
                  "h-px bg-primary transition-all duration-500",
                  isSelected ? "w-12" : "w-0 group-hover:w-12"
                )}></div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
