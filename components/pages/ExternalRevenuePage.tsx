"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { ArrowUpRight, Building2, CalendarDays, ChevronRight, CreditCard, Landmark, Loader2, TrendingUp, Wallet } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Delta, MonthlyBarChart, StatTile } from "@/components/marketplace/reports/MonthlyBarChart";

export interface RevenueTotals {
  bookings: number;
  guests: number;
  gross: number;
  collected: number;
  outstanding: number;
  commission: number;
  payout: number;
  payoutSettled: number;
  payoutPending: number;
  pendingManualPayout: number;
  refunds: number;
  upcomingBookings: number;
  upcomingPayout: number;
}

export interface RevenueMonth {
  month: string;
  bookings: number;
  gross: number;
  collected: number;
  commission: number;
  payout: number;
  upcoming: boolean;
}

export interface RevenueBooking {
  _id: string;
  bookingNumber: string;
  venue: string;
  venueName: string;
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  occasion?: string;
  status: string;
  customerName: string;
  customerPrice: number;
  amountPaid: number;
  remainingAmount: number;
  commission: number;
  venuePayout: number;
  settlement?: { mode: "connect" | "manual"; status: "pending" | "transferred" | "paid_manually"; reference?: string; paidAt?: string };
  owedToVenue?: number;
}

interface VenueRow {
  _id: string;
  name: string;
  logoUrl?: string;
  primary?: string;
  neighborhood?: string;
  status: "draft" | "published" | "paused";
  stripeConnected: boolean;
  partnerDiscountPct: number;
  customerDiscountPct: number;
  bookings: number;
  gross: number;
  commission: number;
  payout: number;
  pendingManualPayout: number;
  lastBooking: string | null;
}

interface Overview {
  totals: RevenueTotals;
  thisMonth: { month: string; commission: number; bookings: number };
  lastMonth: { commission: number; bookings: number };
  monthly: RevenueMonth[];
  venues: VenueRow[];
  recent: RevenueBooking[];
}

export const usd = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const ymdLabel = (ymd: string, pattern = "MMM d, yyyy") => format(new Date(`${ymd}T12:00:00`), pattern);

export type Metric = "commission" | "gross" | "payout";
export const METRICS: Record<Metric, { label: string; title: string }> = {
  commission: { label: "Tropica commission", title: "Tropica commission by month" },
  gross: { label: "Booking value", title: "Booking value by month" },
  payout: { label: "Venue payouts", title: "Venue payouts by month" }
};

export const MetricSwitch = ({ value, onChange }: { value: Metric; onChange: (m: Metric) => void }) => (
  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
    {(Object.keys(METRICS) as Metric[]).map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => onChange(m)}
        className={cn(
          "rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors",
          value === m ? "bg-[#C8A96A] text-[#0d1612]" : "text-white/60 hover:text-white"
        )}
      >
        {METRICS[m].label}
      </button>
    ))}
  </div>
);

export const SettlementBadge = ({ b }: { b: Pick<RevenueBooking, "settlement"> }) => {
  const s = b.settlement;
  const done = s?.status === "transferred" || s?.status === "paid_manually";
  const label = s?.status === "transferred" ? "Sent via Stripe" : s?.status === "paid_manually" ? "Paid manually" : s?.mode === "connect" ? "Stripe · pending" : "Owed manually";
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap", done ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>
      {label}
    </span>
  );
};

export const VenueAvatar = ({ name, logoUrl, primary, size = 40 }: { name: string; logoUrl?: string; primary?: string; size?: number }) =>
  logoUrl ? (
    <img src={logoUrl} alt="" className="rounded-full object-cover border border-white/20 bg-white shrink-0" style={{ width: size, height: size }} />
  ) : (
    <span
      className="rounded-full flex items-center justify-center font-headline text-white shrink-0 capitalize"
      style={{ width: size, height: size, background: primary || "#2a3b33", fontSize: size * 0.42 }}
    >
      {name.charAt(0)}
    </span>
  );

