"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, Clock, Loader2, Package } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { CustomerPrice, MarketplaceVenue, VenueSlot } from "@/types";

export interface VenueTimeSelection {
  time: string;
  endTime: string;
  durationHours: number;
  packageId?: string;
  packageName?: string;
  price: CustomerPrice;
}

interface Props {
  venue: MarketplaceVenue;
  date: string | null;
  initial?: Partial<VenueTimeSelection>;
  onNext: (data: VenueTimeSelection) => void;
}

const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
const label12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
};

/** Duration/package + start time for a partner venue, from its live availability. */
export const StepVenueTime = ({ venue, date, initial, onNext }: Props) => {
  const hasPackages = venue.packages.length > 0;
  const [packageId, setPackageId] = useState<string | undefined>(initial?.packageId ?? venue.packages[0]?._id);
  const [hours, setHours] = useState<number>(Math.max(venue.minHours, initial?.durationHours || venue.minHours));
  const [time, setTime] = useState<string | null>(initial?.time ?? null);
  const [result, setResult] = useState<{
    key: string;
    slots: VenueSlot[];
    price: CustomerPrice | null;
    hours: number;
    packageName?: string;
  } | null>(null);

  const sessionDate = date ? format(new Date(date), "yyyy-MM-dd") : "";
  const hourOptions = useMemo(() => Array.from({ length: 7 }, (_, i) => venue.minHours + i), [venue.minHours]);
  const requestPackageId = hasPackages ? packageId : undefined;
  const requestKey = `${sessionDate}|${hours}|${requestPackageId ?? ""}`;
  const current = result?.key === requestKey ? result : null;
  const loading = Boolean(sessionDate) && !current;
  const slots = current?.slots ?? [];
  const price = current?.price ?? null;
  const resolvedHours = current?.hours ?? hours;
  const packageName = current?.packageName;

  useEffect(() => {
    if (!sessionDate) return;
    let cancelled = false;
    api
      .get(`/marketplace/venues/${venue.slug}/slots`, {
        params: { date: sessionDate, hours, packageId: requestPackageId }
      })
      .then(({ data }) => {
        if (cancelled) return;
        setResult({ key: requestKey, slots: data.slots || [], price: data.price, hours: data.hours, packageName: data.packageName });
      })
      .catch(() => !cancelled && setResult({ key: requestKey, slots: [], price: null, hours }));
    return () => {
      cancelled = true;
    };
  }, [sessionDate, venue.slug, hours, requestPackageId, requestKey]);

  // A previously picked time only counts if it's still in the current slot list
  const chosen = slots.find((s) => s.startTime === time);

  return (
    <div className="space-y-7">
      <div className="text-center space-y-2">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-brand font-bold">{venue.name}</p>
        <h2 className="font-headline text-2xl md:text-3xl text-brand-fg">Pick your time</h2>
        {date && <p className="text-sm text-brand-fg/60">{format(new Date(date), "EEEE, MMMM do")}</p>}
      </div>

      {hasPackages ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {venue.packages.map((p) => (
            <button
              key={p._id}
              type="button"
              onClick={() => setPackageId(p._id)}
              className={cn(
                "text-left rounded-xl border p-4 transition-all",
                packageId === p._id ? "border-brand bg-brand/10" : "border-brand-fg/10 hover:border-brand/50"
              )}
            >
              <p className="flex items-center gap-2 text-brand-fg font-semibold">
                <Package className="w-4 h-4 text-brand" /> {p.name}
              </p>
              {p.description && <p className="text-xs text-brand-fg/60 mt-1">{p.description}</p>}
              <p className="mt-2 text-sm text-brand">
                {money(p.price)}
                {p.regularPrice > p.price && <span className="ml-1.5 text-xs text-brand-fg/40 line-through">{money(p.regularPrice)}</span>}
              </p>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-brand-fg/50 text-center">How long?</p>
          <div className="flex flex-wrap justify-center gap-2">
            {hourOptions.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => setHours(h)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-all",
                  hours === h ? "border-brand bg-brand text-brand-ink font-bold" : "border-brand-fg/15 text-brand-fg/80 hover:border-brand/50"
                )}
              >
                {h} hrs
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-brand-fg/50 text-center">Start time</p>
        {loading ? (
          <p className="flex items-center justify-center gap-2 text-sm text-brand-fg/60 py-6">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking availability…
          </p>
        ) : slots.length === 0 ? (
          <p className="text-center text-sm text-brand-fg/60 py-6">
            No {resolvedHours}-hour slots left on this date. Try a shorter duration or another date.
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {slots.map((s) => (
              <button
                key={s.startTime}
                type="button"
                onClick={() => setTime(s.startTime)}
                className={cn(
                  "rounded-lg border py-2.5 text-sm transition-all",
                  time === s.startTime ? "border-brand bg-brand text-brand-ink font-bold" : "border-brand-fg/15 text-brand-fg hover:border-brand/50"
                )}
              >
                {label12(s.startTime)}
              </button>
            ))}
          </div>
        )}
      </div>

      {price && (
        <div className="rounded-xl border border-brand-fg/10 bg-brand-fg/5 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm text-brand-fg/70 flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand" />
            {chosen ? `${label12(chosen.startTime)} – ${label12(chosen.endTime)}` : "Select a start time"} · {resolvedHours} hrs
          </div>
          <div className="text-right">
            <p className="text-brand-fg">
              <strong className="text-brand text-lg">{money(price.customerPrice)}</strong>
              {price.customerSavings > 0 && (
                <span className="ml-2 text-xs text-brand-fg/40 line-through">{money(price.regularPrice)}</span>
              )}
            </p>
            <p className="text-[11px] text-brand-fg/50">
              {price.depositPct < 100 ? `${money(price.depositAmount)} deposit to secure` : "Paid in full to secure"}
            </p>
          </div>
        </div>
      )}

      <div className="text-center">
        <button
          type="button"
          disabled={!chosen || !price}
          onClick={() =>
            chosen &&
            price &&
            onNext({
              time: chosen.startTime,
              endTime: chosen.endTime,
              durationHours: resolvedHours,
              packageId: hasPackages ? packageId : undefined,
              packageName,
              price
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-brand text-brand-ink px-8 py-3 font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-40"
        >
          Continue <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default StepVenueTime;
