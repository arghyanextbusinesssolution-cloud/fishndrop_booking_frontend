"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { MarketplacePayDialog } from "@/components/marketplace/MarketplacePayDialog";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Loader2,
  MapPin,
  PartyPopper,
  Store,
  Users,
  XCircle
} from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { VenueTheme } from "@/types";

interface MarketplaceBookingRow {
  _id: string;
  bookingNumber: string;
  venueName: string;
  venue?: { name: string; slug: string; coverUrl?: string; logoUrl?: string; theme?: VenueTheme; address?: string };
  date: string;
  startTime: string;
  endTime: string;
  durationHours?: number;
  guests: number;
  occasion?: string;
  packageName?: string;
  status: string;
  customerPrice: number;
  regularPrice?: number;
  depositAmount: number;
  depositPct?: number;
  amountPaid: number;
  remainingAmount: number;
  declineReason?: string;
  paymentLinkExpiresAt?: string;
  payments?: { status: string; paymentType: string }[];
  createdAt: string;
}

type Tone = "amber" | "sky" | "emerald" | "rose" | "muted";

const STATUS: Record<string, { label: string; tone: Tone; hint: string; step: number }> = {
  requested: { label: "Awaiting venue", tone: "amber", hint: "The venue is checking your date — usually within 24 hours. Nothing is charged yet.", step: 1 },
  availability_confirmed: { label: "Ready to pay", tone: "sky", hint: "Good news — your date is available. Pay to lock it in.", step: 2 },
  deposit_paid: { label: "Confirmed", tone: "emerald", hint: "Your booking is confirmed. The balance is due before your event.", step: 3 },
  paid: { label: "Confirmed · paid", tone: "emerald", hint: "You're all set — see you there!", step: 3 },
  completed: { label: "Completed", tone: "muted", hint: "Hope you had a great time!", step: 4 },
  declined: { label: "Not available", tone: "rose", hint: "The venue couldn't host this date. Nothing was charged.", step: 0 },
  expired: { label: "Payment link expired", tone: "muted", hint: "The payment window closed. Send a new request to try again.", step: 0 },
  cancelled: { label: "Cancelled", tone: "muted", hint: "This booking was cancelled.", step: 0 }
};

const TONE: Record<Tone, string> = {
  amber: "bg-amber-500/15 text-amber-300 border-amber-400/30",
  sky: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/30",
  rose: "bg-rose-500/15 text-rose-300 border-rose-400/30",
  muted: "bg-white/5 text-white/60 border-white/10"
};

const STEPS = ["Requested", "Venue confirmed", "Paid", "Event day"];
const ACTIVE = ["requested", "availability_confirmed", "deposit_paid", "paid"];

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const time12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
};

type Tab = "active" | "past";

