"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  DollarSign,
  ExternalLink,
  Loader2,
  MapPin,
  Search,
  ShoppingBag,
  Ticket,
  Users
} from "lucide-react";
import api from "@/lib/axios";

/* ───────────── Types ───────────── */

interface TierLite {
  name: string;
  price: number;
  quantity: number;
  sold: number;
  reserved: number;
}

interface EventListItem {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  venueName: string;
  status: string;
  flyerUrl?: string;
  ticketTiers: TierLite[];
  promoter?: { name?: string; companyName?: string } | string;
}

interface TierSummary {
  name: string;
  price: number;
  capacity: number;
  sold: number;
  reserved: number;
  remaining: number;
}

interface Summary {
  totalOrders: number;
  ticketsSold: number;
  ticketsCapacity: number;
  ticketsReserved: number;
  checkedIn: number;
  grossRevenue: number;
  platformFees: number;
  totalCollected: number;
  tiers: TierSummary[];
}

interface Booking {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  ticketCount: number;
  totalAmount: number;
  subtotal: number;
  paidAt?: string;
  createdAt: string;
  checkedInCount: number;
  items: Array<{ tierName: string; quantity: number }>;
}

interface Detail {
  event: {
    _id: string;
    title: string;
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName: string;
    status: string;
    promoter?: { name?: string; companyName?: string; email?: string; phone?: string };
  };
  summary: Summary;
  bookings: Booking[];
}

/* ───────────── Chart tokens (validated vs dark surface #0c1a14) ───────────── */

const C = {
  surface: "#0c1a14",
  sold: "#B8872A",
  held: "#4A86CF",
  remaining: "#2a3b33",
  grid: "#22332b",
  axis: "#8c9e94"
};

