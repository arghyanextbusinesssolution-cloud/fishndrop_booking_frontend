"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock, Loader2, MailOpen, MapPin, QrCode } from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour } from "@/lib/utils";
import { relativeDay } from "@/hooks/useUpcomingParties";

interface Invite {
  _id: string;
  hostName: string;
  occasion: string;
  eventTitle?: string;
  date: string;
  startTime: string;
  endTime?: string;
  venueName: string;
  venueAddress: string;
  inviteToken: string;
  passCode: string;
  qrCodeToken: string;
  status: "approved" | "pending_approval";
  canCancel?: boolean;
  checkedIn: boolean;
}

const todayNY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export default function MyInvitesPage() {
  const [invites, setInvites] = useState<Invite[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    api
      .get("/invitations/my/invites")
      .then(({ data }) => setInvites(data.invites || []))
      .catch(() => setError(true));
  }, []);

  const key = (d: string) => new Date(d).toISOString().slice(0, 10);
  const upcoming = (invites || []).filter((i) => key(i.date) >= todayNY()).sort((a, b) => a.date.localeCompare(b.date));
  const past = (invites || []).filter((i) => key(i.date) < todayNY());

  const Card = ({ i, isPast }: { i: Invite; isPast?: boolean }) => (
    <div className={`rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isPast ? "opacity-60" : ""}`}>
      <div className="min-w-0 space-y-1.5">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-lg font-bold capitalize">
            {i.eventTitle || `${i.hostName}'s ${i.occasion.replace(/_/g, " ")}`}
          </p>
          {!isPast && (
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#C8A96A]/15 text-[#E0C68E]">
              {relativeDay(key(i.date))}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" />
            {new Date(i.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {formatTimeTo12Hour(i.startTime)}
            {i.endTime ? ` – ${i.endTime}` : ""}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {i.venueName}
          </span>
        </div>
      </div>
      {i.checkedIn ? (
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300 shrink-0">
          <CheckCircle2 className="w-4 h-4" /> Checked in
        </span>
      ) : i.status === "approved" ? (
        <Link
          href={`/invite/pass/${i.qrCodeToken}`}
          className="inline-flex items-center justify-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-4 py-2 rounded-full shrink-0"
        >
          <QrCode className="w-3.5 h-3.5" /> My door pass
        </Link>
      ) : (
        <span className="text-xs text-amber-200 shrink-0">Waiting for the host to approve you</span>
      )}
      {i.canCancel && !i.checkedIn && (
        <Link href={`/invite/${i.inviteToken}`} className="text-[11px] text-rose-300 hover:text-rose-200 underline shrink-0">
          Can&apos;t make it?
        </Link>
      )}
    </div>
  );

  return (
    <div className="p-4 sm:p-6 md:p-10 max-w-4xl mx-auto text-white space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Guest</p>
        <h1 className="text-3xl font-headline italic">Invitations</h1>
        <p className="text-xs text-white/50 mt-1">Parties you&apos;ve joined from an invite link. Show your door pass when you arrive.</p>
      </div>

      {error && <p className="text-sm text-rose-300">Could not load your invitations. Please refresh.</p>}
      {!invites && !error && (
        <div className="py-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
        </div>
      )}

      {invites && invites.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center space-y-2">
          <MailOpen className="w-10 h-10 mx-auto text-white/30" />
          <p className="text-sm text-white/70">No party invitations yet.</p>
          <p className="text-xs text-white/45">When a friend shares their Tropica invite link and you join, it shows up here.</p>
        </div>
      )}

      {upcoming.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold">Upcoming</h2>
          {upcoming.map((i) => (
            <Card key={i._id} i={i} />
          ))}
        </section>
      )}
      {past.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs uppercase tracking-widest text-white/50 font-bold">Past</h2>
          {past.map((i) => (
            <Card key={i._id} i={i} isPast />
          ))}
        </section>
      )}
    </div>
  );
}
