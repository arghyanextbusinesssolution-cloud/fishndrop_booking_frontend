"use client";

import { useState } from "react";
import { Calendar } from "./Calendar";
import { ArrowRight } from "lucide-react";

interface StepDateSelectionProps {
  onNext: (data: { date: string }) => void;
  selectedDate: string | null;
}

const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateStr = (dateStr: string | null): Date | null => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  const d = new Date(year, month - 1, day);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const StepDateSelection = ({ onNext, selectedDate }: StepDateSelectionProps) => {
  const [picked, setPicked] = useState<Date | null>(parseDateStr(selectedDate));

  const handleSelect = (date: Date) => {
    setPicked(date);
  };

  const handleContinue = () => {
    if (!picked) return;
    onNext({ date: formatDateStr(picked) });
  };

  const formattedPicked = picked
    ? picked.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })
    : null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="text-center md:text-left space-y-4">
        <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase mb-2 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">
          Choose Your Date
        </span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">
          01. <span className="text-gold-gradient">The Date</span>
        </h1>
        <p className="font-body text-on-surface/70 text-lg md:text-xl max-w-2xl font-light">
          Select the perfect date for your experience. Every evening is a new story waiting to unfold.
        </p>
      </div>

      {/* Calendar */}
      <div className="glass-card-high rounded-3xl p-6 md:p-10 relative overflow-hidden max-w-xl mx-auto md:mx-0">
        <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
        <Calendar onSelect={handleSelect} selectedDate={picked} />
      </div>

      {/* Selected date badge */}
      {picked && (
        <div className="flex justify-center md:justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[#C8A96A]/30 bg-[#C8A96A]/10">
            <div className="w-2 h-2 rounded-full bg-[#C8A96A] animate-pulse" />
            <span className="font-label text-[11px] uppercase tracking-widest text-[#C8A96A] font-bold">
              {formattedPicked}
            </span>
          </div>
        </div>
      )}

      {/* Confirm CTA */}
      <div className="flex justify-center md:justify-start">
        <button
          onClick={handleContinue}
          disabled={!picked}
          className="group relative inline-flex items-center gap-4 bg-[#E5E7EB] text-[#111412] font-label text-[10px] tracking-[0.25em] uppercase py-5 px-12 rounded-lg shadow-2xl shadow-black/40 hover:bg-white hover:scale-[1.05] active:scale-95 transition-all duration-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Proceed to Guest Count
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
};
