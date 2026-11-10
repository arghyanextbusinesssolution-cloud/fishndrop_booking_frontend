"use client";

import { useEffect, useState } from "react";
import api from "@/lib/axios";

export type UpcomingKind = "invite" | "hosting" | "ticket";

export interface UpcomingItem {
  id: string;
  kind: UpcomingKind;
  title: string;
  subtitle: string;
  date: string; // ISO (UTC midnight of the calendar day)
  dayKey: string; // YYYY-MM-DD
  startTime: string;
  href: string;
  badge?: string;
}

const dayKey = (d: string) => new Date(d).toISOString().slice(0, 10);
const todayNY = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/New_York" });
const cap = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Upcoming parties for the signed-in user: invites (as guest), parties they host, and event tickets. */
export function useUpcomingParties(enabled = true) {
  const [items, setItems] = useState<UpcomingItem[] | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const safe = (p: Promise<any>) => p.then((r) => r.data).catch(() => null);

    Promise.all([
      safe(api.get("/invitations/my/invites")),
      safe(api.get("/invitations/my/celebrations")),
      safe(api.get("/tickets/my"))
    ]).then(([inv, cel, tix]) => {
      if (cancelled) return;
      const today = todayNY();
      const out: UpcomingItem[] = [];

      for (const i of inv?.invites || []) {
        out.push({
          id: `inv-${i._id}`,
          kind: "invite",
          title: `${i.hostName}'s ${cap(i.occasion)}`,
          subtitle: "You're invited",
          date: i.date,
          dayKey: dayKey(i.date),
          startTime: i.startTime,
          href: i.status === "approved" ? `/invite/pass/${i.qrCodeToken}` : `/invite/${i.inviteToken}`,
          badge: i.checkedIn ? "Checked in" : i.status === "pending_approval" ? "Awaiting host" : "Guest pass"
        });
      }
      for (const c of cel?.celebrations || []) {
        out.push({
          id: `cel-${c._id}`,
          kind: "hosting",
          title: `Your ${cap(c.occasion)}`,
          subtitle: `${c.registered}/${c.capacity} guests signed up`,
          date: c.date,
          dayKey: dayKey(c.date),
          startTime: c.startTime,
          href: `/user/celebrations/${c._id}`,
          badge: "Hosting"
        });
      }
      const seenEvents = new Set<string>();
      for (const t of tix?.tickets || []) {
        if (!t.event || seenEvents.has(t.event._id)) continue;
        seenEvents.add(t.event._id);
        const count = (tix.tickets as any[]).filter((x) => x.event?._id === t.event._id).length;
        out.push({
          id: `tix-${t.event._id}`,
          kind: "ticket",
          title: t.event.title,
          subtitle: `${count} ticket${count === 1 ? "" : "s"} · ${t.event.venueName}`,
          date: t.event.date,
          dayKey: dayKey(t.event.date),
          startTime: t.event.startTime,
          href: "/user/tickets",
          badge: "Event"
        });
      }

      setItems(
        out
          .filter((x) => x.dayKey >= today)
          .sort((a, b) => (a.dayKey + a.startTime).localeCompare(b.dayKey + b.startTime))
      );
    });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return items;
}

/** "Today", "Tomorrow", "in 5 days" or "Sat, Nov 21". */
export const relativeDay = (key: string) => {
  const today = todayNY();
  const diff = Math.round((Date.parse(`${key}T12:00:00Z`) - Date.parse(`${today}T12:00:00Z`)) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff > 1 && diff < 7) return `in ${diff} days`;
  return new Date(`${key}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
};
