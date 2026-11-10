"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { ArrowLeft, CalendarDays, Clock, Copy, ExternalLink, Loader2, MapPin } from "lucide-react";
import api from "@/lib/axios";
import { EventBookingsModal } from "@/components/events/EventBookingsModal";

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

interface EventInfo {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  status: string;
}

const money = (n: number) => `$${(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PromoterEventDetailsPage() {
  const params = useParams();
  const id = String(params?.id || "");
  const [event, setEvent] = useState<EventInfo | null>(null);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api
      .get(`/events/${id}/bookings`, { params: { status: "paid" } })
      .then(({ data }) => {
        setEvent(data.event);
        setSummary(data.summary);
      })
      .catch((err: unknown) => setError((isAxiosError(err) && err.response?.data?.message) || "Could not load this event"));
  }, [id]);

  if (error) {
    return (
      <div className="p-6 md:p-10 max-w-3xl mx-auto text-white space-y-4">
        <Link href="/promoter/events" className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
          <ArrowLeft className="w-4 h-4" /> My Events
        </Link>
        <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>
      </div>
    );
  }

  if (!event || !summary) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const publicUrl = typeof window === "undefined" ? `/events/${event.slug}` : `${window.location.origin}/events/${event.slug}`;
  const ticketsLeft = summary.tiers.reduce((s, t) => s + t.remaining, 0);
  const net = summary.grossRevenue - summary.platformFees;

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 text-white">
      <Link href="/promoter/events" className="inline-flex items-center gap-1 text-xs text-white/60 hover:text-white">
        <ArrowLeft className="w-4 h-4" /> My Events
      </Link>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-headline italic">{event.title}</h1>
          <div className="flex flex-wrap gap-3 text-xs text-white/60">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" />
              {new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {event.startTime} – {event.endTime}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {event.venueName}
            </span>
          </div>
        </div>
        {event.status === "published" && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(publicUrl);
                toast.success("Event link copied");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy link
            </button>
            <Link
              href={`/events/${event.slug}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8A96A] hover:bg-[#d8b97a] text-black text-xs font-bold uppercase tracking-wider"
            >
              Public page <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>

      {/* Money + availability */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Ticket revenue", value: money(summary.grossRevenue), hint: `${summary.totalOrders} paid booking${summary.totalOrders === 1 ? "" : "s"}` },
          { label: "Platform fees", value: money(summary.platformFees), hint: "Tropica service fee" },
          { label: "Your net earnings", value: money(net), hint: "Revenue − platform fees" },
          {
            label: "Tickets left",
            value: ticketsLeft,
            hint: summary.ticketsReserved > 0 ? `${summary.ticketsReserved} on hold at checkout` : `of ${summary.ticketsCapacity} total`
          }
        ].map((c) => (
          <div key={c.label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-wider text-white/50">{c.label}</div>
            <div className="mt-1 text-2xl font-bold tabular-nums">{c.value}</div>
            <div className="text-[11px] text-white/40 mt-0.5">{c.hint}</div>
          </div>
        ))}
      </div>

      {/* Per-tier availability */}
      <div className="rounded-2xl border border-white/10 overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-4 py-2.5 font-semibold">Ticket type</th>
              <th className="px-4 py-2.5 font-semibold text-right">Price</th>
              <th className="px-4 py-2.5 font-semibold text-right">Sold</th>
              <th className="px-4 py-2.5 font-semibold text-right">Left</th>
              <th className="px-4 py-2.5 font-semibold text-right">Revenue</th>
              <th className="px-4 py-2.5 font-semibold w-40">Sell-through</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {summary.tiers.map((t) => {
              const pct = t.capacity ? Math.round((t.sold / t.capacity) * 100) : 0;
              return (
                <tr key={t.name}>
                  <td className="px-4 py-3 font-semibold">{t.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(t.price)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {t.sold} / {t.capacity}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{t.remaining === 0 ? <span className="text-rose-300">Sold out</span> : t.remaining}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{money(t.sold * t.price)}</td>
                  <td className="px-4 py-3">
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div className="h-full bg-[#C8A96A]" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[10px] text-white/40 mt-1">{pct}%</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Who booked */}
      <div>
        <h2 className="text-lg font-bold mb-3">Who booked</h2>
        <EventBookingsModal eventId={event._id} eventTitle={event.title} inline />
      </div>
    </div>
  );
}
