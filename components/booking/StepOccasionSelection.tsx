"use client";

import { useState } from "react";
import { Sparkles, Cake, Briefcase, Moon, Baby, PartyPopper, Edit3, ArrowRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepOccasionSelectionProps {
  onNext: (data: { occasion: string }) => void;
  selectedOccasion: string | null;
}

const occasionOptions = [
  {
    id: "birthday",
    label: "Birthday",
    icon: Cake,
    desc: "Another year to celebrate, with festive touches."
  },
  {
    id: "anniversary",
    label: "Anniversary",
    icon: Sparkles,
    desc: "Celebrate your love with special settings."
  },
  {
    id: "baby_shower",
    label: "Baby Shower / Family",
    icon: Baby,
    desc: "New arrivals and family gatherings."
  },
  {
    id: "celebration",
    label: "Milestone",
    icon: PartyPopper,
    desc: "Graduation, promotion, reunion and more."
  },
  {
    id: "business",
    label: "Corporate / Business",
    icon: Briefcase,
    desc: "Private dinners, teams and networking."
  },
  {
    id: "quiet",
    label: "Quiet Evening",
    icon: Moon,
    desc: "No occasion needed, just great food."
  },
  {
    id: "other",
    label: "Something Else",
    icon: Edit3,
    desc: "Engagement, retirement or a custom theme? Tell us."
  }
];

export const StepOccasionSelection = ({ onNext, selectedOccasion }: StepOccasionSelectionProps) => {
  const [selectedId, setSelectedId] = useState<string>(
    selectedOccasion ? (occasionOptions.some(o => o.id === selectedOccasion) ? selectedOccasion : "other") : ""
  );
  const [customOccasion, setCustomOccasion] = useState<string>(
    selectedOccasion && !occasionOptions.some(o => o.id === selectedOccasion)
      ? selectedOccasion.replace(/^other:\s*/i, "")
      : ""
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    if (id !== "other") {
      onNext({ occasion: id });
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalVal = customOccasion.trim() ? `other: ${customOccasion.trim()}` : "other";
    onNext({ occasion: finalVal });
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">06.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Party Occasion
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Select Your <span className="text-gold-gradient">Party Occasion</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light max-w-2xl">
          Choose an occasion so our concierge and culinary teams can tailor your private sanctuary atmosphere.
        </p>
      </header>

      {/* Compact icon cards, two per row ("Other" spans the full row) */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {occasionOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedId === option.id;
          const isOther = option.id === "other";

          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "group relative rounded-2xl border text-left transition-all duration-300 cursor-pointer",
                isOther ? "col-span-2 flex items-center gap-4 p-4" : "flex flex-col gap-3 p-4 sm:p-5",
                isSelected
                  ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-[0_0_25px_rgba(200,169,106,0.2)]"
                  : "bg-[#121614] border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/[0.04]"
              )}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#C8A96A] text-[#0d1612]">
                  <Check className="w-3 h-3 stroke-[3]" />
                </span>
              )}
              <span
                className={cn(
                  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-all duration-300",
                  isSelected
                    ? "bg-[#C8A96A] text-[#0d1612]"
                    : "bg-white/[0.05] border border-white/10 text-[#C8A96A] group-hover:bg-[#C8A96A]/10 group-hover:border-[#C8A96A]/30"
                )}
              >
                <Icon className="w-5 h-5" />
              </span>
              <span className="min-w-0 pr-5">
                <span
                  className={cn(
                    "block font-headline text-base sm:text-lg font-bold leading-tight transition-colors",
                    isSelected ? "text-[#E3C281]" : "text-white group-hover:text-[#E3C281]"
                  )}
                >
                  {option.label}
                </span>
                <span className="mt-1 block text-[11px] sm:text-xs text-white/55 leading-snug line-clamp-2 font-body">{option.desc}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Custom input drawer if "Other" is selected */}
      {selectedId === "other" && (
        <form
          onSubmit={handleCustomSubmit}
          className="p-6 sm:p-8 bg-[#121614] rounded-3xl border border-[#C8A96A]/40 space-y-5 animate-in fade-in duration-300 shadow-2xl"
        >
          <div className="space-y-1.5">
            <label className="block font-headline italic text-2xl text-white">
              Tell us about your celebration
            </label>
            <p className="text-xs text-white/60 font-body">
              Specify your event (e.g. Engagement Party, Gender Reveal, Retirement Dinner, etc.)
            </p>
          </div>
          <input
            type="text"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            placeholder="Type your celebration details here..."
            className="w-full bg-white/[0.05] border border-white/15 rounded-2xl px-5 py-3.5 text-white font-body text-base placeholder:text-white/30 focus:outline-none focus:border-[#C8A96A] transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label text-xs uppercase tracking-widest font-bold rounded-xl shadow-lg transition-all cursor-pointer"
          >
            <span>Continue to Add-ons</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
