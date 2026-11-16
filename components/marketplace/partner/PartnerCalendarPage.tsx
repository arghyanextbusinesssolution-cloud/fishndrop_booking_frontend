"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { addMonths, eachDayOfInterval, endOfMonth, endOfWeek, format, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { CalendarDays, ChevronLeft, ChevronRight, Clock, Loader2, Lock, Mail, Phone, Users } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { OwnerBooking, PortalHeader, money, time12 } from "./shared";

interface Block {
  _id: string;
  date: string;
  startMin: number;
  endMin: number;
  note?: string;
}

type Kind = "booked" | "awaiting" | "request" | "blocked";

/** Status colors are reserved for state and always shown with a text label. */
const KIND: Record<Kind, { label: string; chip: string; dot: string }> = {
  booked: { label: "Booked", chip: "bg-emerald-500/15 text-emerald-200 border-emerald-400/30", dot: "bg-emerald-400" },
  awaiting: { label: "Awaiting payment", chip: "bg-amber-500/15 text-amber-200 border-amber-400/30", dot: "bg-amber-400" },
  request: { label: "New request", chip: "bg-sky-500/15 text-sky-200 border-sky-400/30 border-dashed", dot: "bg-sky-400" },
  blocked: { label: "Blocked", chip: "bg-white/10 text-white/60 border-white/15", dot: "bg-white/40" }
};

const kindOf = (b: OwnerBooking): Kind =>
  b.status === "requested" ? "request" : b.status === "availability_confirmed" ? "awaiting" : "booked";

const minToTime = (m: number) => {
  const mm = ((m % 1440) + 1440) % 1440;
  return time12(`${String(Math.floor(mm / 60)).padStart(2, "0")}:${String(mm % 60).padStart(2, "0")}`);
};

interface Entry {
  key: string;
  kind: Kind;
  sort: string;
  title: string;
  time: string;
  booking?: OwnerBooking;
  block?: Block;
}

const todayNY = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());

