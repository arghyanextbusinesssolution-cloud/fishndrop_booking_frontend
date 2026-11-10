"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Loader2, MapPin, QrCode, Ticket, Users } from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

interface MyTicket {
  _id: string;
  orderId: string;
  orderNumber?: string;
  qrMode: "individual" | "group";
  groupQrToken?: string | null;
  ticketCode: string;
  tierName: string;
  price: number;
  qrCodeToken: string;
  status: "valid" | "used";
  checkedIn: boolean;
  event?: {
    _id: string;
    title: string;
    slug: string;
    date: string;
    startTime: string;
    endTime: string;
    venueName: string;
    flyerUrl?: string;
  };
}

interface EventGroup {
  key: string;
  event: NonNullable<MyTicket["event"]>;
  tickets: MyTicket[];
  upcoming: boolean;
}

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<MyTicket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);

  const load = () =>
    api
      .get("/tickets/my")
      .then(({ data }) => setTickets(data.tickets || []))
      .catch(() => setError("Could not load your tickets. Please refresh."));

  useEffect(() => {
    void load();
  }, []);

  const switchMode = async (orderId: string, mode: "individual" | "group") => {
    setSwitching(orderId);
    try {
      await api.post(`/tickets/orders/${orderId}/qr-mode`, { mode });
      toast.success(mode === "group" ? "One group QR created" : "Switched to a separate QR for each person");
      await load();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Could not change QR type");
    } finally {
      setSwitching(null);
    }
  };

  const groups = useMemo<EventGroup[]>(() => {
    const map = new Map<string, EventGroup>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (const t of tickets || []) {
      if (!t.event) continue;
      const key = t.event._id;
      if (!map.has(key)) map.set(key, { key, event: t.event, tickets: [], upcoming: new Date(t.event.date) >= today });
      map.get(key)!.tickets.push(t);
    }
    return [...map.values()].sort((a, b) =>
      a.upcoming !== b.upcoming
        ? Number(b.upcoming) - Number(a.upcoming)
        : (new Date(a.event.date).getTime() - new Date(b.event.date).getTime()) * (a.upcoming ? 1 : -1)
    );
  }, [tickets]);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">My Account</p>
        <h1 className="text-3xl font-headline italic">My Event Tickets</h1>
        <p className="text-xs text-white/50 mt-1">Show the QR pass at the door for entry.</p>
      </div>

      {error && <p className="text-sm text-rose-300">{error}</p>}

      {!tickets && !error && (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
        </div>
      )}

      {tickets && groups.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center space-y-3">
          <Ticket className="w-10 h-10 mx-auto text-white/30" />
          <p className="text-sm text-white/70">You haven&apos;t booked any event tickets yet.</p>
          <Link href="/" className="inline-block text-xs font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] px-5 py-2.5 rounded-full">
            Explore events
          </Link>
        </div>
      )}

      {groups.map((g) => (
        <section key={g.key} className={`rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden ${g.upcoming ? "" : "opacity-70"}`}>
          <div className="flex flex-col sm:flex-row gap-4 p-5 border-b border-white/10">
            {g.event.flyerUrl && (
              <img src={g.event.flyerUrl} alt="" className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl border border-white/10" />
            )}
            <div className="min-w-0 space-y-1.5">
              <span
                className={`inline-block text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                  g.upcoming ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
                }`}
              >
                {g.upcoming ? "Upcoming" : "Past event"}
              </span>
              <Link href={`/events/${g.event.slug}`} className="block text-lg font-bold hover:text-[#E0C68E] truncate">
                {g.event.title}
              </Link>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" />
                  {new Date(g.event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {g.event.startTime} – {g.event.endTime}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {g.event.venueName}
                </span>
              </div>
              <p className="text-xs text-white/40">
                {g.tickets.length} ticket{g.tickets.length === 1 ? "" : "s"}
              </p>
            </div>
          </div>

          {Object.values(
            g.tickets.reduce<Record<string, MyTicket[]>>((m, t) => ((m[t.orderId] = [...(m[t.orderId] || []), t]), m), {})
          ).map((orderTickets) => {
            const first = orderTickets[0];
            const isGroup = first.qrMode === "group" && !!first.groupQrToken;
            const inCount = orderTickets.filter((t) => t.checkedIn).length;
            return (
              <div key={first.orderId} className="border-t border-white/5">
                {isGroup ? (
                  <div className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0 flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-[#C8A96A] mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold">Group QR · {orderTickets.length} people</p>
                        <p className="text-[11px] text-white/45">
                          {Object.entries(
                            orderTickets.reduce<Record<string, number>>((m, t) => ((m[t.tierName] = (m[t.tierName] || 0) + 1), m), {})
                          )
                            .map(([n, c]) => `${c}× ${n}`)
                            .join(" · ")}
                          {inCount > 0 && ` · ${inCount}/${orderTickets.length} checked in`}
                        </p>
                      </div>
                    </div>
                    {inCount >= orderTickets.length ? (
                      <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300 shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5" /> All in
                      </span>
                    ) : (
                      <Link
                        href={`/tickets/group/${first.groupQrToken}`}
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-3 py-1.5 rounded-full shrink-0"
                      >
                        <QrCode className="w-3.5 h-3.5" /> Group pass
                      </Link>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {orderTickets.map((t) => (
                      <li key={t._id} className="flex items-center justify-between gap-3 px-5 py-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{t.tierName}</p>
                          <p className="text-[11px] font-mono text-white/40">{t.ticketCode}</p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {t.checkedIn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Checked in
                            </span>
                          ) : (
                            <Link
                              href={`/tickets/${t.qrCodeToken}`}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-3 py-1.5 rounded-full"
                            >
                              <QrCode className="w-3.5 h-3.5" /> View pass
                            </Link>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {orderTickets.length > 1 && g.upcoming && inCount < orderTickets.length && (
                  <div className="px-5 pb-3">
                    <button
                      type="button"
                      disabled={switching === first.orderId}
                      onClick={() => switchMode(first.orderId, isGroup ? "individual" : "group")}
                      className="text-[11px] text-[#C8A96A] hover:text-[#E0C68E] underline underline-offset-2 cursor-pointer disabled:opacity-50"
                    >
                      {switching === first.orderId
                        ? "Saving…"
                        : isGroup
                        ? "Use a separate QR for each person instead"
                        : `Use one group QR for all ${orderTickets.length} instead`}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
