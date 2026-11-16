"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Check, Clock, Loader2, MapPin, Sparkles, Users } from "lucide-react";
import { dayHoursLabel, toWeeklyHours } from "@/components/marketplace/WeeklyHoursEditor";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { MarketplaceVenue } from "@/types";

export const TROPICA_VENUE_ID = "tropica";

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

interface Props {
  date: string | null;
  selectedId: string | null;
  onNext: (data: { venueId: string; venue: MarketplaceVenue | null }) => void;
}

/**
 * Step 2 of "Book the Venue": after picking a date the customer sees Tropica plus every
 * partner venue free that day. Picking a partner venue re-themes the rest of the flow.
 */
export const StepVenueSelect = ({ date, selectedId, onNext }: Props) => {
  const [result, setResult] = useState<{ key: string; venues: MarketplaceVenue[]; error: string | null } | null>(null);
  const [picked, setPicked] = useState<string | null>(selectedId);

  const sessionDate = date ? format(new Date(date), "yyyy-MM-dd") : "";
  const dateLabel = date ? format(new Date(date), "EEEE, MMMM do") : "";
  // Loading = we don't yet have a response for the current date
  const loading = Boolean(sessionDate) && result?.key !== sessionDate;
  const venues = result?.key === sessionDate ? result.venues : [];
  const error = result?.key === sessionDate ? result.error : null;

  useEffect(() => {
    if (!sessionDate) return;
    let cancelled = false;
    api
      .get("/marketplace/venues", { params: { date: sessionDate } })
      .then(({ data }) => !cancelled && setResult({ key: sessionDate, venues: data?.venues || [], error: null }))
      .catch(
        () =>
          !cancelled &&
          setResult({ key: sessionDate, venues: [], error: "Couldn't load partner venues right now. You can still book Tropica." })
      );
    return () => {
      cancelled = true;
    };
  }, [sessionDate]);

  const choose = (id: string) => {
    setPicked(id);
    const venue = id === TROPICA_VENUE_ID ? null : venues.find((v) => v._id === id) || null;
    setTimeout(() => onNext({ venueId: id, venue }), 220);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-brand font-bold">Choose your venue</p>
        <h2 className="font-headline text-2xl md:text-3xl text-brand-fg">Where should we host you?</h2>
        {dateLabel && <p className="text-sm text-brand-fg/60">Venues available on {dateLabel}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Tropica — our own venue, always first */}
        <button
          type="button"
          onClick={() => choose(TROPICA_VENUE_ID)}
          className={cn(
            "group text-left rounded-2xl overflow-hidden border transition-all bg-brand-fg/5",
            picked === TROPICA_VENUE_ID ? "border-brand ring-2 ring-brand/40" : "border-brand-fg/10 hover:border-brand/50"
          )}
        >
          <div className="relative h-40 bg-cover bg-center" style={{ backgroundImage: "url(/venue_ambience.jpg)" }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-[#C8A96A] text-[#0d1612] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1">
              <Sparkles className="w-3 h-3" /> Tropica Original
            </span>
            {picked === TROPICA_VENUE_ID && <CheckBadge />}
            <h3 className="absolute bottom-3 left-4 font-headline text-xl text-white">Tropica NYC</h3>
          </div>
          <div className="p-4 space-y-1">
            <p className="text-sm text-brand-fg/70">Our tropical sanctuary with dining, DJ & photo add-ons.</p>
            <p className="text-xs text-brand flex items-center gap-1 font-semibold">
              Continue with Tropica <ArrowRight className="w-3 h-3" />
            </p>
          </div>
        </button>

        {loading &&
          [0, 1, 2].map((i) => <div key={i} className="h-[236px] rounded-2xl bg-brand-fg/5 animate-pulse border border-brand-fg/10" />)}

        {!loading &&
          venues.map((v) => {
            const unavailable = v.available === false;
            return (
              <button
                key={v._id}
                type="button"
                disabled={unavailable}
                onClick={() => choose(v._id)}
                className={cn(
                  "group text-left rounded-2xl overflow-hidden border transition-all bg-brand-fg/5",
                  unavailable && "opacity-45 cursor-not-allowed",
                  picked === v._id ? "border-brand ring-2 ring-brand/40" : "border-brand-fg/10 hover:border-brand/50"
                )}
              >
                <div
                  className="relative h-40 bg-cover bg-center"
                  style={
                    v.coverUrl
                      ? { backgroundImage: `url(${v.coverUrl})` }
                      : // No photo yet → show the venue's own brand colors
                        { background: `linear-gradient(135deg, ${v.theme.background}, ${v.theme.primary})` }
                  }
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                  {/* Swatch previews the venue's theme the customer is about to enter */}
                  <span className="absolute top-3 left-3 flex gap-1">
                    {[v.theme.primary, v.theme.accent, v.theme.background].map((c) => (
                      <span key={c} className="w-3.5 h-3.5 rounded-full border border-white/60" style={{ background: c }} />
                    ))}
                  </span>
                  {v.customerDiscountPct > 0 && !unavailable && picked !== v._id && (
                    <span className="absolute top-3 right-3 rounded-full bg-white text-[#0d1612] text-[10px] font-bold px-2.5 py-1">
                      {v.customerDiscountPct}% off via Tropica
                    </span>
                  )}
                  {picked === v._id && <CheckBadge />}
                  <div className="absolute bottom-3 left-4 right-4 flex items-end gap-2">
                    {v.logoUrl && <img src={v.logoUrl} alt="" className="w-9 h-9 rounded-full object-cover border border-white/70" />}
                    <h3 className="font-headline text-xl text-white leading-tight">{v.name}</h3>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  {v.tagline && <p className="text-sm text-brand-fg/70 line-clamp-1">{v.tagline}</p>}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-fg/60">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {v.neighborhood || v.city}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {v.minGuests}–{v.maxGuests} guests
                    </span>
                    {sessionDate && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />{" "}
                        {(() => {
                          const day = toWeeklyHours(v).find((d) => d.day === new Date(`${sessionDate}T12:00:00`).getDay());
                          return day?.open ? `Open ${dayHoursLabel(day)}` : "Closed this day";
                        })()}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-brand-fg">
                    {unavailable ? (
                      <span className="text-brand-fg/60">Fully booked this day</span>
                    ) : (
                      <>
                        From <strong className="text-brand">{money(v.priceFrom)}</strong>
                        {v.regularPriceFrom > v.priceFrom && (
                          <span className="ml-1.5 text-brand-fg/40 line-through text-xs">{money(v.regularPriceFrom)}</span>
                        )}
                        <span className="text-brand-fg/50 text-xs">
                          {v.pricingMode === "hourly" ? ` · ${v.minHours}h minimum` : ""}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </button>
            );
          })}
      </div>

      {error && <p className="text-center text-sm text-brand-fg/60">{error}</p>}
      {!loading && !error && venues.length === 0 && (
        <p className="text-center text-sm text-brand-fg/60">No partner venues are listed for this date yet.</p>
      )}
      {loading && (
        <p className="flex items-center justify-center gap-2 text-xs text-brand-fg/50">
          <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking venue availability…
        </p>
      )}
    </div>
  );
};

const CheckBadge = () => (
  <span className="absolute top-3 right-3 w-7 h-7 rounded-full bg-brand text-brand-ink flex items-center justify-center shadow-lg">
    <Check className="w-4 h-4" />
  </span>
);

export default StepVenueSelect;