/** Venue owner: every booking and block on a month calendar, day by day. */
export default function PartnerCalendarPage() {
  const [month, setMonth] = useState(() => todayNY().slice(0, 7));
  const [data, setData] = useState<{ month: string; bookings: OwnerBooking[]; blocks: Block[] } | null>(null);
  const [error, setError] = useState(false);
  const [selected, setSelected] = useState<string>(() => todayNY());

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/partner/calendar", { params: { month } })
      .then(({ data }) => {
        if (!cancelled) {
          setData(data);
          setError(false);
        }
      })
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, [month]);

  const loaded = data?.month === month ? data : null;

  const byDay = useMemo(() => {
    const map = new Map<string, Entry[]>();
    const push = (date: string, e: Entry) => map.set(date, [...(map.get(date) || []), e]);
    for (const b of loaded?.bookings || []) {
      push(b.date, {
        key: b._id,
        kind: kindOf(b),
        sort: b.startTime,
        title: b.customerName,
        time: `${time12(b.startTime)} – ${time12(b.endTime)}`,
        booking: b
      });
    }
    for (const bl of loaded?.blocks || []) {
      const allDay = bl.startMin <= 0 && bl.endMin >= 1440;
      push(bl.date, {
        key: bl._id,
        kind: "blocked",
        sort: allDay ? "00:00" : String(bl.startMin).padStart(4, "0"),
        title: bl.note || "Blocked",
        time: allDay ? "All day" : `${minToTime(bl.startMin)} – ${minToTime(bl.endMin)}`,
        block: bl
      });
    }
    for (const list of map.values()) list.sort((a, b) => a.sort.localeCompare(b.sort));
    return map;
  }, [loaded]);

  const monthDate = new Date(`${month}-15T12:00:00`);
  const days = eachDayOfInterval({ start: startOfWeek(startOfMonth(monthDate)), end: endOfWeek(endOfMonth(monthDate)) });
  const today = todayNY();
  const booked = (loaded?.bookings || []).filter((b) => kindOf(b) === "booked");
  const monthEarnings = booked.reduce((s, b) => s + b.venuePayout, 0);
  const selectedEntries = byDay.get(selected) || [];

  const go = (delta: number) => {
    const next = format(addMonths(monthDate, delta), "yyyy-MM");
    setMonth(next);
    setSelected(next === today.slice(0, 7) ? today : `${next}-01`);
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-6 min-h-screen">
      <PortalHeader title="Calendar" subtitle="Every booking, request and blocked time at your venue, day by day." />

      {/* Month switcher + summary */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => go(-1)} aria-label="Previous month" className="w-9 h-9 rounded-full border border-white/15 text-white/70 hover:text-white flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h2 className="font-headline text-2xl text-white min-w-[11rem] text-center">{format(monthDate, "MMMM yyyy")}</h2>
          <button type="button" onClick={() => go(1)} aria-label="Next month" className="w-9 h-9 rounded-full border border-white/15 text-white/70 hover:text-white flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
          {month !== today.slice(0, 7) && (
            <button
              type="button"
              onClick={() => {
                setMonth(today.slice(0, 7));
                setSelected(today);
              }}
              className="ml-1 rounded-full border border-white/15 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/70 hover:text-white"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex gap-6 text-sm">
          <p className="text-white/60">
            <span className="text-white font-semibold">{booked.length}</span> booking{booked.length === 1 ? "" : "s"}
          </p>
          <p className="text-white/60">
            Earnings <span className="text-[#E0C68E] font-semibold">{money(monthEarnings)}</span>
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-white/60">
        {(Object.keys(KIND) as Kind[]).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5">
            <span className={cn("w-2.5 h-2.5 rounded-full", KIND[k].dot)} /> {KIND[k].label}
          </span>
        ))}
      </div>

      {error && <p className="text-sm text-rose-300">Couldn&apos;t load your calendar. Please refresh.</p>}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Month grid */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden relative">
          {!loaded && !error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30">
              <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-white/10 bg-white/[0.03]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="px-2 py-2 text-[10px] uppercase tracking-widest text-white/45 text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((d) => {
              const key = format(d, "yyyy-MM-dd");
              const entries = byDay.get(key) || [];
              const inMonth = isSameMonth(d, monthDate);
              const isToday = key === today;
              const isSelected = key === selected;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelected(key)}
                  className={cn(
                    "min-h-[72px] sm:min-h-[104px] border-b border-r border-white/5 p-1.5 text-left align-top flex flex-col gap-1 transition-colors",
                    inMonth ? "hover:bg-white/[0.04]" : "opacity-35",
                    isSelected && "bg-[#C8A96A]/10 ring-1 ring-inset ring-[#C8A96A]/60",
                    key < today && inMonth && "bg-black/10"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs w-6 h-6 rounded-full flex items-center justify-center",
                      isToday ? "bg-[#C8A96A] text-[#0d1612] font-bold" : "text-white/70"
                    )}
                  >
                    {format(d, "d")}
                  </span>
                  {/* Phones: dots; larger screens: labelled chips */}
                  <span className="flex flex-wrap gap-1 sm:hidden">
                    {entries.slice(0, 4).map((e) => (
                      <span key={e.key} className={cn("w-1.5 h-1.5 rounded-full", KIND[e.kind].dot)} />
                    ))}
                  </span>
                  <span className="hidden sm:flex flex-col gap-1 w-full">
                    {entries.slice(0, 2).map((e) => (
                      <span key={e.key} className={cn("block truncate rounded-md border px-1.5 py-0.5 text-[10px] leading-tight", KIND[e.kind].chip)}>
                        {e.kind === "blocked" ? e.time : time12(e.booking?.startTime)} · {e.title}
                      </span>
                    ))}
                    {entries.length > 2 && <span className="text-[10px] text-white/50 px-1">+{entries.length - 2} more</span>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected day */}
        <aside className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-4 lg:sticky lg:top-6">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">{selected === today ? "Today" : format(new Date(`${selected}T12:00:00`), "EEEE")}</p>
            <h3 className="font-headline text-2xl text-white">{format(new Date(`${selected}T12:00:00`), "MMMM d, yyyy")}</h3>
          </div>

          {selectedEntries.length === 0 ? (
            <div className="text-sm text-white/50 space-y-3">
              <p>Nothing booked on this day.</p>
              <Link href="/partner-portal/availability" className="inline-flex items-center gap-1.5 text-xs text-[#C8A96A]">
                <Lock className="w-3.5 h-3.5" /> Block time on this day
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedEntries.map((e) => (
                <li key={e.key} className="rounded-xl border border-white/10 bg-black/20 p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-white font-semibold text-sm truncate">{e.title}</p>
                    <span className={cn("shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", KIND[e.kind].chip)}>
                      {KIND[e.kind].label}
                    </span>
                  </div>
                  <p className="text-xs text-white/60 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {e.time}
                  </p>
                  {e.booking && (
                    <>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#C8A96A]" /> {e.booking.guests} guests
                        </span>
                        {e.booking.occasion && <span className="capitalize">{e.booking.occasion.replace(/_/g, " ")}</span>}
                      </div>
                      {e.booking.customerPhone && (
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
                          <a href={`tel:${e.booking.customerPhone}`} className="flex items-center gap-1.5 hover:text-white">
                            <Phone className="w-3.5 h-3.5" /> {e.booking.customerPhone}
                          </a>
                          {e.booking.customerEmail && (
                            <a href={`mailto:${e.booking.customerEmail}`} className="flex items-center gap-1.5 hover:text-white truncate">
                              <Mail className="w-3.5 h-3.5" /> {e.booking.customerEmail}
                            </a>
                          )}
                        </div>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs">
                        <span className="text-white/45">#{e.booking.bookingNumber}</span>
                        <span className="text-white/60">
                          Your payout <span className="text-[#E0C68E] font-semibold">{money(e.booking.venuePayout)}</span>
                        </span>
                      </div>
                      {e.kind === "request" && (
                        <Link href="/partner-portal/requests" className="block text-center rounded-full bg-[#C8A96A] text-[#0d1612] py-2 text-[11px] font-bold uppercase tracking-wider">
                          Accept or decline
                        </Link>
                      )}
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p className="text-[11px] text-white/35 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" /> Times are New York time.
          </p>
        </aside>
      </div>
    </div>
  );
}
