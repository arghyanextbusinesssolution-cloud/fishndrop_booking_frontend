"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { ChevronDown, Download, Loader2, Search, Ticket, Users, X, CheckCircle2, DollarSign } from "lucide-react";
import api from "@/lib/axios";

interface BookingTicket {
  ticketCode: string;
  tierName: string;
  price: number;
  status: "valid" | "used" | "refunded" | "cancelled";
  checkedIn: boolean;
  checkedInAt?: string;
  checkedInByName?: string;
}

interface Booking {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: Array<{ tierName: string; quantity: number; unitPrice: number; subtotal: number }>;
  ticketCount: number;
  subtotal: number;
  platformFee: number;
  totalAmount: number;
  status: "pending" | "paid" | "failed" | "cancelled" | "refunded";
  paidAt?: string;
  createdAt: string;
  checkedInCount: number;
  tickets: BookingTicket[];
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
  tiers: Array<{ name: string; price: number; capacity: number; sold: number; reserved: number; remaining: number }>;
}

interface Props {
  eventId: string | null;
  eventTitle?: string;
  onClose?: () => void;
  /** Render as an embedded page section instead of a popup. */
  inline?: boolean;
}

const money = (n: number) => `$${(Number(n) || 0).toFixed(2)}`;

const STATUS_STYLE: Record<string, string> = {
  paid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pending: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  failed: "bg-red-500/15 text-red-300 border-red-500/30",
  cancelled: "bg-red-500/15 text-red-300 border-red-500/30",
  refunded: "bg-white/10 text-white/60 border-white/20",
  valid: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  used: "bg-sky-500/15 text-sky-300 border-sky-500/30"
};

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** Ticket bookings ledger for one event — used by admin/staff and the owning promoter. */
export function EventBookingsModal({ eventId, eventTitle, onClose = () => {}, inline = false }: Props) {
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<"paid" | "all">("paid");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;
    const key = `${eventId}|${statusFilter}`;
    api
      .get(`/events/${eventId}/bookings`, { params: { status: statusFilter } })
      .then(({ data }) => {
        if (cancelled || !data.success) return;
        setSummary(data.summary);
        setBookings(data.bookings);
      })
      .catch((err) => !cancelled && toast.error(err.response?.data?.message || "Failed to load bookings"))
      .finally(() => !cancelled && setLoadedKey(key));
    return () => {
      cancelled = true;
    };
  }, [eventId, statusFilter]);

  useEffect(() => {
    if (!eventId || inline) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [eventId, onClose, inline]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return bookings;
    return bookings.filter((b) =>
      [b.customerName, b.customerEmail, b.customerPhone, b.orderNumber, ...b.tickets.map((t) => t.ticketCode)]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [bookings, query]);

  const exportCsv = () => {
    const header = ["Order", "Status", "Name", "Email", "Phone", "Ticket Code", "Tier", "Price", "Ticket Status", "Checked In", "Checked In At", "Order Total", "Paid At"];
    const rows = filtered.flatMap((b) =>
      (b.tickets.length ? b.tickets : [null]).map((t) =>
        [
          b.orderNumber,
          b.status,
          b.customerName,
          b.customerEmail,
          b.customerPhone,
          t?.ticketCode,
          t?.tierName,
          t?.price,
          t?.status,
          t ? (t.checkedIn ? "yes" : "no") : "",
          t?.checkedInAt ? new Date(t.checkedInAt).toLocaleString() : "",
          b.totalAmount,
          b.paidAt ? new Date(b.paidAt).toLocaleString() : ""
        ]
          .map(csvCell)
          .join(",")
      )
    );
    const blob = new Blob([[header.map(csvCell).join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(eventTitle || "event").replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-bookings.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!eventId) return null;

  const loading = loadedKey !== `${eventId}|${statusFilter}`;

  const stats = summary
    ? [
        { label: "Tickets sold", value: `${summary.ticketsSold} / ${summary.ticketsCapacity}`, icon: Ticket },
        { label: "Bookings", value: summary.totalOrders, icon: Users },
        { label: "Checked in", value: `${summary.checkedIn} / ${summary.ticketsSold}`, icon: CheckCircle2 },
        { label: "Collected", value: money(summary.totalCollected), icon: DollarSign }
      ]
    : [];

  const body = (
    <div className={inline ? "space-y-5" : "flex-1 overflow-y-auto p-5 space-y-5"}>
          {loading && !summary ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <div key={s.label} className="rounded-xl border border-white/10 bg-white/[0.03] p-3.5">
                    <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/50">
                      <s.icon className="w-3.5 h-3.5 text-[#C8A96A]" /> {s.label}
                    </div>
                    <div className="mt-1 text-xl font-bold tabular-nums">{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Tier breakdown */}
              {summary && (
                <div className="flex flex-wrap gap-2">
                  {summary.tiers.map((t) => (
                    <span key={t.name} className="px-2.5 py-1 rounded-lg bg-white/[0.04] border border-white/10 text-[11px] text-white/70">
                      <strong className="text-white">{t.name}</strong> {money(t.price)} · {t.sold} sold · {t.remaining} left
                      {t.reserved > 0 ? ` · ${t.reserved} on hold` : ""}
                    </span>
                  ))}
                </div>
              )}

              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-white/40 absolute left-3 top-2.5" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, email, phone, order or ticket code…"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#C8A96A]"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as "paid" | "all")}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#C8A96A] cursor-pointer"
                >
                  <option value="paid" className="bg-[#0c1612]">Paid bookings</option>
                  <option value="all" className="bg-[#0c1612]">All (incl. pending / failed)</option>
                </select>
                <button
                  onClick={exportCsv}
                  disabled={filtered.length === 0}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider inline-flex items-center justify-center gap-1.5 disabled:opacity-40 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> CSV
                </button>
              </div>

              {/* Bookings */}
              {filtered.length === 0 ? (
                <p className="py-10 text-center text-xs text-white/40">
                  {bookings.length === 0 ? "No ticket bookings yet." : "No bookings match your search."}
                </p>
              ) : (
                <div className="rounded-xl border border-white/10 overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/50">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold">Booked by</th>
                        <th className="px-3 py-2.5 font-semibold">Tickets</th>
                        <th className="px-3 py-2.5 font-semibold text-right">Amount</th>
                        <th className="px-3 py-2.5 font-semibold">Status</th>
                        <th className="px-3 py-2.5 font-semibold">Checked in</th>
                        <th className="px-3 py-2.5 font-semibold">Date</th>
                        <th className="px-3 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filtered.map((b) => {
                        const open = expanded === b.orderId;
                        return (
                          <Fragment key={b.orderId}>
                            <tr className="hover:bg-white/[0.02] cursor-pointer" onClick={() => setExpanded(open ? null : b.orderId)}>
                              <td className="px-3 py-3">
                                <div className="font-semibold text-white">{b.customerName}</div>
                                <div className="text-white/50">{b.customerPhone}</div>
                                <div className="text-white/40 truncate max-w-[200px]">{b.customerEmail}</div>
                              </td>
                              <td className="px-3 py-3">
                                <div className="font-bold">{b.ticketCount}</div>
                                <div className="text-white/50">{b.items.map((i) => `${i.tierName} ×${i.quantity}`).join(", ")}</div>
                              </td>
                              <td className="px-3 py-3 text-right tabular-nums">
                                <div className="font-semibold">{money(b.totalAmount)}</div>
                                {b.platformFee > 0 && <div className="text-[10px] text-white/40">fee {money(b.platformFee)}</div>}
                              </td>
                              <td className="px-3 py-3">
                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLE[b.status] || ""}`}>
                                  {b.status}
                                </span>
                              </td>
                              <td className="px-3 py-3 tabular-nums">
                                {b.checkedInCount} / {b.tickets.length || b.ticketCount}
                              </td>
                              <td className="px-3 py-3 text-white/60 whitespace-nowrap">
                                {new Date(b.paidAt || b.createdAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                                <div className="text-[10px] text-white/30 font-mono">{b.orderNumber}</div>
                              </td>
                              <td className="px-3 py-3">
                                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${open ? "rotate-180" : ""}`} />
                              </td>
                            </tr>
                            {open && (
                              <tr className="bg-black/30">
                                <td colSpan={7} className="px-3 py-3">
                                  {b.tickets.length === 0 ? (
                                    <p className="text-white/40">No tickets issued (order not paid).</p>
                                  ) : (
                                    <div className="grid sm:grid-cols-2 gap-2">
                                      {b.tickets.map((t) => (
                                        <div key={t.ticketCode} className="flex items-center justify-between gap-2 rounded-lg border border-white/10 px-3 py-2">
                                          <div>
                                            <div className="font-mono text-white">{t.ticketCode}</div>
                                            <div className="text-white/50">{t.tierName} · {money(t.price)}</div>
                                          </div>
                                          <div className="text-right">
                                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase ${STATUS_STYLE[t.status] || ""}`}>
                                              {t.checkedIn ? "checked in" : t.status}
                                            </span>
                                            {t.checkedInAt && (
                                              <div className="mt-1 text-[10px] text-white/40">
                                                {new Date(t.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                                                {t.checkedInByName ? ` · ${t.checkedInByName}` : ""}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
    </div>
  );

  if (inline) return body;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Event bookings"
        className="w-full sm:max-w-5xl max-h-[94vh] flex flex-col bg-[#0c1612] border border-white/15 rounded-t-3xl sm:rounded-2xl shadow-2xl text-white overflow-hidden"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">Ticket bookings</p>
            <h3 className="text-lg font-bold truncate">{eventTitle || "Event"}</h3>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {body}
      </div>
    </div>
  );
}
