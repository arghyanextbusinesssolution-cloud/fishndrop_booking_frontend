"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarDays, CreditCard, Loader2, MapPin, TrendingUp, Wallet } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { Delta, MonthlyBarChart, StatTile } from "@/components/marketplace/reports/MonthlyBarChart";
import { SettlePayoutDialog } from "@/components/marketplace/admin/SettlePayoutDialog";
import { BookingsTable, METRICS, Metric, MetricSwitch, RevenueBooking, RevenueMonth, RevenueTotals, VenueAvatar, usd } from "./ExternalRevenuePage";

interface VenueDetail {
  venue: {
    _id: string;
    name: string;
    logoUrl?: string;
    coverUrl?: string;
    theme?: { primary?: string };
    status: string;
    address?: string;
    neighborhood?: string;
    chargesEnabled: boolean;
    partnerDiscountPct: number;
    customerDiscountPct: number;
    depositPct: number;
    ownerName?: string;
    ownerEmail?: string;
  };
  totals: RevenueTotals;
  thisMonth: { month: string; commission: number; payout: number; bookings: number };
  lastMonth: { commission: number; payout: number; bookings: number };
  monthly: RevenueMonth[];
  bookings: RevenueBooking[];
}

/** Admin: one partner venue's revenue — what Tropica earned from it, month by month, booking by booking. */
export default function VenueRevenuePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<VenueDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metric, setMetric] = useState<Metric>("commission");
  const [settling, setSettling] = useState<RevenueBooking | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/admin/marketplace/revenue/${id}`)
      .then(({ data }) => !cancelled && setData(data))
      .catch((err) => !cancelled && setError(err?.response?.data?.message || "Couldn't load this venue."));
    return () => {
      cancelled = true;
    };
  }, [id, reloadKey]);

  const back = (
    <Link href="/admin/external-revenue" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-white/60 hover:text-white">
      <ArrowLeft className="w-4 h-4" /> External revenue
    </Link>
  );

  if (error)
    return (
      <div className="p-10 space-y-4">
        {back}
        <p className="text-rose-300 text-sm">{error}</p>
      </div>
    );
  if (!data)
    return (
      <p className="p-10 flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading venue revenue…
      </p>
    );

  const { venue: v, totals: t } = data;
  const margin = Math.max(0, v.partnerDiscountPct - v.customerDiscountPct);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-8 min-h-screen text-white">
      {back}

      {settling && (
        <SettlePayoutDialog
          booking={settling}
          venueName={v.name}
          stripeConnected={v.chargesEnabled}
          onClose={() => setSettling(null)}
          onDone={() => {
            setSettling(null);
            setReloadKey((k) => k + 1);
          }}
        />
      )}

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <VenueAvatar name={v.name} logoUrl={v.logoUrl} primary={v.theme?.primary} size={60} />
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-headline italic capitalize">{v.name}</h1>
            <p className="text-xs text-white/55 flex flex-wrap items-center gap-x-3 gap-y-1">
              {v.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" /> {v.address}
                </span>
              )}
              {v.ownerName && <span>Owner: {v.ownerName}</span>}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", v.chargesEnabled ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/60")}>
                {v.chargesEnabled ? "Stripe connected" : "Manual payouts"}
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-[#C8A96A]/15 text-[#E0C68E]">
                {v.partnerDiscountPct}% partner · {v.customerDiscountPct}% customer · {margin}% margin
              </span>
              <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider bg-white/10 text-white/60">{v.depositPct}% deposit</span>
            </div>
          </div>
        </div>
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
        <StatTile icon={<CreditCard className="w-3.5 h-3.5" />} label="Booking value" value={usd(t.gross)} hint={`${t.bookings} paid · ${usd(t.collected)} collected`} />
        <StatTile
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Venue payout"
          value={usd(t.payout)}
          hint={t.pendingManualPayout > 0 ? <span className="text-amber-300">{usd(t.pendingManualPayout)} owed manually</span> : `${usd(t.payoutSettled)} settled`}
        />
        <StatTile
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          label="Upcoming"
          value={String(t.upcomingBookings)}
          hint={`${usd(t.outstanding)} in balances due${t.refunds ? ` · ${usd(t.refunds)} refunded` : ""}`}
        />
      </div>

      <div className="space-y-3">
        <MetricSwitch value={metric} onChange={setMetric} />
        <MonthlyBarChart
          title={METRICS[metric].title}
          subtitle={`${v.name}, counted in the month of the event.`}
          valueLabel={METRICS[metric].label}
          data={data.monthly.map((m) => ({ month: m.month, value: m[metric], bookings: m.bookings, upcoming: m.upcoming }))}
        />
      </div>

      <section className="space-y-3">
        <h2 className="text-base font-bold">Paid bookings</h2>
        {data.bookings.length === 0 ? (
          <p className="text-sm text-white/50 rounded-2xl border border-white/10 bg-white/[0.03] p-6">No paid bookings at this venue yet.</p>
        ) : (
          <BookingsTable bookings={data.bookings} onSettle={setSettling} />
        )}
      </section>
    </div>
  );
}
