"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { isAxiosError } from "axios";
import { ChevronLeft, ChevronRight, Loader2, Search } from "lucide-react";
import api from "@/lib/axios";

interface HistoryRow {
  orderId: string;
  orderNumber: string;
  event?: { _id: string; title: string; date: string };
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ tierName: string; quantity: number }>;
  ticketCount: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  status: string;
  paidAt?: string;
  createdAt: string;
  checkedInCount: number;
}

interface Totals {
  orders: number;
  tickets: number;
  gross: number;
  fees: number;
  collected: number;
  netEarnings: number;
}

const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  refunded: "bg-white/10 text-white/60 border-white/20"
};

export default function PromoterSalesHistoryPage() {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [totals, setTotals] = useState<Totals | null>(null);
  const [events, setEvents] = useState<Array<{ _id: string; title: string }>>([]);
  const [eventId, setEventId] = useState("");
  const [status, setStatus] = useState("paid");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const key = `${eventId}|${status}|${query}|${page}`;
  const loading = loadedKey !== key;

  useEffect(() => {
    api
      .get("/events/my-events")
      .then(({ data }) => setEvents((data.events || []).map((e: { _id: string; title: string }) => ({ _id: e._id, title: e.title }))))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/events/promoter/bookings", { params: { eventId: eventId || undefined, status, q: query || undefined, page, limit: 25 } })
      .then(({ data }) => {
        if (cancelled) return;
        setRows(data.bookings);
        setTotals(data.totals);
        setTotalPages(data.totalPages);
        setError(null);
      })
      .catch((err: unknown) => !cancelled && setError((isAxiosError(err) && err.response?.data?.message) || "Failed to load sales history"))
      .finally(() => !cancelled && setLoadedKey(key));
    return () => {
      cancelled = true;
    };
  }, [eventId, status, query, page, key]);

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 text-white">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Promoter</p>
        <h1 className="text-3xl font-headline italic">Sales History</h1>
        <p className="text-xs text-white/60 mt-1">Every ticket booking across your events.</p>
      </div>

      {totals && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Paid bookings", value: totals.orders },
            { label: "Tickets sold", value: totals.tickets },
            { label: "Ticket revenue", value: money(totals.gross) },
            { label: "Net earnings", value: money(totals.netEarnings) }
          ].map((c) => (
            <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <div className="text-[10px] uppercase tracking-wider text-white/50">{c.label}</div>
              <div className="mt-1 text-2xl font-bold tabular-nums">{c.value}</div>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search.trim());
        }}
        className="flex flex-col md:flex-row gap-2"
      >
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone or order number — press Enter"
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
          />
        </div>
        <select
          value={eventId}
          onChange={(e) => {
            setEventId(e.target.value);
            setPage(1);
          }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8A96A] md:max-w-xs"
        >
          <option value="" className="bg-[#0c1612]">All events</option>
          {events.map((e) => (
            <option key={e._id} value={e._id} className="bg-[#0c1612]">
              {e.title}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-[#C8A96A]"
        >
          <option value="paid" className="bg-[#0c1612]">Paid</option>
          <option value="all" className="bg-[#0c1612]">All statuses</option>
          <option value="pending" className="bg-[#0c1612]">Pending</option>
          <option value="failed" className="bg-[#0c1612]">Expired / failed</option>
          <option value="cancelled" className="bg-[#0c1612]">Cancelled</option>
          <option value="refunded" className="bg-[#0c1612]">Refunded</option>
        </select>
      </form>

      {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>}

      <div className="rounded-2xl border border-white/10 overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center z-10">
            <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
          </div>
        )}
        <table className="w-full text-left text-xs">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-3 py-2.5 font-semibold">Date</th>
              <th className="px-3 py-2.5 font-semibold">Event</th>
              <th className="px-3 py-2.5 font-semibold">Booked by</th>
              <th className="px-3 py-2.5 font-semibold">Tickets</th>
              <th className="px-3 py-2.5 font-semibold text-right">Paid</th>
              <th className="px-3 py-2.5 font-semibold">Status</th>
              <th className="px-3 py-2.5 font-semibold">Checked in</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 && !loading ? (
              <tr>
                <td colSpan={7} className="px-3 py-12 text-center text-white/40">
                  No bookings found.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.orderId} className="hover:bg-white/[0.02]">
                  <td className="px-3 py-3 whitespace-nowrap text-white/70">
                    {new Date(r.paidAt || r.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    <div className="text-[10px] text-white/30 font-mono">{r.orderNumber}</div>
                  </td>
                  <td className="px-3 py-3">
                    {r.event ? (
                      <Link href={`/promoter/events/${r.event._id}`} className="text-[#E0C68E] hover:underline">
                        {r.event.title}
                      </Link>
                    ) : (
                      <span className="text-white/40">Deleted event</span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-semibold">{r.customerName}</div>
                    <div className="text-white/50">{r.customerPhone}</div>
                    <div className="text-white/40 truncate max-w-[180px]">{r.customerEmail}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-bold">{r.ticketCount}</div>
                    <div className="text-white/50">{r.items.map((i) => `${i.tierName} ×${i.quantity}`).join(", ")}</div>
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums font-semibold">{money(r.totalAmount)}</td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLE[r.status] || ""}`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-3 tabular-nums">
                    {r.checkedInCount} / {r.ticketCount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 text-xs">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <span className="text-white/60">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
