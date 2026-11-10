"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Hourglass,
  Loader2,
  MapPin,
  QrCode,
  Share2,
  Ticket,
  UserPlus,
  Users,
  X
} from "lucide-react";
import toast from "react-hot-toast";
import api from "@/lib/axios";

/** Server error message from an axios error, or a fallback. */
const apiMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

const LiveTicketQr = dynamic(() => import("@/components/shared/LiveTicketQr"), { ssr: false });

interface EventInfo {
  _id: string;
  title: string;
  slug: string;
  date: string;
  startTime: string;
  endTime: string;
  venueName: string;
  flyerUrl?: string;
}

interface MyTicket {
  _id: string;
  orderId: string;
  orderNumber?: string;
  isLegacy: boolean;
  legacyGroupQrToken?: string | null;
  isBuyerSeat: boolean;
  holderStatus: "accepted" | "pending";
  holderName: string;
  guestOf: string | null;
  canCancel: boolean;
  cancelDeadline: string | null;
  ticketCode: string;
  tierName: string;
  price: number;
  qrCodeToken?: string;
  status: "valid" | "used";
  checkedIn: boolean;
  event?: EventInfo;
}

interface Seat {
  _id: string;
  ticketCode: string;
  tierName: string;
  isBuyerSeat: boolean;
  holderStatus: "unassigned" | "pending" | "accepted";
  holderName: string;
  holderPhone: string;
  checkedIn: boolean;
  status: string;
}

interface SharedOrder {
  orderId: string;
  orderNumber: string;
  shareToken: string;
  guestCancelDeadline?: string;
  event?: EventInfo;
  seats: Seat[];
}

const COUNTRIES = [
  { id: "US", code: "+1", flag: "🇺🇸" },
  { id: "IN", code: "+91", flag: "🇮🇳" }
] as const;

