"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin, PaymentSummary } from "@/hooks/useAdmin";
import { Booking } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { CreditCard, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function PaymentBadge({ status }: { status?: string }) {
  const isPaid = status === "paid";
  return (
    <span className={cn(
      "px-3 py-1 rounded-full border text-[9px] uppercase tracking-widest font-bold",
      isPaid
        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
        : "bg-amber-50 text-amber-700 border-amber-200"
    )}>
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );
}

export default function AdminPaymentsPage() {
  const { getPaymentSummary } = useAdmin();
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) return;
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const data = await getPaymentSummary();
        setSummary(data.summary);
        setBookings(data.recentBookings);
      } catch {
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [getPaymentSummary]);

  if (loading || !summary) return <LoadingSpinner />;

  const statCards = [
    {
      label: "Total Revenue",
      value: `$${summary.totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      sub: `From ${summary.paidCount} paid bookings`,
      accent: true,
    },
    {
      label: "Pending Revenue",
      value: `$${summary.pendingRevenue.toLocaleString()}`,
      icon: Clock,
      sub: `${summary.unpaidCount} awaiting payment`,
      accent: false,
    },
    {
      label: "Paid Bookings",
      value: summary.paidCount,
      icon: CheckCircle,
      sub: "Completed payments",
      accent: false,
    },
    {
      label: "Unpaid Bookings",
      value: summary.unpaidCount,
      icon: AlertCircle,
      sub: "Pending collection",
      accent: false,
    },
  ];

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen">

      {/* Page Header */}
      <div className="space-y-2">
        <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
          Administration
        </span>
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
          Payments Overview
        </h1>
        <p className="text-sm text-secondary font-body font-light italic">
          Track revenue, monitor payment statuses, and view transaction history.
        </p>
      </div>

      {/* Stats Grid */}
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
                <span className={cn("text-[9px] font-body italic", card.accent ? "text-primary-container/60" : "text-outline")}>
                  {card.sub}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Bar */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-headline text-2xl italic text-on-surface">Revenue Breakdown</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Collected</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-outline">Pending</span>
            </div>
          </div>
        </div>
        <div className="h-4 bg-surface-container rounded-full overflow-hidden flex">
          {summary.totalRevenue + summary.pendingRevenue > 0 && (
            <>
              <div
                className="h-full bg-gold-gradient rounded-l-full transition-all duration-700"
                style={{ width: `${(summary.totalRevenue / (summary.totalRevenue + summary.pendingRevenue)) * 100}%` }}
              />
              <div
                className="h-full bg-amber-300 transition-all duration-700"
                style={{ width: `${(summary.pendingRevenue / (summary.totalRevenue + summary.pendingRevenue)) * 100}%` }}
              />
            </>
          )}
        </div>
        <div className="flex justify-between text-sm">
          <span className="font-headline italic text-primary">${summary.totalRevenue.toLocaleString()} collected</span>
          <span className="font-headline italic text-amber-600">${summary.pendingRevenue.toLocaleString()} pending</span>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="space-y-5">
        <h2 className="font-headline text-2xl italic text-on-surface">Recent Transactions</h2>
        <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
          {bookings.length === 0 ? (
            <p className="p-10 text-center font-body text-secondary italic text-sm">
              No transactions yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-surface-container border-b border-outline-variant/10">
                  <tr>
                    {["Guest", "Date", "Tables", "Amount", "Drinks", "Payment"].map(h => (
                      <th key={h} className="px-5 py-4 text-[9px] uppercase tracking-widest text-outline font-bold whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {bookings.map((b) => (
                    <tr key={b._id} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-5 py-4 font-headline text-base italic text-on-surface whitespace-nowrap">
                        {b.customerName || b.user?.name}
                      </td>
                      <td className="px-5 py-4 font-body text-sm text-secondary whitespace-nowrap">
                        {formatDate(b.bookingDate)}
                      </td>
                      <td className="px-5 py-4 font-body text-sm font-bold text-primary italic whitespace-nowrap">
                        {b.tables.map(t => `T-${t.tableNumber}`).join(", ") || "—"}
                      </td>
                      <td className="px-5 py-4 font-headline text-base italic text-on-surface">
                        ${b.totalAmount}
                      </td>
                      <td className="px-5 py-4 font-body text-sm text-secondary">
                        {b.complimentaryDrinks} 🍷
                      </td>
                      <td className="px-5 py-4">
                        <PaymentBadge status={b.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