export default function UserMarketplaceBookingsPage() {
  const params = useSearchParams();
  const router = useRouter();
  const highlightId = params.get("pay") || params.get("paid");
  const [bookings, setBookings] = useState<MarketplaceBookingRow[] | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("active");
  const [payFor, setPayFor] = useState<MarketplaceBookingRow | null>(null);
  const verifiedRedirect = useRef(false);

  const replaceBooking = useCallback((updated: MarketplaceBookingRow) => {
    setBookings((list) => list?.map((b) => (b._id === updated._id ? updated : b)) ?? null);
  }, []);

  const afterPayment = useCallback(
    (updated: unknown, status: "succeeded" | "processing") => {
      setPayFor(null);
      const b = updated as MarketplaceBookingRow | null;
      if (b) replaceBooking(b);
      if (b?.status === "cancelled") {
        toast.error("Sorry — someone booked this time moments before you. You've been refunded in full.", { duration: 9000 });
      } else if (status === "processing" || !b) {
        toast("Payment received — we're confirming it with your bank. This page will update shortly.", { icon: "⏳", duration: 7000 });
      } else {
        const firstPayment = b.payments ? b.payments.filter((p) => p.status === "succeeded").length <= 1 : true;
        if (firstPayment) {
          // Just like a Tropica party: open the celebration with its invite link ready to share.
          toast.success("You're booked! 🎉 Now invite your guests.", { duration: 6000 });
          router.push(`/user/celebrations/${b._id}?share=1`);
        } else {
          toast.success("Paid in full — you're all set! 🎉", { duration: 6000 });
        }
      }
    },
    [replaceBooking, router]
  );

  // Back from a bank's 3-D Secure page: Stripe appends ?payment_intent=…&redirect_status=…
  useEffect(() => {
    const paidId = params.get("paid");
    const pi = params.get("payment_intent");
    if (!paidId || !pi || verifiedRedirect.current) return;
    verifiedRedirect.current = true;
    if (params.get("redirect_status") === "failed") {
      toast.error("Your bank didn't approve the payment. Please try again.");
      return;
    }
    api
      .post(`/marketplace/requests/${paidId}/verify-payment`, { paymentIntentId: pi })
      .then(({ data }) => afterPayment(data.booking, data.status))
      .catch(() => afterPayment(null, "processing"));
  }, [params, afterPayment]);

  useEffect(() => {
    let cancelled = false;
    api
      .get("/marketplace/requests/my")
      .then(({ data }) => !cancelled && setBookings(data.bookings || []))
      .catch(() => !cancelled && setError(true));
    return () => {
      cancelled = true;
    };
  }, []);

  const { active, past } = useMemo(() => {
    const list = bookings || [];
    return {
      active: list.filter((b) => ACTIVE.includes(b.status)),
      past: list.filter((b) => !ACTIVE.includes(b.status))
    };
  }, [bookings]);
  const shown = tab === "active" ? active : past;

  return (
    <div className="max-w-6xl mx-auto px-5 py-8 md:p-12 space-y-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-5">
        <div className="space-y-2">
          <span className="font-label text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">Partner Venues</span>
          <h1 className="font-headline text-3xl md:text-5xl italic text-white leading-tight">Your venue bookings</h1>
          <p className="text-sm text-white/60 max-w-xl">
            Requests and bookings at Tropica partner venues. We&apos;ll email you at every step.
          </p>
        </div>
        <Link
          href="/book-venue"
          className="inline-flex items-center gap-2 rounded-full bg-gold-gradient text-[#0d1612] px-6 py-3 font-label text-[11px] font-bold uppercase tracking-[0.2em] shadow-lg hover:scale-[1.02] transition-transform"
        >
          Book a venue <ArrowRight className="w-4 h-4" />
        </Link>
      </header>

      {/* Tabs */}
      {bookings && bookings.length > 0 && (
        <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
          {(
            [
              { v: "active", label: "Active", n: active.length },
              { v: "past", label: "Past & closed", n: past.length }
            ] as const
          ).map((t) => (
            <button
              key={t.v}
              type="button"
              onClick={() => setTab(t.v)}
              className={cn(
                "rounded-full px-5 py-2 font-label text-[11px] font-bold uppercase tracking-wider transition-colors",
                tab === t.v ? "bg-[#C8A96A] text-[#0d1612]" : "text-white/60 hover:text-white"
              )}
            >
              {t.label}
              {t.n > 0 && <span className={cn("ml-2 rounded-full px-1.5 text-[10px]", tab === t.v ? "bg-black/15" : "bg-white/10")}>{t.n}</span>}
            </button>
          ))}
        </div>
      )}

      {/* States */}
      {!bookings && !error && (
        <div className="flex items-center justify-center py-24 text-white/60 gap-2 text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-[#C8A96A]" /> Loading your bookings…
        </div>
      )}
      {error && (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-500/5 p-6 text-sm text-rose-200">
          Couldn&apos;t load your bookings. Please refresh the page.
        </div>
      )}
      {bookings && shown.length === 0 && (
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] px-6 py-16 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6 text-[#C8A96A]" />
          </div>
          <h2 className="font-headline text-2xl italic text-white">
            {bookings.length === 0 ? "No partner venue bookings yet" : tab === "active" ? "No active bookings" : "Nothing here yet"}
          </h2>
          <p className="text-sm text-white/55 max-w-md mx-auto">
            Pick a date in Book the Venue and choose one of our partner venues — rooftops, lounges, gardens and more.
          </p>
          <Link href="/book-venue" className="inline-flex items-center gap-2 text-[#C8A96A] font-label text-[11px] font-bold uppercase tracking-[0.2em]">
            Explore venues <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Cards */}
      <div className="space-y-6">
        {shown.map((b) => (
          <BookingCard key={b._id} b={b} highlighted={b._id === highlightId} onPay={() => setPayFor(b)} />
        ))}
      </div>

      {payFor && <MarketplacePayDialog booking={payFor} onClose={() => setPayFor(null)} onPaid={afterPayment} />}
    </div>
  );
}

const BookingCard = ({ b, highlighted, onPay }: { b: MarketplaceBookingRow; highlighted: boolean; onPay: () => void }) => {
  const s = STATUS[b.status] || { label: b.status, tone: "muted" as Tone, hint: "", step: 0 };
  const accent = b.venue?.theme?.primary || "#C8A96A";
  const name = b.venue?.name || b.venueName;
  const closed = s.step === 0;
  const dueNow = b.status === "availability_confirmed" ? b.depositAmount : b.status === "deposit_paid" ? b.remainingAmount : 0;

  return (
    <article
      className={cn(
        "rounded-3xl border bg-white/[0.03] overflow-hidden grid md:grid-cols-[300px_1fr] transition-shadow",
        highlighted ? "border-[#C8A96A]/60 shadow-[0_0_40px_rgba(200,169,106,0.15)]" : "border-white/10"
      )}
    >
      {/* Cover */}
      <div
        className="relative h-44 md:h-auto min-h-[180px] bg-cover bg-center"
        style={
          b.venue?.coverUrl
            ? { backgroundImage: `url(${b.venue.coverUrl})` }
            : { background: `linear-gradient(135deg, ${b.venue?.theme?.background || "#0F3D2E"}, ${accent})` }
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-1" style={{ background: accent }} />
        <div className="absolute bottom-4 left-4 right-4 flex items-end gap-3">
          {b.venue?.logoUrl ? (
            <img src={b.venue.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/80 bg-white shrink-0" />
          ) : (
            <span className="w-12 h-12 rounded-full flex items-center justify-center font-headline text-xl text-white border-2 border-white/70 shrink-0" style={{ background: accent }}>
              {name.charAt(0).toUpperCase()}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-headline text-2xl text-white leading-tight truncate capitalize">{name}</h2>
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Booked via Tropica</p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-5 md:p-7 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wider", TONE[s.tone])}>
            {s.tone === "rose" ? <XCircle className="w-3 h-3" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
            {s.label}
          </span>
          <span className="text-[11px] text-white/35 font-mono">#{b.bookingNumber}</span>
        </div>

        {/* Progress */}
        {!closed && (
          <ol className="grid grid-cols-4 gap-2">
            {STEPS.map((label, i) => {
              const done = i < s.step;
              const current = i === s.step; // the next thing that has to happen
              return (
                <li key={label} className="space-y-1.5">
                  <div className={cn("h-1 rounded-full", done ? "bg-[#C8A96A]" : current ? "bg-[#C8A96A]/40" : "bg-white/10")} />
                  <p className={cn("text-[10px] uppercase tracking-wider flex items-center gap-1", done ? "text-[#C8A96A] font-bold" : "text-white/35")}>
                    {done && <Check className="w-3 h-3" />}
                    <span className="truncate">{label}</span>
                  </p>
                </li>
              );
            })}
          </ol>
        )}

        {/* Details */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          <Chip icon={<CalendarDays className="w-3.5 h-3.5" />} label="Date" value={format(new Date(`${b.date}T12:00:00`), "EEE, MMM d, yyyy")} />
          <Chip icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={`${time12(b.startTime)} – ${time12(b.endTime)}`} />
          <Chip icon={<Users className="w-3.5 h-3.5" />} label="Guests" value={`${b.guests} guests`} />
          {b.occasion ? (
            <Chip icon={<PartyPopper className="w-3.5 h-3.5" />} label="Occasion" value={b.occasion.replace(/_/g, " ")} />
          ) : (
            <Chip icon={<MapPin className="w-3.5 h-3.5" />} label="Where" value={b.venue?.address || "—"} />
          )}
        </div>
        {b.occasion && b.venue?.address && (
          <p className="text-xs text-white/50 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" /> {b.venue.address}
          </p>
        )}

        {/* Price + next step */}
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Total</p>
            <p className="font-headline text-2xl text-white">
              {money(b.customerPrice)}
              {b.regularPrice && b.regularPrice > b.customerPrice && (
                <span className="ml-2 text-sm text-white/35 line-through">{money(b.regularPrice)}</span>
              )}
            </p>
            <p className="text-xs text-white/50">
              {b.amountPaid > 0 ? (
                <>
                  Paid {money(b.amountPaid)}
                  {b.remainingAmount > 0 && <> · Balance {money(b.remainingAmount)}</>}
                </>
              ) : (
                <>
                  {b.depositAmount < b.customerPrice ? `Deposit ${money(b.depositAmount)} to confirm` : "Paid in full to confirm"}
                </>
              )}
            </p>
          </div>

          {["deposit_paid", "paid", "completed"].includes(b.status) && (
            <Link
              href={`/user/celebrations/${b._id}`}
              className="inline-flex items-center gap-2 rounded-full border border-[#C8A96A]/50 text-[#E0C68E] px-5 py-3 font-label text-[11px] font-bold uppercase tracking-[0.15em] hover:bg-[#C8A96A]/10 transition-colors"
            >
              <PartyPopper className="w-4 h-4" /> Guest list & invites
            </Link>
          )}

          {dueNow > 0 && (
            <div className="text-right space-y-1.5">
              <button
                type="button"
                onClick={onPay}
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0d1612] px-7 py-3 font-label text-[11px] font-bold uppercase tracking-[0.15em] shadow-lg shadow-[#C8A96A]/25 hover:scale-[1.03] transition-transform"
              >
                <CreditCard className="w-4 h-4" /> {b.status === "deposit_paid" ? "Pay balance" : "Pay"} {money(dueNow)}
              </button>
              {b.status === "availability_confirmed" && b.paymentLinkExpiresAt && (
                <p className="text-[11px] text-amber-300/80">
                  Pay by {new Date(b.paymentLinkExpiresAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}
                </p>
              )}
            </div>
          )}
        </div>

        {(s.hint || b.declineReason) && (
          <p className={cn("text-sm", b.status === "declined" ? "text-rose-200/80" : "text-white/60")}>
            {b.status === "declined" && b.declineReason ? <>“{b.declineReason}” — {s.hint}</> : s.hint}
            {(b.status === "declined" || b.status === "expired") && (
              <>
                {" "}
                <Link href="/book-venue" className="text-[#C8A96A] underline">
                  Find another date or venue
                </Link>
              </>
            )}
          </p>
        )}
      </div>
    </article>
  );
};

const Chip = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2.5 min-w-0">
    <p className="text-[9px] uppercase tracking-[0.18em] text-white/40 flex items-center gap-1.5">
      <span className="text-[#C8A96A]">{icon}</span> {label}
    </p>
    <p className="text-sm text-white mt-0.5 truncate capitalize">{value}</p>
  </div>
);