const isUpcoming = (date?: string) => {
  if (!date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(date) >= today;
};

const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

function EventHeader({ event, children }: { event: EventInfo; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-5 border-b border-white/10">
      {event.flyerUrl && (
        <img src={event.flyerUrl} alt="" className="w-full sm:w-28 h-40 sm:h-28 object-cover rounded-xl border border-white/10" />
      )}
      <div className="min-w-0 space-y-1.5">
        <Link href={`/events/${event.slug}`} className="block text-lg font-bold hover:text-[#E0C68E] truncate">
          {event.title}
        </Link>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/60">
          <span className="inline-flex items-center gap-1">
            <CalendarDays className="w-3.5 h-3.5 text-[#C8A96A]" /> {fmtDate(event.date)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#C8A96A]" /> {event.startTime} – {event.endTime}
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {event.venueName}
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────── Buyer: share link + guest list ───────────────────────── */

function GuestManager({ order, onChange }: { order: SharedOrder; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [aName, setAName] = useState("");
  const [aPhone, setAPhone] = useState("");
  const [aCountry, setACountry] = useState<(typeof COUNTRIES)[number]["id"]>("US");
  const [copied, setCopied] = useState(false);

  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/tickets/share/${order.shareToken}` : "";
  const guestSeats = order.seats.filter((s) => !s.isBuyerSeat);
  const open = guestSeats.filter((s) => s.holderStatus === "unassigned").length;
  const pending = guestSeats.filter((s) => s.holderStatus === "pending");
  const upcoming = isUpcoming(order.event?.date);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed. Long-press the link to copy it.");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: order.event?.title, text: `I got you a ticket for ${order.event?.title}! Claim it here:`, url: shareUrl });
      } catch {
        /* user closed the share sheet */
      }
    } else void copy();
  };

  const decide = async (seat: Seat, action: "accept" | "reject") => {
    setBusy(seat._id);
    try {
      await api.patch(`/tickets/seats/${seat._id}/holder`, { action });
      toast.success(action === "accept" ? `${seat.holderName} is in!` : "Request declined, ticket is open again");
      await onChange();
    } catch (err: unknown) {
      toast.error(apiMessage(err, "Could not update"));
      await onChange();
    } finally {
      setBusy(null);
    }
  };

  const assign = async (seat: Seat) => {
    const digits = aPhone.replace(/\D/g, "");
    if (aName.trim().length < 2 || digits.length < 8) {
      toast.error("Enter their full name and mobile number");
      return;
    }
    setBusy(seat._id);
    try {
      const code = COUNTRIES.find((c) => c.id === aCountry)!.code;
      await api.post(`/tickets/seats/${seat._id}/assign`, { name: aName.trim(), phone: `${code}${digits}` });
      toast.success(`Ticket given to ${aName.trim()}`);
      setAssigning(null);
      setAName("");
      setAPhone("");
      await onChange();
    } catch (err: unknown) {
      toast.error(apiMessage(err, "Could not assign ticket"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold inline-flex items-center gap-2">
          <Users className="w-4 h-4 text-[#C8A96A]" /> Your guests
        </p>
        <p className="text-[11px] text-white/50">
          {guestSeats.length - open} of {guestSeats.length} given out
          {pending.length > 0 && <span className="text-amber-300"> · {pending.length} waiting for you</span>}
        </p>
      </div>

      {upcoming && open > 0 && (
        <div className="rounded-xl border border-[#C8A96A]/30 bg-[#C8A96A]/5 p-3 space-y-2">
          <p className="text-[11px] text-white/70">
            Send this link to your friends. They verify their phone, enter their name, and you accept them here.
          </p>
          <div className="flex gap-2">
            <input readOnly value={shareUrl} onFocus={(e) => e.target.select()} className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono text-white/80" />
            <button onClick={copy} className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg border border-white/15 text-[11px] hover:bg-white/5 cursor-pointer">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            <button onClick={share} className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg bg-[#C8A96A] text-[#0d1612] text-[11px] font-bold cursor-pointer">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>
        </div>
      )}

      <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
        {order.seats.map((s, i) => (
          <li key={s._id} className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {s.isBuyerSeat ? "You" : s.holderStatus === "unassigned" ? `Open ticket #${i + 1}` : s.holderName}
                </p>
                <p className="text-[11px] text-white/45 truncate">
                  {s.tierName}
                  {s.holderPhone && !s.isBuyerSeat ? ` · ${s.holderPhone}` : ""}
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-2">
                {s.checkedIn ? (
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Inside
                  </span>
                ) : s.holderStatus === "accepted" ? (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                    {s.isBuyerSeat ? "Your ticket" : "Accepted"}
                  </span>
                ) : s.holderStatus === "pending" && upcoming ? (
                  <>
                    <button
                      disabled={busy === s._id}
                      onClick={() => decide(s, "reject")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full border border-rose-400/40 text-rose-300 text-[11px] font-bold hover:bg-rose-500/10 disabled:opacity-50 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                    <button
                      disabled={busy === s._id}
                      onClick={() => decide(s, "accept")}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-500 text-black text-[11px] font-bold hover:bg-emerald-400 disabled:opacity-50 cursor-pointer"
                    >
                      {busy === s._id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Accept
                    </button>
                  </>
                ) : s.holderStatus === "unassigned" && upcoming ? (
                  <button
                    onClick={() => setAssigning(assigning === s._id ? null : s._id)}
                    className="inline-flex items-center gap-1 text-[11px] text-[#C8A96A] hover:text-[#E0C68E] cursor-pointer"
                  >
                    <UserPlus className="w-3.5 h-3.5" /> Add by phone
                  </button>
                ) : (
                  <span className="text-[11px] text-white/40">{s.holderStatus === "unassigned" ? "Not claimed" : "Pending"}</span>
                )}
              </div>
            </div>

            {assigning === s._id && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void assign(s);
                }}
                className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr_auto] gap-2"
              >
                <input
                  autoFocus
                  value={aName}
                  onChange={(e) => setAName(e.target.value)}
                  placeholder="Full name"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs outline-none focus:border-[#C8A96A]"
                />
                <select
                  value={aCountry}
                  onChange={(e) => setACountry(e.target.value as (typeof COUNTRIES)[number]["id"])}
                  className="bg-black/40 border border-white/10 rounded-lg px-2 py-2 text-xs"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="numeric"
                  value={aPhone}
                  onChange={(e) => setAPhone(e.target.value.replace(/[^\d\s()-]/g, "").slice(0, 16))}
                  placeholder="Mobile number"
                  className="bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-[#C8A96A]"
                />
                <button
                  type="submit"
                  disabled={busy === s._id}
                  className="px-3 py-2 rounded-lg bg-[#C8A96A] text-[#0d1612] text-[11px] font-bold disabled:opacity-50 cursor-pointer"
                >
                  {busy === s._id ? "Saving…" : "Give ticket"}
                </button>
                <p className="sm:col-span-4 text-[10px] text-white/40">They sign in with this number to see their live QR.</p>
              </form>
            )}
          </li>
        ))}
      </ul>

      {order.guestCancelDeadline && (
        <p className="text-[10px] text-white/40">
          Guests can give their ticket back until{" "}
          {new Date(order.guestCancelDeadline).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}{" "}
          (48h after purchase). You&apos;ll be notified and the ticket comes back to you.
        </p>
      )}
    </div>
  );
}

/* ───────────────────────── Holder: one ticket row ───────────────────────── */

