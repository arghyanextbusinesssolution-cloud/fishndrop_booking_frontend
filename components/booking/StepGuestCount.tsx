"use client";

import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface StepGuestCountProps {
  onNext: (data: { guests: number }) => void;
  selectedGuests: number;
}

const MAX_GUESTS = 8;
const MIN_GUESTS = 2;

const getTableNote = (guests: number): string => {
  if (guests === 2) return "1 x 2-Seater Table";
  if (guests === 3 || guests === 4) return "1 x 4-Seater Table";
  if (guests === 5) return "1 x 4-Seater (Plus chair arrangement)";
  if (guests === 6) return "1 x 4-Seater + 1 x 2-Seater";
  if (guests === 7 || guests === 8) return "2 x 4-Seater Tables";
  return "";
};

export const StepGuestCount = ({ onNext, selectedGuests }: StepGuestCountProps) => {
  const [count, setCount] = useState(selectedGuests >= MIN_GUESTS ? selectedGuests : MIN_GUESTS);

  const decrement = () => setCount(prev => Math.max(MIN_GUESTS, prev - 1));
  const increment = () => setCount(prev => Math.min(MAX_GUESTS, prev + 1));

  return (
    <div className="space-y-12">
      <div className="text-center md:text-left space-y-4">
        <span className="font-label tracking-[0.2em] text-primary text-[10px] uppercase mb-2 block font-bold transition-all animate-in fade-in slide-in-from-left-4 duration-500">
          The Journey Begins
        </span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">
          01. <span className="text-gold-gradient">The Ensemble</span>
        </h1>
        <p className="font-body text-on-surface/70 text-lg md:text-xl max-w-2xl font-light">
          How many guests will be joining this evening? We accommodate intimate duos to grand parties of eight.
        </p>
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center gap-12 py-8 glass-card-high rounded-3xl p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gold-gradient" />
        <div className="flex items-center gap-12">
          <button
            onClick={decrement}
            disabled={count <= MIN_GUESTS}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 font-bold text-xl",
              count <= MIN_GUESTS
                ? "bg-[#E5E7EB]/10 text-[#E5E7EB]/20 cursor-not-allowed"
                : "bg-[#E5E7EB] text-[#111412] hover:bg-white hover:scale-110 shadow-lg shadow-black/30"
            )}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[160px]">
            <span className="font-headline text-[9rem] italic leading-none text-gold-gradient block drop-shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              {count}
            </span>
            <p className="font-label text-[10px] tracking-[0.3em] uppercase text-on-surface/30 font-bold -mt-2">
              {count === 1 ? "Guest" : "Guests"}
            </p>
          </div>

          <button
            onClick={increment}
            disabled={count >= MAX_GUESTS}
            className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 font-bold text-xl",
              count >= MAX_GUESTS
                ? "bg-[#E5E7EB]/10 text-[#E5E7EB]/20 cursor-not-allowed"
                : "bg-[#E5E7EB] text-[#111412] hover:bg-white hover:scale-110 shadow-lg shadow-black/30"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Table note */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-24 bg-[#C8A96A]/30" />
          <p className="font-body text-sm text-on-surface/60 italic font-light text-center">
            {getTableNote(count)}
          </p>
          <p className="font-label text-[9px] tracking-[0.2em] uppercase text-gold-gradient font-bold bg-primary/5 px-4 py-1.5 rounded-full border border-[#C8A96A]/20">
            ${count * 40}.00 Deposit · Subject to availability
          </p>
        </div>

        {/* Quick select dots */}
        <div className="flex items-center gap-3">
          {Array.from({ length: MAX_GUESTS - MIN_GUESTS + 1 }, (_, i) => i + MIN_GUESTS).map(n => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={cn(
                "transition-all duration-500 rounded-full font-label text-[9px] font-bold flex items-center justify-center",
                count === n
                  ? "w-10 h-10 bg-[#E5E7EB] text-[#111412] shadow-xl shadow-black/30"
                  : "w-8 h-8 bg-[#E5E7EB]/10 text-[#E5E7EB]/40 hover:bg-[#E5E7EB]/25 hover:text-[#E5E7EB] border border-[#E5E7EB]/10"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {count === MAX_GUESTS && (
          <p className="font-body text-[11px] text-on-surface/30 italic text-center max-w-sm font-light">
            For parties larger than 8, please contact us directly for a private dining arrangement.
          </p>
        )}
      </div>

      {/* Confirm CTA */}
      <div className="flex justify-center">
        <button
          onClick={() => onNext({ guests: count })}
          className="group relative inline-flex items-center gap-4 bg-[#E5E7EB] text-[#111412] font-label text-[10px] tracking-[0.25em] uppercase py-5 px-12 rounded-lg shadow-2xl shadow-black/40 hover:bg-white hover:scale-[1.05] active:scale-95 transition-all duration-700 font-bold"
        >
          Proceed to Selection
          <div className="w-5 h-px bg-[#111412]/40 group-hover:w-8 transition-all" />
        </button>
      </div>
    </div>
  );
};
