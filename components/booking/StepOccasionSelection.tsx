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
    label: "Birthday Celebration",
    icon: Cake,
    desc: "Honoring another year of life. Allow our team to curate a memorable festive experience for your party."
  },
  {
    id: "anniversary",
    label: "Anniversary Celebration",
    icon: Sparkles,
    desc: "A celebration of enduring love. Prime table settings and celebratory touches."
  },
  {
    id: "baby_shower",
    label: "Baby Shower / Family Event",
    icon: Baby,
    desc: "Welcoming a new arrival or family gathering with comfort seating and dedicated service."
  },
  {
    id: "celebration",
    label: "Celebration & Milestone Gathering",
    icon: PartyPopper,
    desc: "Graduation, promotion, reunion, or milestone moments elevating your special group celebration."
  },
  {
    id: "business",
    label: "Corporate / Business Dinner",
    icon: Briefcase,
    desc: "Where influence meets excellence. A private setting conducive to refined conversation and networking."
  },
  {
    id: "quiet",
    label: "A Quiet Sanctuary Evening",
    icon: Moon,
    desc: "Simple epicurean appreciation. No special occasion needed—only a desire for private culinary artistry."
  },
  {
    id: "other",
    label: "Other Bespoke Event",
    icon: Edit3,
    desc: "Have something unique in mind like an engagement, retirement, or custom theme? Specify your details."
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
    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <header className="space-y-3 text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-4">
          <span className="font-headline italic text-[#C8A96A] text-base">04.</span>
          <div className="h-[1px] w-8 bg-white/20"></div>
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Step 04 of 06 &bull; The Celebration Type
          </span>
        </div>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          Select Your <span className="text-gold-gradient">Occasion</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light max-w-2xl">
          Choose an occasion so our concierge and culinary teams can tailor your private sanctuary atmosphere.
        </p>
      </header>

      {/* Horizontal Rectangular Cards Stack */}
      <div className="flex flex-col gap-3 sm:gap-4">
        {occasionOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedId === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={cn(
                "w-full p-4 sm:p-5 rounded-2xl border text-left transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-5 group cursor-pointer relative overflow-hidden backdrop-blur-md",
                isSelected
                  ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-[0_0_25px_rgba(200,169,106,0.25)] ring-1 ring-[#C8A96A]/60"
                  : "bg-[#121614] border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/[0.04] shadow-md"
              )}
            >
              {/* Left: Icon & Details */}
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300",
                    isSelected
                      ? "bg-[#C8A96A] text-[#0d1612] shadow-md shadow-[#C8A96A]/30 scale-105"
                      : "bg-white/[0.05] border border-white/10 text-[#C8A96A] group-hover:bg-[#C8A96A]/10 group-hover:border-[#C8A96A]/30"
                  )}
                >
                  <Icon className="w-6 h-6" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3
                      className={cn(
                        "font-headline text-lg sm:text-xl font-bold truncate transition-colors",
                        isSelected ? "text-[#E3C281]" : "text-white group-hover:text-[#E3C281]"
                      )}
                    >
                      {option.label}
                    </h3>
                  </div>
                  <p className="text-xs text-white/60 line-clamp-2 mt-0.5 font-body">
                    {option.desc}
                  </p>
                </div>
              </div>

              {/* Right: Selection Action Pill */}
              <div className="shrink-0 flex items-center justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full font-label transition-all flex items-center gap-1.5",
                    isSelected
                      ? "bg-[#C8A96A] text-[#0d1612] shadow-sm font-extrabold"
                      : "bg-white/5 text-white/50 border border-white/10 group-hover:border-[#C8A96A]/40 group-hover:text-white"
                  )}
                >
                  {isSelected ? (
                    <>
                      <Check className="w-3.5 h-3.5 stroke-[3]" /> Selected
                    </>
                  ) : (
                    "Select ➔"
                  )}
                </span>
              </div>
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
