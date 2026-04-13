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
          Reservation Journey
        </span>
        <h1 className="font-headline italic text-5xl md:text-7xl mb-6 tracking-tight text-on-surface">
          03. The Ensemble
        </h1>
        <p className="font-body text-secondary text-lg md:text-xl max-w-2xl font-light">
          How many guests will be joining this evening? We accommodate intimate duos to grand parties of eight.
        </p>
      </div>

      {/* Counter */}
      <div className="flex flex-col items-center gap-12 py-8">
        <div className="flex items-center gap-12">
          <button
            onClick={decrement}
            disabled={count <= MIN_GUESTS}
            className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              count <= MIN_GUESTS
                ? "border-outline-variant/20 text-outline/30 cursor-not-allowed"
                : "border-outline-variant/40 text-secondary hover:border-primary hover:text-primary hover:scale-110"
            )}
          >
            <Minus className="w-5 h-5" />
          </button>

          <div className="text-center min-w-[160px]">
            <span className="font-headline text-[9rem] italic leading-none text-gold-gradient block">
              {count}
            </span>
            <p className="font-label text-[10px] tracking-[0.3em] uppercase text-outline font-bold -mt-2">
              {count === 1 ? "Guest" : "Guests"}
            </p>
          </div>

          <button
            onClick={increment}
            disabled={count >= MAX_GUESTS}
            className={cn(
              "w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-300",
              count >= MAX_GUESTS
                ? "border-outline-variant/20 text-outline/30 cursor-not-allowed"
                : "border-outline-variant/40 text-secondary hover:border-primary hover:text-primary hover:scale-110"
            )}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Table note */}
        <div className="flex flex-col items-center gap-3">
          <div className="h-px w-24 bg-primary-container/50" />
          <p className="font-body text-sm text-secondary italic font-light text-center">
            {getTableNote(count)}
          </p>
          <p className="font-label text-[9px] tracking-[0.2em] uppercase text-outline/50 font-bold">
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
                "transition-all duration-300 rounded-full font-label text-[9px] font-bold flex items-center justify-center",
                count === n
                  ? "w-9 h-9 bg-primary text-on-primary shadow-lg shadow-primary/20"
                  : "w-7 h-7 bg-surface-container-low text-outline hover:bg-surface-container hover:text-on-surface"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        {count === MAX_GUESTS && (
          <p className="font-body text-[11px] text-outline italic text-center max-w-sm font-light">
            For parties larger than 8, please contact us directly for a private dining arrangement.
          </p>
        )}
      </div>

      {/* Confirm CTA */}
      <div className="flex justify-center">
        <button
          onClick={() => onNext({ guests: count })}
          className="group relative inline-flex items-center gap-4 bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.25em] uppercase py-5 px-12 rounded-lg shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all duration-500 font-bold"
        >
          Confirm {count} {count === 1 ? "Guest" : "Guests"}
          <div className="w-5 h-px bg-on-primary/60 group-hover:w-8 transition-all" />
        </button>
      </div>
    </div>
  );
};
