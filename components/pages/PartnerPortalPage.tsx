"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Clock, CreditCard, ExternalLink, Inbox, Loader2, MapPin, Users } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import type { MarketplaceVenue } from "@/types";
import { VenueThemeProvider } from "@/components/marketplace/VenueThemeProvider";
import { dayHoursLabel, toWeeklyHours } from "@/components/marketplace/WeeklyHoursEditor";
import { PartnerEarningsPanel } from "@/components/marketplace/partner/PartnerEarningsPanel";

type OwnerVenue = MarketplaceVenue & {
  status: "draft" | "published" | "paused";
  basePrice: number;
  partnerDiscountPct: number;
  chargesEnabled: boolean;
  operatingDays: number[];
};

const STATUS = {
  draft: { label: "Being set up — not visible to customers yet", cls: "bg-white/10 text-white/70" },
  published: { label: "Live on Tropica NYC", cls: "bg-emerald-500/15 text-emerald-300" },
  paused: { label: "Paused — hidden from customers", cls: "bg-amber-500/15 text-amber-300" }
};
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const money = (n = 0) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

/** Partner portal home: the owner's venue as customers see it, plus what needs their attention. */
export default function PartnerPortalPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<{ venue: OwnerVenue; stats: { openRequests: number; upcoming: number } } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/partner/venue")
      .then(({ data }) => !cancelled && setData(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "Couldn't load your venue."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="p-10 text-rose-300 text-sm">{error}</p>;
  if (!data)
    return (
      <p className="p-10 flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your venue…
      </p>
    );

  const { venue: v, stats } = data;
  const status = STATUS[v.status];
  const payoutRate = 100 - (v.partnerDiscountPct || 0);

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto space-y-8 min-h-screen">
      <header className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">Partner Portal</span>
        <h1 className="text-3xl md:text-4xl font-headline italic text-white">Welcome, {user?.name?.split(" ")[0] || "partner"}</h1>
        <span className={cn("inline-block rounded-full px-3 py-1 text-[11px] font-bold", status.cls)}>{status.label}</span>
      </header>

      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          href="/partner-portal/requests"
          icon={<Inbox className="w-5 h-5" />}
          label="Requests waiting for you"
          value={String(stats.openRequests)}
          hint={stats.openRequests ? "Accept or decline →" : undefined}
          highlight={stats.openRequests > 0}
        />
        <StatCard href="/partner-portal/bookings" icon={<CalendarCheck className="w-5 h-5" />} label="Confirmed bookings" value={String(stats.upcoming)} />
        <StatCard
          href="/partner-portal/payouts"
          icon={<CreditCard className="w-5 h-5" />}
          label="Stripe payouts"
          value={v.chargesEnabled ? "Connected" : "Not connected"}
          hint={v.chargesEnabled ? undefined : "Connect Stripe to get paid →"}
          highlight={!v.chargesEnabled}
        />
      </div>

      <PartnerEarningsPanel />

      {/* The listing exactly as customers see it, in the venue's own theme */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Your listing</h2>
          {v.status === "published" && (
            <Link href="/book-venue" target="_blank" className="text-xs text-[#C8A96A] inline-flex items-center gap-1">
              View on website <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
        <VenueThemeProvider theme={v.theme} className="rounded-2xl overflow-hidden border border-white/10 bg-brand-bg">
          <div
            className="relative h-48 bg-cover bg-center"
            style={
              v.coverUrl
                ? { backgroundImage: `url(${v.coverUrl})` }
                : { background: `linear-gradient(135deg, ${v.theme.background}, ${v.theme.primary})` }
            }
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <div className="absolute bottom-4 left-5 flex items-end gap-3">
              {v.logoUrl && <img src={v.logoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-white/80" />}
              <div>
                <h3 className="font-headline text-2xl text-white">{v.name}</h3>
                {v.tagline && <p className="text-xs text-white/80">{v.tagline}</p>}
              </div>
            </div>
          </div>
          <div className="p-5 grid md:grid-cols-[2fr_1fr] gap-6">
            <div className="space-y-4">
              {v.description && <p className="text-sm text-brand-fg/80 leading-relaxed whitespace-pre-line">{v.description}</p>}
              <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-brand-fg/60">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {v.address}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {v.minGuests}–{v.maxGuests} guests
                </span>
              </div>
              {/* Weekly opening hours, Monday first */}
              <div className="rounded-xl border border-brand-fg/10 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] uppercase tracking-widest text-brand-fg/50 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Opening hours
                  </p>
                  <Link href="/partner-portal/availability" className="text-[11px] text-brand underline">
                    Edit
                  </Link>
                </div>
                <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1">
                  {[1, 2, 3, 4, 5, 6, 0].map((i) => {
                    const d = toWeeklyHours(v).find((x) => x.day === i);
                    return (
                      <p key={i} className={cn("text-xs flex justify-between gap-3", d?.open ? "text-brand-fg/80" : "text-brand-fg/35")}>
                        <span>{DAYS[i]}</span>
                        <span>{dayHoursLabel(d)}</span>
                      </p>
                    );
                  })}
                </div>
              </div>
              {v.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {v.amenities.map((a) => (
                    <span key={a} className="rounded-full border border-brand-fg/15 px-3 py-1 text-[11px] text-brand-fg/80">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              {v.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto">
                  {v.photos.map((p) => (
                    <img key={p} src={p} alt="" className="h-20 w-32 object-cover rounded-lg shrink-0" />
                  ))}
                </div>
              )}
            </div>
            <div className="rounded-xl bg-brand-fg/5 border border-brand-fg/10 p-4 space-y-2 text-sm h-fit">
              <p className="text-[10px] uppercase tracking-widest text-brand-fg/50">Your pricing</p>
              {v.packages.length > 0 ? (
                v.packages.map((p) => (
                  <p key={p._id} className="text-brand-fg flex justify-between gap-3">
                    <span>{p.name}</span>
                    <span>{money(p.regularPrice)}</span>
                  </p>
                ))
              ) : (
                <p className="text-brand-fg">
                  {money(v.basePrice)} {v.pricingMode === "hourly" ? `/ hour · ${v.minHours}h min` : "flat"}
                </p>
              )}
              <p className="text-xs text-brand-fg/60 pt-2 border-t border-brand-fg/10">
                You receive <strong className="text-brand">{payoutRate}%</strong> of your regular price on every Tropica booking.
              </p>
            </div>
          </div>
        </VenueThemeProvider>
        <p className="text-xs text-white/40">
          Change your colors and photos in{" "}
          <Link href="/partner-portal/brand" className="text-[#C8A96A] underline">Brand &amp; Theme</Link>. For details or pricing, contact the Tropica team.
        </p>
      </section>
    </div>
  );
}

const StatCard = ({
  icon,
  label,
  value,
  hint,
  href,
  highlight
}: {
  icon: ReactNode;
  label: string;
  value: string;
  hint?: string;
  href: string;
  highlight?: boolean;
}) => (
  <Link
    href={href}
    className={cn(
      "block rounded-2xl p-5 space-y-2 border transition-colors hover:border-[#C8A96A]/60",
      highlight ? "bg-[#C8A96A]/10 border-[#C8A96A]/40" : "bg-white/[0.03] border-white/10"
    )}
  >
    <div className="text-[#C8A96A]">{icon}</div>
    <p className="text-[10px] uppercase tracking-widest text-white/50">{label}</p>
    <p className="text-2xl font-headline text-white">{value}</p>
    {hint && <p className="text-[11px] text-[#C8A96A]/80">{hint}</p>}
  </Link>
);
