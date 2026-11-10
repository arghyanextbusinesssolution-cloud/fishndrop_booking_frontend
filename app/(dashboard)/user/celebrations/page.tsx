"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, Loader2, PartyPopper, UserCheck, Users } from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour } from "@/lib/utils";

interface Celebration {
  _id: string;
  date: string;
  startTime: string;
  endTime?: string;
  occasion: string;
  capacity: number;
  registered: number;
  pendingApproval: number;
  checkedIn: number;
  invitesActive: boolean;
  paymentLabel: string;
}

const todayKey = () => new Date().toISOString().slice(0, 10);

export default function CelebrationsPage() {
  const [items, setItems] = useState<Celebration[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/invitations/my/celebrations")
      .then(({ data }) => setItems(data.celebrations || []))
      .catch(() => setError(true));
  }, []);

  const upcoming = (items || []).filter((c) => c.date.slice(0, 10) >= todayKey()).reverse();
  const past = (items || []).filter((c) => c.date.slice(0, 10) < todayKey());

  const Card = ({ c }: { c: Celebration }) => {
    const pct = c.capacity ? Math.min(100, Math.round((c.registered / c.capacity) * 100)) : 0;
    return (
      <Link
        href={`/user/celebrations/${c._id}`}
        className="group block rounded-2xl border border-white/10 bg-white/[0.03] hover:border-[#C8A96A]/50 p-5 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold capitalize text-white">{c.occasion.replace(/_/g, " ")}</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60 mt-1">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" />
                {new Date(c.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {formatTimeTo12Hour(c.startTime)}
                {c.endTime ? ` – ${c.endTime}` : ""}
              </span>
            </div>
          </div>
          <span
            className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full shrink-0 ${
              c.paymentLabel === "Confirmed"
                ? "bg-emerald-500/15 text-emerald-300"
                : c.paymentLabel === "Zelle verifying"
                ? "bg-sky-500/15 text-sky-300"
                : "bg-amber-500/15 text-amber-300"
            }`}
          >
            {c.paymentLabel}
          </span>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-[11px] text-white/55 mb-1.5">
            <span>Guest list</span>
            <span className="font-mono text-white/80">
              {c.registered}/{c.capacity} signed up
            </span>
          </div>
          <div className="h-2 rounded-full bg-[#2a3b33] overflow-hidden">
            <div className="h-full rounded-full bg-[#B8872A]" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs">
          <div className="flex gap-4 text-white/60">
            <span className="inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C8A96A]" /> {c.registered} signed up
            </span>
            <span className="inline-flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" /> {c.checkedIn} arrived
            </span>
            {c.pendingApproval > 0 && <span className="text-amber-300">{c.pendingApproval} waiting for you</span>}
          </div>
          <ChevronRight className="w-4 h-4 text-white/30 group-hover:text-[#C8A96A]" />
        </div>
      </Link>
    );
  };

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto text-white space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Host</p>
        <h1 className="text-3xl font-headline italic">Celebrations</h1>
        <p className="text-xs text-white/50 mt-1">See who signed up for your party, share your invite, and track who arrived at the door.</p>
      </div>

      {error && <p className="text-sm text-rose-300">Could not load your celebrations. Please refresh.</p>}
      {!items && !error && (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
        </div>
      )}

      {items && items.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center space-y-3">
          <PartyPopper className="w-10 h-10 mx-auto text-white/30" />
          <p className="text-sm text-white/70">You haven&apos;t booked a private celebration yet.</p>
          <Link href="/book-venue" className="inline-block text-xs font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] px-5 py-2.5 rounded-full">
            Book the venue
          </Link>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold">Upcoming</h2>
          {upcoming.map((c) => (
            <Card key={c._id} c={c} />
          ))}
        </section>
      )}

      {past.length > 0 && (
        <section className="space-y-3 opacity-80">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Past
          </h2>
          {past.map((c) => (
            <Card key={c._id} c={c} />
          ))}
        </section>
      )}
    </div>
  );
}
