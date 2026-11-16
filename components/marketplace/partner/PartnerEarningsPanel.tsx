"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, Loader2, TrendingUp, Users, Wallet } from "lucide-react";
import api from "@/lib/axios";
import { Delta, MonthlyBarChart, StatTile } from "@/components/marketplace/reports/MonthlyBarChart";
import { money } from "./shared";

interface OwnerReport {
  totals: {
    bookings: number;
    guests: number;
    earned: number;
    received: number;
    pending: number;
    upcomingBookings: number;
    upcomingEarnings: number;
    averagePerBooking: number;
  };
  thisMonth: { month: string; earned: number; bookings: number };
  lastMonth: { earned: number; bookings: number };
  monthly: { month: string; bookings: number; earned: number; upcoming: boolean }[];
}

/** Venue owner dashboard: how much they earn through Tropica, by month. */
export function PartnerEarningsPanel() {
  const [report, setReport] = useState<OwnerReport | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/partner/report")
      .then(({ data }) => !cancelled && setReport(data))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) return <p className="text-sm text-rose-300">Couldn&apos;t load your earnings. Please refresh.</p>;
  if (!report)
    return (
      <p className="flex items-center gap-2 text-white/60 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading your earnings…
      </p>
    );

  const t = report.totals;
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Your earnings</h2>
        <Link href="/partner-portal/calendar" className="text-xs text-[#C8A96A] inline-flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" /> Open calendar
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          highlight
          icon={<TrendingUp className="w-3.5 h-3.5" />}
          label="This month"
          value={money(report.thisMonth.earned)}
          hint={<Delta now={report.thisMonth.earned} before={report.lastMonth.earned} />}
        />
        <StatTile
          icon={<Wallet className="w-3.5 h-3.5" />}
          label="Total earned"
          value={money(t.earned)}
          hint={`${t.bookings} booking${t.bookings === 1 ? "" : "s"} · avg ${money(t.averagePerBooking)}`}
        />
        <StatTile
          icon={<CalendarDays className="w-3.5 h-3.5" />}
          label="Upcoming"
          value={money(t.upcomingEarnings)}
          hint={`${t.upcomingBookings} event${t.upcomingBookings === 1 ? "" : "s"} booked ahead`}
        />
        <StatTile
          icon={<Users className="w-3.5 h-3.5" />}
          label="Paid to you"
          value={money(t.received)}
          hint={
            t.pending > 0 ? (
              <Link href="/partner-portal/payouts" className="text-[#C8A96A]">
                {money(t.pending)} still to be paid →
              </Link>
            ) : (
              `${t.guests} guests hosted`
            )
          }
        />
      </div>

      <MonthlyBarChart
        title="Earnings by month"
        subtitle="Your share of each paid booking, counted in the month of the event."
        valueLabel="Your earnings"
        data={report.monthly.map((m) => ({ month: m.month, value: m.earned, bookings: m.bookings, upcoming: m.upcoming }))}
      />
    </section>
  );
}

export default PartnerEarningsPanel;
