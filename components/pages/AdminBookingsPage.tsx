"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Booking } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { CalendarDays, Search, ChevronLeft, ChevronRight, XCircle } from "lucide-react";

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

const FILTER_TABS = [
  { key: "all", label: "All Bookings" },
  { key: "confirmed", label: "Confirmed" },
  { key: "cancelled", label: "Cancelled" },
];

export default function AdminBookingsPage() {
  const { getAllBookings, adminCancelBooking } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBookings(page, status);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getAllBookings, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = query
    ? bookings.filter((b) =>
        (b.customerName || b.user?.name || "").toLowerCase().includes(query.toLowerCase()) ||
        (b.customerEmail || b.user?.email || "").toLowerCase().includes(query.toLowerCase())
      )
    : bookings;

  if (loading) return <LoadingSpinner />;

  return (
    <div className="p-6 md:p-10 space-y-8 min-h-screen">

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
            Administration
          </span>
          <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
            All Reservations
          </h1>
          <p className="text-sm text-secondary font-body font-light italic">
            {total} total reservations across all time
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CalendarDays className="w-4 h-4 text-outline" strokeWidth={1.5} />
          <span className="font-label text-[9px] uppercase tracking-[0.2em] text-outline font-bold">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </span>
        </div>
      </div>

      {/* Filter Tabs + Search */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setStatus(tab.key); setPage(1); }}
              className={cn(
                "px-5 py-2.5 rounded-full text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border",
                status === tab.key
                  ? "bg-on-surface text-surface border-on-surface shadow-md"
                  : "bg-surface-container-lowest text-secondary border-outline-variant/20 hover:border-outline-variant/40 hover:text-on-surface"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline" strokeWidth={1.5} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-full text-sm font-body text-on-surface placeholder:text-outline/50 focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm border border-outline-variant/10">
        {filtered.length === 0 ? (
          <p className="p-10 text-center font-body text-secondary italic text-sm">
            No reservations found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-surface-container border-b border-outline-variant/10">
                <tr>
                  {["#", "Guest Name", "Email", "Date", "Time", "Party", "Tables", "Amount", "Payment", "Status", "Actions"].map(h => (
                    <th key={h} className="px-4 py-4 text-[9px] uppercase tracking-widest text-outline font-bold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {filtered.map((b, i) => (
                  <tr key={b._id} className="hover:bg-surface-container/50 transition-colors">
                    <td className="px-4 py-4 font-body text-sm text-secondary">{(page - 1) * 10 + i + 1}</td>
                    <td className="px-4 py-4 font-headline text-base italic text-on-surface whitespace-nowrap">
                      {b.customerName || b.user?.name}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap">
                      {b.customerEmail || b.user?.email}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-secondary whitespace-nowrap">
                      {formatDate(b.bookingDate)}
                    </td>
                    <td className="px-4 py-4 font-body text-sm text-secondary">{b.bookingTime}</td>
                    <td className="px-4 py-4 font-body text-sm text-secondary">{b.partySize} pax</td>
                    <td className="px-4 py-4 font-body text-sm font-bold text-primary italic whitespace-nowrap">
                      {b.tables.map(t => `T-${t.tableNumber}`).join(", ") || "—"}
                    </td>
                    <td className="px-4 py-4 font-headline text-base italic text-on-surface">${b.totalAmount}</td>
                    <td className="px-4 py-4"><PaymentBadge status={b.paymentStatus} /></td>
                    <td className="px-4 py-4"><StatusBadge status={b.status} /></td>
                    <td className="px-4 py-4">
                      {b.status === "confirmed" && (
                        <button
                          onClick={async () => {
                            if (!window.confirm("Cancel this booking?")) return;
                            await adminCancelBooking(b._id);
                            toast.success("Booking cancelled");
                            await load();
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-200 text-red-600 text-[9px] uppercase tracking-widest font-bold hover:bg-red-50 transition-colors"
                        >
                          <XCircle className="w-3 h-3" strokeWidth={2} />
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-3 h-3" /> Previous
          </button>
          <span className="font-headline text-sm italic text-on-surface">
            {page} <span className="text-outline font-body not-italic text-xs">of</span> {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex items-center gap-1 px-4 py-2 rounded-full border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-secondary hover:text-on-surface hover:border-outline-variant/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            Next <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}