function TicketRow({ t, onChange }: { t: MyTicket; onChange: () => Promise<void> }) {
  const [showQr, setShowQr] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const cancel = async () => {
    const pending = t.holderStatus === "pending";
    if (!window.confirm(pending ? "Withdraw your request?" : `Give this ticket back to ${t.guestOf}? This can't be undone.`)) return;
    setCancelling(true);
    try {
      const { data } = await api.post(`/tickets/seats/${t._id}/cancel`);
      toast.success(data.message || "Cancelled");
      await onChange();
    } catch (err: unknown) {
      toast.error(apiMessage(err, "Could not cancel"));
    } finally {
      setCancelling(false);
    }
  };

  return (
    <li className="px-5 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">
            {t.tierName}
            {t.guestOf && <span className="text-white/45 font-normal"> · from {t.guestOf}</span>}
          </p>
          <p className="text-[11px] font-mono text-white/40">{t.ticketCode}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {t.checkedIn ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5" /> Checked in
            </span>
          ) : t.holderStatus === "pending" ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-amber-300">
              <Hourglass className="w-3.5 h-3.5" /> Waiting for {t.guestOf}
            </span>
          ) : t.isLegacy && t.qrCodeToken ? (
            <Link
              href={`/tickets/${t.qrCodeToken}`}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-3 py-1.5 rounded-full"
            >
              <QrCode className="w-3.5 h-3.5" /> View pass
            </Link>
          ) : (
            <button
              onClick={() => setShowQr((v) => !v)}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#0d1612] bg-[#C8A96A] hover:bg-[#E0C68E] px-3 py-1.5 rounded-full cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5" /> {showQr ? "Hide QR" : "Show QR"}
            </button>
          )}
        </div>
      </div>

      {showQr && !t.checkedIn && (
        <div className="py-2">
          <LiveTicketQr ticketId={t._id} size={200} />
        </div>
      )}

      {t.canCancel && (
        <div className="flex items-center justify-between gap-3 text-[10px] text-white/40">
          <span>
            {t.cancelDeadline
              ? `You can cancel until ${new Date(t.cancelDeadline).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}`
              : ""}
          </span>
          <button onClick={cancel} disabled={cancelling} className="text-rose-300 hover:text-rose-200 underline underline-offset-2 cursor-pointer disabled:opacity-50">
            {cancelling ? "Cancelling…" : t.holderStatus === "pending" ? "Withdraw request" : "Cancel ticket"}
          </button>
        </div>
      )}
    </li>
  );
}

/* ───────────────────────── Page ───────────────────────── */

export default function UserTicketsPage() {
  const [tickets, setTickets] = useState<MyTicket[] | null>(null);
  const [sharedOrders, setSharedOrders] = useState<SharedOrder[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = () =>
    api
      .get("/tickets/my")
      .then(({ data }) => {
        setTickets(data.tickets || []);
        setSharedOrders(data.sharedOrders || []);
      })
      .catch(() => setError("Could not load your tickets. Please refresh."));

  useEffect(() => {
    void load();
    // Pick up new guest requests / acceptances without a manual refresh
    const id = setInterval(() => void load(), 30000);
    return () => clearInterval(id);
  }, []);

  const groups = useMemo(() => {
    const map = new Map<string, { event: EventInfo; tickets: MyTicket[]; upcoming: boolean }>();
    for (const t of tickets || []) {
      if (!t.event) continue;
      if (!map.has(t.event._id)) map.set(t.event._id, { event: t.event, tickets: [], upcoming: isUpcoming(t.event.date) });
      map.get(t.event._id)!.tickets.push(t);
    }
    return [...map.values()].sort((a, b) =>
      a.upcoming !== b.upcoming
        ? Number(b.upcoming) - Number(a.upcoming)
        : (new Date(a.event.date).getTime() - new Date(b.event.date).getTime()) * (a.upcoming ? 1 : -1)
    );
  }, [tickets]);

  const ordersByEvent = useMemo(() => {
    const m = new Map<string, SharedOrder[]>();
    for (const o of sharedOrders) if (o.event) m.set(o.event._id, [...(m.get(o.event._id) || []), o]);
    return m;
  }, [sharedOrders]);

  const pendingTotal = sharedOrders.reduce((n, o) => n + o.seats.filter((s) => s.holderStatus === "pending").length, 0);

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto text-white space-y-8">
      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">My Account</p>
        <h1 className="text-3xl font-headline italic">My Event Tickets</h1>
        <p className="text-xs text-white/50 mt-1">Open your live QR at the door. It changes every 5 minutes, so screenshots stop working.</p>
        {pendingTotal > 0 && (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-amber-200 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
            <Hourglass className="w-3.5 h-3.5" /> {pendingTotal} guest request{pendingTotal === 1 ? "" : "s"} waiting for you
          </p>
        )}
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

      {groups.map((g) => {
        const legacyGroups = [...new Set(g.tickets.filter((t) => t.legacyGroupQrToken).map((t) => t.legacyGroupQrToken!))];
        return (
          <section key={g.event._id} className={`rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden ${g.upcoming ? "" : "opacity-70"}`}>
            <EventHeader event={g.event}>
              <span
                className={`inline-block text-[9px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${
                  g.upcoming ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-white/50"
                }`}
              >
                {g.upcoming ? "Upcoming" : "Past event"}
              </span>
            </EventHeader>

            <ul className="divide-y divide-white/5">
              {g.tickets.map((t) => (
                <TicketRow key={t._id} t={t} onChange={load} />
              ))}
            </ul>

            {legacyGroups.map((tok) => (
              <div key={tok} className="px-5 pb-3">
                <Link href={`/tickets/group/${tok}`} className="text-[11px] text-[#C8A96A] underline underline-offset-2">
                  Open group QR
                </Link>
              </div>
            ))}

            {(ordersByEvent.get(g.event._id) || []).map((o) => (
              <div key={o.orderId} className="border-t border-white/10">
                <GuestManager order={o} onChange={load} />
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
