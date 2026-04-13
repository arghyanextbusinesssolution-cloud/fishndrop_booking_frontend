"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Booking, TableStats } from "@/types";
import api from "@/lib/axios";
import { useAuthStore } from "@/store/authStore";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { TrendingUp, TrendingDown, Zap, Calendar, Users, LayoutGrid } from "lucide-react";

const HERO_IMG = "https://images.unsplash.com/photo-1414235077428-338988692286?auto=format&fit=crop&q=80&w=1600";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    confirmed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-red-50 text-red-700 border-red-200",
  };
  return (
    <span className={cn("px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold", map[status] || "bg-surface-container text-secondary border-outline-variant/20")}>
      {status}
    </span>
  );
}

export default function AdminDashboardPage() {
  const { getStats } = useAdmin();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<TableStats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const [statsData, bookingsData, todayData] = await Promise.all([
          getStats(),
          api.get("/admin/bookings", { params: { limit: 6 } }),
          api.get("/admin/bookings", { params: { date: today, limit: 1 } }),
        ]);
        setStats(statsData);
        setRecent(bookingsData.data.bookings as Booking[]);
        setTodayCount(todayData.data.total || 0);
      } catch {
        setStats(null);
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [getStats]);

  if (loading || !stats) return <LoadingSpinner />;

  const occupancyPct = stats.total > 0 ? Math.round((stats.booked / stats.total) * 100) : 0;

  const statCards = [
    {
      label: "Total Tables",
      value: stats.total,
      sub: `${stats.twoSeatersAvailable} two-seaters · ${stats.fourSeatersAvailable} four-seaters free`,
      icon: LayoutGrid,
      accent: false,
    },
    {
      label: "Available Tables",
      value: stats.available,
      sub: "Ready for guests",
      icon: Calendar,
      accent: false,
    },
    {
      label: "Table Occupancy",
      value: `${occupancyPct}%`,
      sub: "Live occupancy rate",
      icon: Users,
      accent: true,
    },
    {
      label: "Today's Bookings",
      value: todayCount,
      sub: "Reservations today",
      icon: Zap,
      accent: false,
      pulse: true,
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen">

      {/* Hero Banner */}
      <section className="relative h-[280px] w-full rounded-2xl overflow-hidden shadow-2xl">
        <img
          src={"https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1600"}
          // src={HERO_IMG}
          alt="Fishndrop Restaurant Interior"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-on-surface/80 via-on-surface/40 to-transparent" />
        <div className="absolute inset-0 flex flex-col justify-center px-10 md:px-14">
          <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary-container/80 mb-3 block font-bold">
            Command Centre
          </span>
          <h1 className="font-headline text-4xl md:text-5xl italic text-surface leading-tight mb-2">
            Fishndrop <span className="font-normal not-italic text-primary-container">Dashboard</span>
          </h1>
          <p className="font-body text-surface-dim max-w-md text-sm font-light">
            Welcome back, {user?.name || "Manager"}. Here is the pulse of the dining room.
          </p>
        </div>
      </section>

      {/* Stats Grid */}
      <section className="space-y-5">
        <div className="flex justify-between items-baseline">
          <h2 className="font-headline text-3xl italic text-on-surface">Daily Insights</h2>
          <p className="font-label text-[9px] uppercase tracking-[0.2em] text-outline font-bold">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.label}
                className={cn(
                  "rounded-xl p-6 flex flex-col justify-between h-36 border transition-all duration-300 hover:shadow-md",
                  card.accent
                    ? "bg-on-surface text-surface border-on-surface"
                    : "bg-surface-container-lowest border-outline-variant/20 shadow-sm"
                )}
              >
                <div className="flex items-start justify-between">
                  <p className={cn("text-[9px] uppercase tracking-widest font-bold", card.accent ? "text-primary-container/70" : "text-outline")}>
                    {card.label}
                  </p>
                  <Icon className={cn("w-4 h-4", card.accent ? "text-primary-container/50" : "text-outline/40")} strokeWidth={1.5} />
                </div>
                <div>
                  <p className={cn("font-headline text-4xl italic", card.accent ? "text-surface" : "text-on-surface")}>
                    {card.value}
                  </p>
                  <div className={cn("flex items-center gap-1 mt-1", card.accent ? "text-primary-container/60" : "text-outline")}>
                    {card.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />}
                    <span className="text-[9px] font-body italic">{card.sub}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Main workspace */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Reservations Table — 2/3 */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl italic text-on-surface">Recent Reservations</h2>
            <Link
              href="/admin/bookings"
              className="font-label text-[9px] uppercase tracking-widest text-primary hover:underline font-bold"
            >
              View All
            </Link>
          </div>

          <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
            {recent.length === 0 ? (
              <p className="p-10 text-center font-body text-secondary italic text-sm">No recent reservations.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-surface-container border-b border-outline-variant/10">
                    <tr>
                      {["Guest Name", "Date", "Time", "Party", "Tables", "Status"].map(h => (
                        <th key={h} className="px-5 py-4 text-[9px] uppercase tracking-widest text-outline font-bold whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {recent.map((b) => (
                      <tr key={b._id} className="hover:bg-surface-container/50 transition-colors">
                        <td className="px-5 py-4 font-headline text-lg italic text-on-surface whitespace-nowrap">{b.customerName}</td>
                        <td className="px-5 py-4 font-body text-sm text-secondary whitespace-nowrap">{formatDate(b.bookingDate)}</td>
                        <td className="px-5 py-4 font-body text-sm text-secondary">{b.bookingTime}</td>
                        <td className="px-5 py-4 font-body text-sm text-secondary">{b.partySize} pax</td>
                        <td className="px-5 py-4 font-body text-sm font-bold text-primary italic whitespace-nowrap">
                          {b.tables.map(t => `T-${t.tableNumber}`).join(", ") || "—"}
                        </td>
                        <td className="px-5 py-4">
                          <StatusBadge status={b.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column — Table Status + Quick Links */}
        <div className="space-y-5">
          <h2 className="font-headline text-2xl italic text-on-surface">Table Status</h2>

          {/* Table Status */}
          <div className="bg-surface-container-low p-6 rounded-xl border border-outline-variant/10 space-y-5">
            <div className="flex justify-between items-baseline">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Occupied</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-surface-container-high border border-outline-variant/30" />
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Open</span>
              </div>
            </div>

            {/* Visual grid of tables */}
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: stats.total }, (_, i) => {
                const isBooked = i < stats.booked;
                return (
                  <div
                    key={i}
                    className={cn(
                      "h-12 rounded-lg flex items-center justify-center transition-all",
                      isBooked
                        ? "bg-primary shadow-sm shadow-primary/20"
                        : "bg-surface-container border border-outline-variant/20"
                    )}
                  >
                    <span className={cn("font-label text-[9px] font-bold uppercase tracking-wider", isBooked ? "text-on-primary" : "text-outline")}>
                      T-{i + 1}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Bar */}
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Occupancy</span>
                <span className="font-headline text-sm italic text-primary">{occupancyPct}%</span>
              </div>
              <div className="h-1.5 bg-surface-container rounded-full overflow-hidden">
                <div className="h-full bg-gold-gradient rounded-full transition-all duration-700" style={{ width: `${occupancyPct}%` }} />
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-on-surface text-surface p-6 rounded-xl space-y-4">
            <p className="font-headline italic text-lg text-primary-container">Quick Actions</p>
            <div className="space-y-2">
              <Link href="/admin/bookings" className="block w-full py-3 border border-surface/20 rounded-lg text-[9px] uppercase tracking-widest hover:bg-surface hover:text-on-surface transition-colors text-center font-label font-bold">
                Manage Bookings
              </Link>
              <Link href="/admin/tables" className="block w-full py-3 border border-surface/20 rounded-lg text-[9px] uppercase tracking-widest hover:bg-surface hover:text-on-surface transition-colors text-center font-label font-bold">
                Configure Tables
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
