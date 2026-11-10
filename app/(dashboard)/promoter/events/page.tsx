"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { CalendarDays, ChevronRight, Loader2, Plus, Search, Ticket, Users, DollarSign, CheckCircle2 } from "lucide-react";
import api from "@/lib/axios";

interface Tier {
  name: string;
  price: number;
  quantity: number;
  sold: number;
  reserved?: number;
}

interface PromoterEvent {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  status: "draft" | "pending_approval" | "published" | "cancelled" | "completed";
  flyerUrl: string;
  totalTicketsSold: number;
  grossRevenue: number;
  netEarnings: number;
  checkInCount: number;
  ticketTiers: Tier[];
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  published: { label: "Live", cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" },
  pending_approval: { label: "In review", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" },
  draft: { label: "Draft", cls: "bg-white/10 text-white/60 border-white/20" },
  cancelled: { label: "Rejected", cls: "bg-red-500/15 text-red-300 border-red-500/30" },
  completed: { label: "Completed", cls: "bg-sky-500/15 text-sky-300 border-sky-500/30" }
};

const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PromoterEventsPage() {
  const [events, setEvents] = useState<PromoterEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string>("all");

  useEffect(() => {
    api
      .get("/events/my-events")
      .then(({ data }) => setEvents(data.events || []))
      .catch((err: unknown) =>
        setError((isAxiosError(err) && err.response?.data?.message) || "Failed to load your events")
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter(
      (e) => (status === "all" || e.status === status) && (!q || `${e.title} ${e.venueName}`.toLowerCase().includes(q))
    );
  }, [events, query, status]);

  const totals = useMemo(
    () => ({
      sold: events.reduce((s, e) => s + (e.totalTicketsSold || 0), 0),
      gross: events.reduce((s, e) => s + (e.grossRevenue || 0), 0),
      net: events.reduce((s, e) => s + (e.netEarnings || 0), 0),
      live: events.filter((e) => e.status === "published").length
    }),
    [events]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 text-white">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Promoter</p>
          <h1 className="text-3xl font-headline italic">My Events</h1>
          <p className="text-xs text-white/60 mt-1">Tickets sold, revenue and check-ins for every event you run.</p>
        </div>
        <Link
          href="/promoter/events/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#C8A96A] hover:bg-[#d8b97a] text-black text-xs font-bold uppercase tracking-wider"
        >
          <Plus className="w-4 h-4" /> Create event
        </Link>
      </div>

      {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Live events", value: totals.live, icon: CalendarDays },
          { label: "Tickets sold", value: totals.sold, icon: Ticket },
          { label: "Ticket revenue", value: money(totals.gross), icon: DollarSign },
          { label: "Net earnings", value: money(totals.net), icon: CheckCircle2 }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/50">
              <s.icon className="w-3.5 h-3.5 text-[#C8A96A]" /> {s.label}
            </div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{s.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search events…"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8A96A]"
        >
          <option value="all" className="bg-[#0c1612]">All statuses</option>
          <option value="published" className="bg-[#0c1612]">Live</option>
          <option value="pending_approval" className="bg-[#0c1612]">In review</option>
          <option value="draft" className="bg-[#0c1612]">Draft</option>
          <option value="cancelled" className="bg-[#0c1612]">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-sm text-white/50">
          {events.length === 0 ? (
            <>
              You haven&apos;t created any events yet.{" "}
              <Link href="/promoter/events/new" className="text-[#C8A96A] underline">
                Create your first event
              </Link>
            </>
          ) : (
            "No events match your filters."
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((e) => {
            const capacity = e.ticketTiers.reduce((s, t) => s + t.quantity, 0);
            const pct = capacity ? Math.min(100, Math.round((e.totalTicketsSold / capacity) * 100)) : 0;
            const st = STATUS_LABEL[e.status] || STATUS_LABEL.draft;
            return (
              <Link
                key={e._id}
                href={`/promoter/events/${e._id}`}
                className="group flex flex-col sm:flex-row gap-4 rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#C8A96A]/50 hover:bg-white/[0.05] p-4 transition-colors"
              >
                <div className="w-full sm:w-24 h-32 sm:h-24 rounded-xl overflow-hidden bg-black/40 shrink-0">
                  {e.flyerUrl && <img src={e.flyerUrl} alt="" className="w-full h-full object-cover" />}
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-bold truncate">{e.title}</h2>
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${st.cls}`}>{st.label}</span>
                  </div>
                  <p className="text-xs text-white/50">
                    {new Date(e.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })} ·{" "}
                    {e.startTime} · {e.venueName}
                  </p>
                  <div>
                    <div className="flex justify-between text-[11px] text-white/60 mb-1">
                      <span>
                        {e.totalTicketsSold} / {capacity} sold
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#C8A96A]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:flex sm:flex-col sm:items-end gap-2 sm:gap-1 text-xs sm:w-40 shrink-0">
                  <div className="sm:text-right">
                    <div className="text-[10px] uppercase text-white/40">Revenue</div>
                    <div className="font-bold tabular-nums">{money(e.grossRevenue)}</div>
                  </div>
                  <div className="sm:text-right">
                    <div className="text-[10px] uppercase text-white/40">Checked in</div>
                    <div className="font-bold tabular-nums flex sm:justify-end items-center gap-1">
                      <Users className="w-3 h-3 text-white/40" /> {e.checkInCount}
                    </div>
                  </div>
                  <div className="flex items-end sm:justify-end text-[#C8A96A] font-bold text-[11px] uppercase tracking-wider">
                    Details <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