const money = (n: number) =>
  `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

const STATUS_STYLE: Record<string, string> = {
  published: "bg-emerald-500/15 text-emerald-300",
  pending_approval: "bg-amber-500/15 text-amber-300",
  draft: "bg-white/10 text-white/60",
  completed: "bg-sky-500/15 text-sky-300",
  cancelled: "bg-rose-500/15 text-rose-300"
};
const statusLabel = (s: string) => s.replace(/_/g, " ");

const STATUS_FILTERS = ["all", "published", "pending_approval", "completed", "draft", "cancelled"] as const;

const tooltipStyle = {
  backgroundColor: "#0c1612",
  border: "1px solid rgba(200,169,106,0.3)",
  borderRadius: 10,
  fontSize: 12,
  color: "#fff"
};

/* ───────────── Small pieces ───────────── */

function StatTile({
  icon: Icon,
  label,
  value,
  sub
}: {
  icon: typeof Ticket;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.15em] text-white/50 font-bold">
        <Icon className="w-3.5 h-3.5 text-[#C8A96A]" /> {label}
      </div>
      <p className="mt-2 text-2xl font-bold text-white tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-white/45 mt-0.5">{sub}</p>}
    </div>
  );
}

function Meter({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-[11px] text-white/60 mb-1.5">
        <span>{label}</span>
        <span className="font-mono text-white tabular-nums">
          {value}/{max} · {pct}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-[#2a3b33] overflow-hidden" role="meter" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max} aria-label={label}>
        <div className="h-full rounded-full bg-[#B8872A]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function LegendSwatch({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-white/70">
      <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} /> {label}
    </span>
  );
}

/* ───────────── Page ───────────── */

export default function EventAnalyticsPage({ mode }: { mode: "staff" | "promoter" }) {
  const [events, setEvents] = useState<EventListItem[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  /* Event list */
  useEffect(() => {
    const url = mode === "staff" ? "/events/admin/all" : "/events/my-events";
    api
      .get(url)
      .then(({ data }) => setEvents(data.events || []))
      .catch(() => setListError("Could not load events."));
  }, [mode]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (events || []).filter((e) => {
      if (status !== "all" && e.status !== status) return false;
      if (!q) return true;
      const promoter = typeof e.promoter === "object" ? `${e.promoter?.name || ""} ${e.promoter?.companyName || ""}` : "";
      return `${e.title} ${e.venueName} ${promoter}`.toLowerCase().includes(q);
    });
  }, [events, query, status]);

  /* Auto-select first event on desktop so the panel isn't empty */
  useEffect(() => {
    if (!selectedId && filtered.length && typeof window !== "undefined" && window.innerWidth >= 1024) {
      setSelectedId(filtered[0]._id);
    }
  }, [filtered, selectedId]);

  /* Event details */
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    setDetailLoading(true);
    setDetailError(null);
    api
      .get(`/events/${selectedId}/bookings`, { params: { status: "paid" } })
      .then(({ data }) => !cancelled && setDetail(data))
      .catch((err: unknown) => {
        if (cancelled) return;
        setDetail(null);
        setDetailError((isAxiosError(err) && err.response?.data?.message) || "Could not load this event.");
      })
      .finally(() => !cancelled && setDetailLoading(false));
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  const select = (id: string) => {
    setSelectedId(id);
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    }
  };

  /* Derived chart data */
  const tierData = useMemo(
    () =>
      (detail?.summary.tiers || []).map((t) => ({
        name: t.name,
        Sold: t.sold,
        Held: t.reserved,
        Remaining: t.remaining,
        price: t.price,
        capacity: t.capacity,
        revenue: t.sold * t.price
      })),
    [detail]
  );

  const salesTrend = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const b of detail?.bookings || []) {
      const d = new Date(b.paidAt || b.createdAt);
      const key = d.toISOString().slice(0, 10);
      byDay.set(key, (byDay.get(key) || 0) + b.ticketCount);
    }
    let running = 0;
    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, n]) => {
        running += n;
        return {
          day: new Date(`${day}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          "Tickets that day": n,
          "Total sold": running
        };
      });
  }, [detail]);

  const s = detail?.summary;
  const fillPct = s && s.ticketsCapacity > 0 ? Math.round((s.ticketsSold / s.ticketsCapacity) * 100) : 0;
  const net = s ? s.grossRevenue - (mode === "promoter" ? s.platformFees : 0) : 0;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-[1400px] mx-auto text-white space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
          {mode === "staff" ? "Operations" : "Promoter Portal"}
        </p>
        <h1 className="text-3xl font-headline italic">Events</h1>
        <p className="text-xs text-white/50 mt-1">
          Select an event to see how many seats are filled, ticket sales by tier, check-ins and buyers.
        </p>
      </div>

      {/* Filters — one row above everything */}
      <div className="flex flex-col sm:flex-row gap-3">
        <label className="flex items-center gap-2 flex-1 rounded-xl bg-black/30 border border-white/10 focus-within:border-[#C8A96A] px-3">
          <Search className="w-4 h-4 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={mode === "staff" ? "Search event, venue or promoter…" : "Search your events…"}
            className="flex-1 bg-transparent py-2.5 text-sm outline-none placeholder:text-white/30"
          />
        </label>
        <div className="flex gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setStatus(f)}
              className={`shrink-0 px-3 py-2 rounded-lg text-[11px] uppercase tracking-wider font-bold border transition-colors cursor-pointer ${
                status === f
                  ? "border-[#C8A96A] bg-[#C8A96A]/15 text-[#E0C68E]"
                  : "border-white/10 text-white/50 hover:text-white hover:border-white/30"
              }`}
            >
              {statusLabel(f)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
        {/* ── Event list ── */}
        <aside className="space-y-2 lg:max-h-[calc(100vh-220px)] lg:overflow-y-auto lg:pr-1">
          {listError && <p className="text-sm text-rose-300">{listError}</p>}
          {!events && !listError && (
            <div className="py-10 flex justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-[#C8A96A]" />
            </div>
          )}
          {events && filtered.length === 0 && (
            <p className="text-sm text-white/50 py-6 text-center">No events match.</p>
          )}
          {filtered.map((e) => {
            const cap = e.ticketTiers.reduce((a, t) => a + t.quantity, 0);
            const sold = e.ticketTiers.reduce((a, t) => a + t.sold, 0);
            const pct = cap ? Math.round((sold / cap) * 100) : 0;
            const active = e._id === selectedId;
            return (
              <button
                key={e._id}
                onClick={() => select(e._id)}
                className={`w-full text-left rounded-xl border p-3.5 transition-all cursor-pointer ${
                  active
                    ? "border-[#C8A96A] bg-[#C8A96A]/10"
                    : "border-white/10 bg-white/[0.03] hover:border-white/25"
                }`}
              >
                <div className="flex items-start gap-3">
                  {e.flyerUrl ? (
                    <img src={e.flyerUrl} alt="" className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                      <Ticket className="w-5 h-5 text-white/30" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{e.title}</p>
                    <p className="text-[11px] text-white/50 truncate">
                      {new Date(e.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} ·{" "}
                      {e.venueName}
                    </p>
                    {mode === "staff" && typeof e.promoter === "object" && (
                      <p className="text-[10px] text-white/35 truncate">by {e.promoter?.companyName || e.promoter?.name}</p>
                    )}
                  </div>
                  <span className={`text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLE[e.status] || "bg-white/10 text-white/60"}`}>
                    {statusLabel(e.status)}
                  </span>
                </div>
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-white/50 mb-1">
                    <span>Seats filled</span>
                    <span className="font-mono tabular-nums text-white/80">
                      {sold}/{cap} · {pct}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-[#2a3b33] overflow-hidden">
                    <div className="h-full rounded-full bg-[#B8872A]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </button>
            );
          })}
        </aside>

        {/* ── Detail ── */}
        <section ref={detailRef} className="min-w-0 space-y-6 scroll-mt-20">
          {!selectedId && (
            <div className="rounded-2xl border border-dashed border-white/15 p-12 text-center text-sm text-white/50">
              Select an event to see its details.
            </div>
          )}

          {selectedId && detailLoading && !detail && (
            <div className="py-20 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
            </div>
          )}

          {detailError && <p className="text-sm text-rose-300">{detailError}</p>}

          {detail && s && (
            <div className={`space-y-6 transition-opacity ${detailLoading ? "opacity-50" : ""}`}>
              {/* Header */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="min-w-0 space-y-2">
                  <span className={`inline-block text-[9px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[detail.event.status] || "bg-white/10"}`}>
                    {statusLabel(detail.event.status)}
                  </span>
                  <h2 className="text-2xl font-headline italic truncate">{detail.event.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" /> {fmtDate(detail.event.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {detail.event.startTime} – {detail.event.endTime}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {detail.event.venueName}
                    </span>
                  </div>
                  {mode === "staff" && detail.event.promoter && (
                    <p className="text-[11px] text-white/45">
                      Promoter: {detail.event.promoter.companyName || detail.event.promoter.name}
                      {detail.event.promoter.phone ? ` · ${detail.event.promoter.phone}` : ""}
                    </p>
                  )}
                </div>
                {detail.event.status === "published" && (
                  <Link
                    href={`/events/${detail.event.slug}`}
                    target="_blank"
                    className="shrink-0 inline-flex items-center gap-1.5 text-xs text-[#C8A96A] hover:text-[#E0C68E] border border-[#C8A96A]/30 px-3 py-2 rounded-lg"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Public page
                  </Link>
                )}
              </div>

              {/* KPI tiles */}
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                <StatTile icon={Ticket} label="Seats filled" value={`${s.ticketsSold}/${s.ticketsCapacity}`} sub={`${fillPct}% of capacity`} />
                <StatTile icon={ShoppingBag} label="Paid orders" value={String(s.totalOrders)} sub={s.ticketsReserved ? `${s.ticketsReserved} seats held in checkout` : "No seats on hold"} />
                <StatTile
                  icon={Users}
                  label="Checked in"
                  value={String(s.checkedIn)}
                  sub={s.ticketsSold ? `${Math.round((s.checkedIn / s.ticketsSold) * 100)}% of sold tickets` : "—"}
                />
                <StatTile
                  icon={DollarSign}
                  label={mode === "promoter" ? "Net earnings" : "Ticket revenue"}
                  value={money(mode === "promoter" ? net : s.grossRevenue)}
                  sub={mode === "promoter" ? `Gross ${money(s.grossRevenue)} · fees ${money(s.platformFees)}` : `Platform fees ${money(s.platformFees)}`}
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                <Meter label="Capacity filled" value={s.ticketsSold} max={s.ticketsCapacity} />
                <Meter label="Door check-ins (of sold)" value={s.checkedIn} max={s.ticketsSold} />
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
                    <h3 className="text-sm font-bold">Seats by ticket tier</h3>
                    <div className="flex gap-3">
                      <LegendSwatch color={C.sold} label="Sold" />
                      <LegendSwatch color={C.held} label="Held" />
                      <LegendSwatch color={C.remaining} label="Remaining" />
                    </div>
                  </div>
                  {tierData.length === 0 ? (
                    <p className="text-xs text-white/40 py-10 text-center">No ticket tiers.</p>
                  ) : (
                    <div style={{ height: Math.max(160, tierData.length * 56 + 40) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tierData} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 4 }} barCategoryGap={14}>
                          <CartesianGrid stroke={C.grid} horizontal={false} />
                          <XAxis type="number" allowDecimals={false} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis type="category" dataKey="name" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} width={90} />
                          <Tooltip
                            cursor={{ fill: "rgba(255,255,255,0.04)" }}
                            contentStyle={tooltipStyle}
                            labelStyle={{ color: "#E0C68E", fontWeight: 700 }}
                            itemStyle={{ color: "#fff" }}
                          />
                          <Bar dataKey="Sold" stackId="s" fill={C.sold} stroke={C.surface} strokeWidth={2} />
                          <Bar dataKey="Held" stackId="s" fill={C.held} stroke={C.surface} strokeWidth={2} />
                          <Bar dataKey="Remaining" stackId="s" fill={C.remaining} stroke={C.surface} strokeWidth={2} radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                  <h3 className="text-sm font-bold mb-4">Total tickets sold over time</h3>
                  {salesTrend.length === 0 ? (
                    <p className="text-xs text-white/40 py-10 text-center">No sales yet.</p>
                  ) : (
                    <div className="h-[220px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={salesTrend} margin={{ left: -12, right: 12, top: 8, bottom: 0 }}>
                          <defs>
                            <linearGradient id="soldFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={C.sold} stopOpacity={0.35} />
                              <stop offset="100%" stopColor={C.sold} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid stroke={C.grid} vertical={false} />
                          <XAxis dataKey="day" stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                          <YAxis allowDecimals={false} stroke={C.axis} fontSize={11} tickLine={false} axisLine={false} />
                          <Tooltip
                            contentStyle={tooltipStyle}
                            labelStyle={{ color: "#E0C68E", fontWeight: 700 }}
                            itemStyle={{ color: "#fff" }}
                            cursor={{ stroke: C.axis, strokeDasharray: "3 3" }}
                          />
                          <Area
                            type="monotone"
                            dataKey="Total sold"
                            stroke={C.sold}
                            strokeWidth={2}
                            fill="url(#soldFill)"
                            dot={{ r: 4, fill: C.sold, stroke: C.surface, strokeWidth: 2 }}
                            activeDot={{ r: 5, stroke: C.surface, strokeWidth: 2 }}
                          />
                          <Area type="monotone" dataKey="Tickets that day" stroke="none" fill="none" dot={false} activeDot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Tier table (table view of the chart) */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-x-auto">
                <table className="w-full text-xs min-w-[560px]">
                  <thead>
                    <tr className="text-[10px] uppercase tracking-wider text-white/45 border-b border-white/10">
                      <th className="text-left font-bold px-4 py-3">Tier</th>
                      <th className="text-right font-bold px-4 py-3">Price</th>
                      <th className="text-right font-bold px-4 py-3">Capacity</th>
                      <th className="text-right font-bold px-4 py-3">Sold</th>
                      <th className="text-right font-bold px-4 py-3">Held</th>
                      <th className="text-right font-bold px-4 py-3">Remaining</th>
                      <th className="text-right font-bold px-4 py-3">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 tabular-nums">
                    {tierData.map((t) => (
                      <tr key={t.name}>
                        <td className="px-4 py-2.5 font-semibold">{t.name}</td>
                        <td className="px-4 py-2.5 text-right text-white/70">{money(t.price)}</td>
                        <td className="px-4 py-2.5 text-right text-white/70">{t.capacity}</td>
                        <td className="px-4 py-2.5 text-right">{t.Sold}</td>
                        <td className="px-4 py-2.5 text-right text-white/70">{t.Held}</td>
                        <td className="px-4 py-2.5 text-right text-white/70">{t.Remaining}</td>
                        <td className="px-4 py-2.5 text-right">{money(t.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Buyers */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
                <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
                  <h3 className="text-sm font-bold">Buyers ({detail.bookings.length})</h3>
                  <span className="text-[11px] text-white/45">Collected {money(s.totalCollected)}</span>
                </div>
                {detail.bookings.length === 0 ? (
                  <p className="text-xs text-white/40 py-8 text-center">No paid orders yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[640px]">
                      <thead>
                        <tr className="text-[10px] uppercase tracking-wider text-white/45 border-b border-white/10">
                          <th className="text-left font-bold px-4 py-3">Buyer</th>
                          <th className="text-left font-bold px-4 py-3">Tickets</th>
                          <th className="text-right font-bold px-4 py-3">Paid</th>
                          <th className="text-left font-bold px-4 py-3">Check-in</th>
                          <th className="text-left font-bold px-4 py-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {detail.bookings.map((b) => (
                          <tr key={b.orderId}>
                            <td className="px-4 py-2.5">
                              <p className="font-semibold">{b.customerName}</p>
                              <p className="text-white/45">{b.customerEmail}</p>
                              <p className="text-white/35 font-mono">{b.customerPhone}</p>
                            </td>
                            <td className="px-4 py-2.5 text-white/70">
                              {b.items.map((i) => `${i.quantity}× ${i.tierName}`).join(", ")}
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{money(b.totalAmount)}</td>
                            <td className="px-4 py-2.5">
                              {b.checkedInCount >= b.ticketCount ? (
                                <span className="inline-flex items-center gap-1 text-emerald-300">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> All in
                                </span>
                              ) : (
                                <span className="text-white/60 tabular-nums">
                                  {b.checkedInCount}/{b.ticketCount}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-white/50">
                              {new Date(b.paidAt || b.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
