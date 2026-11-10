"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Clock, MapPin, Search, Sparkles, Ticket } from "lucide-react";
import api from "@/lib/axios";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { nyNow, fmt12 } from "@/components/events/EventFormPickers";

interface PublicTier {
  _id: string;
  name: string;
  price: number;
  available: number;
  isSoldOut: boolean;
}

interface PublicEvent {
  _id: string;
  title: string;
  slug: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  venueType?: "tropica" | "external";
  venueName: string;
  venueAddress: string;
  flyerUrl: string;
  promoter?: { name?: string; companyName?: string };
  ticketTiers: PublicTier[];
  salesClosed?: boolean;
  eventStartAt?: string | null;
}

type Filter = "all" | "week" | "weekend" | "tropica";

const FILTERS: Array<[Filter, string]> = [
  ["all", "All upcoming"],
  ["week", "Next 7 days"],
  ["weekend", "This weekend"],
  ["tropica", "At Tropica"]
];

/** Event calendar day as "YYYY-MM-DD" (dates are stored at UTC midnight). */
const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
const addDays = (ymd: string, n: number) => {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export default function PublicEventsPage() {
  const [events, setEvents] = useState<PublicEvent[] | null>(null);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    api
      .get("/events/public")
      .then(({ data }) => setEvents(data.events || []))
      .catch(() => setError(true));
  }, []);

  const visible = useMemo(() => {
    if (!events) return [];
    const today = nyNow().date;
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay(); // 0 Sun … 6 Sat
    const fri = addDays(today, weekday === 0 ? -2 : (5 - weekday + 7) % 7);
    const sun = addDays(fri, 2);
    const in7 = addDays(today, 7);
    const q = query.trim().toLowerCase();

    return events
      .filter((e) => {
        // Hide events that already ended (keep ones happening tonight)
        if (e.eventStartAt && Date.now() - new Date(e.eventStartAt).getTime() > 8 * 3600_000) return false;
        const day = dayKey(e.date);
        if (filter === "week" && (day < today || day > in7)) return false;
        if (filter === "weekend" && (day < (today > fri ? today : fri) || day > sun)) return false;
        if (filter === "tropica" && e.venueType !== "tropica") return false;
        if (!q) return true;
        const who = `${e.promoter?.companyName || ""} ${e.promoter?.name || ""}`;
        return `${e.title} ${e.venueName} ${e.venueAddress} ${who}`.toLowerCase().includes(q);
      })
      .sort((a, b) => (a.eventStartAt || a.date).localeCompare(b.eventStartAt || b.date));
  }, [events, query, filter]);

  return (
    <div className="min-h-screen bg-[#070B09] text-white flex flex-col">
      <NavBar />

      {/* Hero */}
      <section className="relative pt-32 md:pt-40 pb-10 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(200,169,106,0.18),transparent_60%)] pointer-events-none" />
        <div className="relative max-w-6xl mx-auto text-center space-y-4">
          <span className="inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.3em] text-[#C8A96A]">
            <Sparkles className="w-3.5 h-3.5" /> What&apos;s on
          </span>
          <h1 className="text-4xl md:text-6xl font-headline italic">Upcoming Events</h1>
          <p className="text-sm text-white/60 max-w-xl mx-auto">
            Parties, live music and nights out at Tropica and around New York. Book tickets in a minute and get your QR pass instantly.
          </p>
        </div>
      </section>

      {/* Filters */}
      <section className="px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-3">
          <label className="flex items-center gap-2 flex-1 rounded-full bg-white/5 border border-white/10 focus-within:border-[#C8A96A] px-4">
            <Search className="w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events, venues, organizers…"
              className="flex-1 bg-transparent py-3 text-sm outline-none placeholder:text-white/30"
              aria-label="Search events"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0" role="tablist" aria-label="Filter events">
            {FILTERS.map(([id, label]) => (
              <button
                key={id}
                role="tab"
                aria-selected={filter === id}
                onClick={() => setFilter(id)}
                className={`shrink-0 px-4 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                  filter === id
                    ? "border-[#C8A96A] bg-[#C8A96A] text-[#0a120e]"
                    : "border-white/15 text-white/60 hover:text-white hover:border-white/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <main className="flex-1 px-4 py-10">
        <div className="max-w-6xl mx-auto">
          {error && <p className="text-center text-sm text-rose-300 py-16">Could not load events. Please refresh the page.</p>}

          {!events && !error && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden animate-pulse">
                  <div className="aspect-[4/5] bg-white/5" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 w-2/3 bg-white/10 rounded" />
                    <div className="h-3 w-1/2 bg-white/5 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {events && visible.length === 0 && (
            <div className="text-center py-20 space-y-3">
              <Ticket className="w-10 h-10 mx-auto text-white/25" />
              <p className="text-white/70">{events.length ? "No events match your search." : "No upcoming events right now. Check back soon!"}</p>
              {(query || filter !== "all") && (
                <button
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                  className="text-xs text-[#C8A96A] hover:underline cursor-pointer"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((e) => {
              const prices = e.ticketTiers.filter((t) => !t.isSoldOut).map((t) => t.price);
              const soldOut = e.ticketTiers.length > 0 && e.ticketTiers.every((t) => t.isSoldOut);
              const left = e.ticketTiers.reduce((s, t) => s + Math.max(0, t.available), 0);
              const from = prices.length ? Math.min(...prices) : null;
              const d = new Date(`${dayKey(e.date)}T12:00:00Z`);
              const badge = e.salesClosed
                ? { text: "Sales closed", cls: "bg-black/70 text-white/80" }
                : soldOut
                ? { text: "Sold out", cls: "bg-rose-600/90 text-white" }
                : left > 0 && left <= 20
                ? { text: `Only ${left} left`, cls: "bg-amber-400 text-[#0a120e]" }
                : null;

              return (
                <Link
                  key={e._id}
                  href={`/events/${e.slug}`}
                  className="group rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden hover:border-[#C8A96A]/60 hover:-translate-y-1 transition-all duration-300 shadow-xl"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-black">
                    <img
                      src={e.flyerUrl}
                      alt={e.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 rounded-xl bg-black/75 backdrop-blur px-3 py-2 text-center leading-none border border-white/10">
                      <div className="text-[10px] uppercase font-bold tracking-wider text-[#C8A96A]">
                        {d.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" })}
                      </div>
                      <div className="text-xl font-black">{d.getUTCDate()}</div>
                    </div>
                    {badge && (
                      <span className={`absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${badge.cls}`}>
                        {badge.text}
                      </span>
                    )}
                  </div>

                  <div className="p-5 space-y-2.5">
                    <h2 className="text-lg font-bold leading-snug line-clamp-2 group-hover:text-[#E0C68E] transition-colors">{e.title}</h2>
                    <div className="space-y-1 text-xs text-white/60">
                      <p className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" />
                        {d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" })}
                      </p>
                      <p className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {fmt12(e.startTime)} – {fmt12(e.endTime)}
                      </p>
                      <p className="flex items-center gap-1.5 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-[#C8A96A] shrink-0" />
                        <span className="truncate">{e.venueName}</span>
                      </p>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-white/10">
                      <span className="text-xs text-white/50">
                        {from !== null ? (
                          <>
                            From <strong className="text-base text-white">{from === 0 ? "Free" : `$${from.toFixed(2)}`}</strong>
                          </>
                        ) : (
                          "—"
                        )}
                      </span>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#C8A96A] group-hover:translate-x-0.5 transition-transform">
                        {e.salesClosed || soldOut ? "View" : "Get tickets"} →
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
