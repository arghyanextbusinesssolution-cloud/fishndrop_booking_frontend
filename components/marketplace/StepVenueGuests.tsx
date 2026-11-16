"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Minus, Plus, Users } from "lucide-react";
import type { MarketplaceVenue } from "@/types";

interface Props {
  venue: MarketplaceVenue;
  date: string | null;
  initialGuests?: number;
  onNext: (data: { guests: number }) => void;
}

/** Guest count for a partner venue — limits come from the venue's capacity. */
export const StepVenueGuests = ({ venue, date, initialGuests, onNext }: Props) => {
  const clamp = (n: number) => Math.min(venue.maxGuests, Math.max(venue.minGuests, Math.round(n) || venue.minGuests));
  const [guests, setGuests] = useState(clamp(initialGuests ?? venue.minGuests));
  const step = venue.maxGuests > 60 ? 5 : 1;

  return (
    <div className="max-w-xl mx-auto space-y-8 text-center">
      <div className="space-y-2">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-brand font-bold">{venue.name}</p>
        <h2 className="font-headline text-2xl md:text-3xl text-brand-fg">How many guests?</h2>
        {date && <p className="text-sm text-brand-fg/60">{format(new Date(date), "EEEE, MMMM do")}</p>}
      </div>

      <div className="flex items-center justify-center gap-6">
        <button
          type="button"
          aria-label="Fewer guests"
          onClick={() => setGuests((g) => clamp(g - step))}
          disabled={guests <= venue.minGuests}
          className="w-12 h-12 rounded-full border border-brand-fg/20 text-brand-fg flex items-center justify-center hover:border-brand disabled:opacity-30"
        >
          <Minus className="w-5 h-5" />
        </button>
        <div className="min-w-[120px]">
          <input
            type="number"
            inputMode="numeric"
            value={guests}
            min={venue.minGuests}
            max={venue.maxGuests}
            onChange={(e) => setGuests(Number(e.target.value))}
            onBlur={() => setGuests((g) => clamp(g))}
            className="w-full bg-transparent text-center font-headline text-5xl text-brand outline-none"
          />
          <p className="text-xs uppercase tracking-widest text-brand-fg/50 flex items-center justify-center gap-1">
            <Users className="w-3 h-3" /> guests
          </p>
        </div>
        <button
          type="button"
          aria-label="More guests"
          onClick={() => setGuests((g) => clamp(g + step))}
          disabled={guests >= venue.maxGuests}
          className="w-12 h-12 rounded-full border border-brand-fg/20 text-brand-fg flex items-center justify-center hover:border-brand disabled:opacity-30"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <input
        type="range"
        min={venue.minGuests}
        max={venue.maxGuests}
        step={step}
        value={guests}
        onChange={(e) => setGuests(clamp(Number(e.target.value)))}
        className="w-full accent-[rgb(var(--brand))]"
      />
      <p className="text-xs text-brand-fg/50">
        {venue.name} hosts {venue.minGuests}–{venue.maxGuests} guests.
      </p>

      <button
        type="button"
        onClick={() => onNext({ guests: clamp(guests) })}
        className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-ink px-8 py-3 font-label text-xs uppercase tracking-widest font-bold hover:opacity-90"
      >
        Continue <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};

export default StepVenueGuests;