/** Admin: Tropica's external revenue from partner venues — totals, by month, and per venue. */
export default function ExternalRevenuePage() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("commission");

  useEffect(() => {
    let cancelled = false;
    api
      .get("/admin/marketplace/revenue")
      .then(({ data }) => !cancelled && setData(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "Couldn't load revenue."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="p-10 text-rose-300 text-sm">{error}</p>;
  if (!data)
    return (
      <p className="p-10 flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading external revenue…
      </p>
    );

  const t = data.totals;
  const maxCommission = Math.max(1, ...data.venues.map((v) => v.commission));

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-h-screen text-white">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">Partner venues</span>
          <h1 className="text-3xl md:text-4xl font-headline italic">External Revenue</h1>
          <p className="text-xs text-white/60 max-w-2xl">
            What Tropica earns from bookings at partner venues. Commission is the difference between what the customer pays and the venue&apos;s payout.
          </p>
        </div>
        <Link href="/admin/venue-owners" className="inline-flex items-center gap-1.5 text-xs text-[#C8A96A]">
          Manage venues <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          highlight
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="Tropica commission"
          value={usd(t.commission)}
          hint={
            <span>
              {usd(data.thisMonth.commission)} this month · <Delta now={data.thisMonth.commission} before={data.lastMonth.commission} />
            </span>
          }
        />
        <StatTile
          icon={<CreditCard className="w-3.5 h-3.5" />}
          label="Booking value"
          value={usd(t.gross)}
          hint={`${t.bookings} paid booking${t.bookings === 1 ? "" : "s"} · ${usd(t.collected)} collected`}
        />
        <StatTile
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Venue payouts"
          value={usd(t.payout)}
          hint={t.pendingManualPayout > 0 ? <span className="text-amber-300">{usd(t.pendingManualPayout)} Tropica still owes venues</span> : "All payouts settled"}
        />
        <StatTile
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          label="Balances due"
          value={usd(t.outstanding)}
          hint={`${t.upcomingBookings} upcoming event${t.upcomingBookings === 1 ? "" : "s"}${t.refunds ? ` · ${usd(t.refunds)} refunded` : ""}`}
        />
      </div>

      <div className="space-y-3">
        <MetricSwitch value={metric} onChange={setMetric} />
        <MonthlyBarChart
          title={METRICS[metric].title}
          subtitle="All partner venues, counted in the month of the event."
          valueLabel={METRICS[metric].label}
          data={data.monthly.map((m) => ({ month: m.month, value: m[metric], bookings: m.bookings, upcoming: m.upcoming }))}
        />
      </div>

      {/* Per-venue */}
      <section className="space-y-3">
        <h2 className="text-base font-bold flex items-center gap-2">
          <Building2 className="w-4 h-4 text-[#C8A96A]" /> By venue
          <span className="text-xs font-normal text-white/45">Click a venue for its full report</span>
        </h2>
        {data.venues.length === 0 ? (
          <p className="text-sm text-white/50 rounded-2xl border border-white/10 bg-white/[0.03] p-6">No partner venues yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm min-w-[860px]">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-left px-4 py-3">Venue</th>
                  <th className="text-right px-4 py-3">Bookings</th>
                  <th className="text-right px-4 py-3">Booking value</th>
                  <th className="text-left px-4 py-3 w-[22%]">Tropica commission</th>
                  <th className="text-right px-4 py-3">Venue payout</th>
                  <th className="text-right px-4 py-3">Owed manually</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody>
                {data.venues.map((v) => (
                  <tr
                    key={v._id}
                    onClick={() => router.push(`/admin/external-revenue/${v._id}`)}
                    className="border-t border-white/5 hover:bg-white/[0.04] cursor-pointer group"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <VenueAvatar name={v.name} logoUrl={v.logoUrl} primary={v.primary} size={36} />
                        <div className="min-w-0">
                          <Link href={`/admin/external-revenue/${v._id}`} className="font-semibold capitalize hover:text-[#E0C68E]" onClick={(e) => e.stopPropagation()}>
                            {v.name}
                          </Link>
                          <p className="text-[11px] text-white/45 flex items-center gap-2">
                            {v.neighborhood && <span>{v.neighborhood}</span>}
                            <span className={v.stripeConnected ? "text-emerald-300/80" : "text-white/40"}>
                              {v.stripeConnected ? "Stripe connected" : "Manual payouts"}
                            </span>
                            {v.status !== "published" && <span className="text-amber-300/80 capitalize">{v.status}</span>}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-white/70">{v.bookings}</td>
                    <td className="px-4 py-3 text-right text-white/80">{usd(v.gross)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 rounded-full bg-white/[0.06] overflow-hidden">
                          <div className="h-full rounded-full bg-[#C8A96A]" style={{ width: `${(v.commission / maxCommission) * 100}%` }} />
                        </div>
                        <span className="font-semibold text-[#E0C68E] w-24 text-right">{usd(v.commission)}</span>
                      </div>
                      <p className="text-[10px] text-white/40 mt-1">
                        {v.partnerDiscountPct}% partner − {v.customerDiscountPct}% customer discount = {Math.max(0, v.partnerDiscountPct - v.customerDiscountPct)}% margin
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right text-white/80">{usd(v.payout)}</td>
                    <td className={cn("px-4 py-3 text-right", v.pendingManualPayout > 0 ? "text-amber-300" : "text-white/40")}>{usd(v.pendingManualPayout)}</td>
                    <td className="px-2 py-3 text-white/30 group-hover:text-[#C8A96A]">
                      <ChevronRight className="w-4 h-4" />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t border-white/10 bg-white/[0.03] text-sm">
                <tr>
                  <td className="px-4 py-3 font-bold">All venues</td>
                  <td className="px-4 py-3 text-right">{t.bookings}</td>
                  <td className="px-4 py-3 text-right">{usd(t.gross)}</td>
                  <td className="px-4 py-3 text-right font-bold text-[#E0C68E]">{usd(t.commission)}</td>
                  <td className="px-4 py-3 text-right">{usd(t.payout)}</td>
                  <td className="px-4 py-3 text-right text-amber-300">{usd(t.pendingManualPayout)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </section>

      {/* Latest bookings */}
      {data.recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#C8A96A]" /> Latest paid bookings
          </h2>
          <BookingsTable bookings={data.recent} showVenue />
        </section>
      )}
    </div>
  );
}

export const BookingsTable = ({
  bookings,
  showVenue,
  onSettle
}: {
  bookings: RevenueBooking[];
  showVenue?: boolean;
  /** When given, bookings Tropica still owes the venue for get a "Pay venue" action. */
  onSettle?: (b: RevenueBooking) => void;
}) => (
  <div className="overflow-x-auto rounded-2xl border border-white/10">
    <table className="w-full text-sm min-w-[820px]">
      <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
        <tr>
          <th className="text-left px-4 py-3">Event</th>
          {showVenue && <th className="text-left px-4 py-3">Venue</th>}
          <th className="text-left px-4 py-3">Customer</th>
          <th className="text-right px-4 py-3">Price</th>
          <th className="text-right px-4 py-3">Paid</th>
          <th className="text-right px-4 py-3">Commission</th>
          <th className="text-right px-4 py-3">Venue payout</th>
          <th className="text-left px-4 py-3">Payout status</th>
        </tr>
      </thead>
      <tbody>
        {bookings.map((b) => (
          <tr key={b._id} className="border-t border-white/5">
            <td className="px-4 py-3">
              <p className="text-white">{ymdLabel(b.date)}</p>
              <p className="text-[11px] text-white/45">
                {b.guests} guests · #{b.bookingNumber}
              </p>
            </td>
            {showVenue && (
              <td className="px-4 py-3">
                <Link href={`/admin/external-revenue/${b.venue}`} className="capitalize text-white/80 hover:text-[#E0C68E]">
                  {b.venueName}
                </Link>
              </td>
            )}
            <td className="px-4 py-3 text-white/70">{b.customerName}</td>
            <td className="px-4 py-3 text-right text-white/80">{usd(b.customerPrice)}</td>
            <td className="px-4 py-3 text-right text-white/70">
              {usd(b.amountPaid)}
              {b.remainingAmount > 0 && <p className="text-[10px] text-amber-300/80">{usd(b.remainingAmount)} due</p>}
            </td>
            <td className="px-4 py-3 text-right font-semibold text-[#E0C68E]">{usd(b.commission)}</td>
            <td className="px-4 py-3 text-right text-white/80">{usd(b.venuePayout)}</td>
            <td className="px-4 py-3">
              <div className="flex flex-col items-start gap-1.5">
                <SettlementBadge b={b} />
                {b.settlement?.reference && <span className="text-[10px] text-white/40">Ref: {b.settlement.reference}</span>}
                {onSettle && (b.owedToVenue || 0) > 0 && (
                  <button
                    type="button"
                    onClick={() => onSettle(b)}
                    className="rounded-full bg-[#C8A96A] text-[#0d1612] px-3 py-1 text-[10px] font-bold uppercase tracking-wider hover:bg-[#E0C68E]"
                  >
                    Pay venue {usd(b.owedToVenue)}
                  </button>
                )}
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
