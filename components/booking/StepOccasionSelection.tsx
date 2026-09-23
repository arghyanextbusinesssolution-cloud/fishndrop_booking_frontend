"use client";

import { useState } from "react";
import { Sparkles, Cake, Briefcase, Moon, Baby, PartyPopper, Edit3, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepOccasionSelectionProps {
  onNext: (data: { occasion: string }) => void;
  selectedOccasion: string | null;
}

const occasionOptions = [
  {
    id: "baby_shower",
    label: "Baby Shower / Baby Event",
    icon: Baby,
    desc: "Celebrating a new arrival or family gathering. We ensure special high-comfort seating and tailored arrangements."
  },
  {
    id: "birthday",
    label: "Birthday Celebration",
    icon: Cake,
    desc: "Honoring another year of life. Allow our team to curate a memorable festive experience for your party."
  },
  {
    id: "anniversary",
    label: "Anniversary",
    icon: Sparkles,
    desc: "A celebration of enduring love. We will arrange a prime table with special commemorative touches."
  },
  {
    id: "celebration",
    label: "Celebration & Gathering",
    icon: PartyPopper,
    desc: "Graduation, promotion, reunion, or milestone moments. Elevating your special group celebration."
  },
  {
    id: "business",
    label: "Business / Corporate",
    icon: Briefcase,
    desc: "Where influence meets excellence. We ensure a setting conducive to privacy and refined conversation."
  },
  {
    id: "quiet",
    label: "A Quiet Evening",
    icon: Moon,
    desc: "Simple epicurean appreciation. No special occasion needed—only a desire for fine culinary artistry."
  },
  {
    id: "other",
    label: "Other Special Event",
    icon: Edit3,
    desc: "Have something unique in mind like babysitting, engagement, or retirement? Specify your celebration details."
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
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase mb-2 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">
          The Celebration Type
        </span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">
          06. <span className="text-gold-gradient">The Occasion</span>
        </h1>
        <p className="font-body text-on-surface/70 text-lg md:text-xl max-w-2xl font-light">
          What type of celebration is it? Choose an occasion so we can tailor the dining experience for you and your guests.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {occasionOptions.map((option) => {
          const Icon = option.icon;
          const isSelected = selectedId === option.id;

          return (
            <button
              key={option.id}
              onClick={() => handleSelect(option.id)}
              className={cn(
                "group relative flex flex-col text-left p-8 transition-all duration-500 rounded-2xl border",
                isSelected
                  ? "bg-[#E5E7EB] border-[#E5E7EB] shadow-2xl shadow-black/40 scale-[1.02]"
                  : "glass-card border-transparent hover:bg-[#E5E7EB]/8 hover:border-[#E5E7EB]/20"
              )}
            >
              <div className="flex items-center justify-between mb-6">
                <Icon
                  className={cn(
                    "w-8 h-8 transition-colors duration-500",
                    isSelected ? "text-[#111412]" : "text-[#E5E7EB]/60 group-hover:text-[#E5E7EB]"
                  )}
                />
                <span
                  className={cn(
                    "font-label text-[9px] tracking-[0.3em] uppercase transition-opacity duration-700 font-bold",
                    isSelected ? "text-[#111412]/60 opacity-100" : "text-[#E5E7EB]/40 opacity-0 group-hover:opacity-100"
                  )}
                >
                  {isSelected ? "Selected" : "Select"}
                </span>
              </div>
              <h3
                className={cn(
                  "font-headline italic text-2xl mb-2",
                  isSelected ? "text-[#111412]" : "text-[#E5E7EB]/90"
                )}
              >
                {option.label}
              </h3>
              <p
                className={cn(
                  "font-body leading-relaxed font-light text-xs italic flex-grow",
                  isSelected ? "text-[#111412]/70" : "text-[#E5E7EB]/50"
                )}
              >
                {option.desc}
              </p>
              <div
                className={cn(
                  "mt-6 h-px transition-all duration-700 ease-in-out",
                  isSelected ? "w-full bg-gold-gradient" : "w-0 group-hover:w-full bg-[#E5E7EB]/20"
                )}
              ></div>
            </button>
          );
        })}
      </div>

      {/* Custom input drawer if "Other" is selected */}
      {selectedId === "other" && (
        <form
          onSubmit={handleCustomSubmit}
          className="p-8 glass-card rounded-2xl border border-primary/30 space-y-6 max-w-2xl animate-in fade-in duration-500"
        >
          <div className="space-y-2">
            <label className="block font-headline italic text-2xl text-on-surface">
              Tell us about your celebration
            </label>
            <p className="text-xs text-on-surface/60 font-body">
              Specify your event (e.g. Babysitting gathering, Gender Reveal, Family Reunion, Engagement, etc.)
            </p>
          </div>
          <input
            type="text"
            value={customOccasion}
            onChange={(e) => setCustomOccasion(e.target.value)}
            placeholder="Type your celebration type here..."
            className="w-full bg-surface-container/60 border border-outline-variant/30 rounded-xl px-5 py-4 text-on-surface font-body text-base placeholder:text-outline/40 focus:outline-none focus:border-primary transition-all"
            autoFocus
          />
          <button
            type="submit"
            className="flex items-center gap-3 px-8 py-4 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.2em] uppercase font-bold rounded-xl shadow-lg hover:brightness-110 transition-all"
          >
            <span>Continue to Add-ons</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
};
