"use client";

import { Sparkles, Cake, Briefcase, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepOccasionSelectionProps {
  onNext: (data: { occasion: string }) => void;
  selectedOccasion: string | null;
}

const occasionOptions = [
  {
    id: "anniversary",
    label: "Anniversary",
    icon: Sparkles,
    desc: "A celebration of enduring love. We will arrange for a prime table and a special commemorative gesture from the Chef."
  },
  {
    id: "birthday",
    label: "Birthday",
    icon: Cake,
    desc: "Honoring another year of life. Allow our sommelier to suggest a vintage that mirrors the significance of the date."
  },
  {
    id: "business",
    label: "Business",
    icon: Briefcase,
    desc: "Where influence meets excellence. We ensure a setting conducive to privacy and refined conversation."
  },
  {
    id: "quiet",
    label: "A Quiet Evening",
    icon: Moon,
    desc: "Simple epicurean appreciation. No special occasion needed—only a desire for the finest culinary artistry."
  }
];

export const StepOccasionSelection = ({ onNext, selectedOccasion }: StepOccasionSelectionProps) => {
  return (
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase mb-2 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">The Occasion</span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">06. <span className="text-gold-gradient">The Purpose</span></h1>
        <p className="font-body text-on-surface/70 text-lg md:text-xl max-w-2xl font-light">Tell us the nature of your visit so we may curate the atmosphere.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {occasionOptions.map(option => {
          const Icon = option.icon;
          const isSelected = selectedOccasion === option.id;

          return (
            <button 
              key={option.id}
              onClick={() => onNext({ occasion: option.id })}
              className={cn(
                "group relative flex flex-col text-left p-10 transition-all duration-500 rounded-2xl border",
                isSelected 
                  ? "bg-[#E5E7EB] border-[#E5E7EB] shadow-2xl shadow-black/40 scale-[1.02]" 
                  : "glass-card border-transparent hover:bg-[#E5E7EB]/8 hover:border-[#E5E7EB]/20"
              )}
            >
              <div className="flex items-center justify-between mb-8">
                <Icon className={cn(
                  "w-10 h-10 transition-colors duration-500",
                  isSelected ? "text-[#111412]" : "text-[#E5E7EB]/60 group-hover:text-[#E5E7EB]"
                )} />
                <span className={cn(
                  "font-label text-[10px] tracking-[0.3em] uppercase transition-opacity duration-700 font-bold",
                  isSelected ? "text-[#111412]/60 opacity-100" : "text-[#E5E7EB]/40 opacity-0 group-hover:opacity-100"
                )}>
                  Select {option.label}
                </span>
              </div>
              <h3 className={cn(
                "font-headline italic text-3xl mb-3",
                isSelected ? "text-[#111412]" : "text-[#E5E7EB]/80"
              )}>{option.label}</h3>
              <p className={cn(
                "font-body leading-relaxed font-light text-sm italic",
                isSelected ? "text-[#111412]/60" : "text-[#E5E7EB]/40"
              )}>{option.desc}</p>
              <div className={cn(
                "mt-8 h-px transition-all duration-700 ease-in-out",
                isSelected ? "w-full bg-gold-gradient" : "w-0 group-hover:w-full bg-[#E5E7EB]/20"
              )}></div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
