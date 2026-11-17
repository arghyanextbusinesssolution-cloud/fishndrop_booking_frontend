"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AlertTriangle, Calendar, Check, Clock, Loader2, Music, Camera, Timer, Users } from "lucide-react";
import api from "@/lib/axios";
import { cn, formatBookingDate, formatTimeTo12Hour } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { MIN_PRIVATE_GUESTS } from "./StepPrivateGuests";
import { StepPhoneVerification } from "./StepPhoneVerification";
import { StepBirthday } from "./StepBirthday";
import StepPrivateSummary from "./StepPrivateSummary";

/**
 * /book-venue/complete/<bookingId> — opened from the link the Tropica AI sends in an Instagram/Facebook DM.
 * Everything the customer told the AI is already filled in; they only:
 *   1. verify their phone (creates / signs in their account),
 *   2. optionally add their birthday,
 *   3. pay the deposit → redirected to their account like any website booking.
 */

interface AiDraft {
  bookingId: string;
  status: "held" | "hold_expired_still_free" | "expired" | "completed" | "cancelled";
  holdExpiresAt: string;
  date: string;
  dateLabel: string;
  startTime: string;
  durationHours: number;
  guests: number;
  seating?: string;
  occasion?: string;
  needDj: boolean;
  needPhotographer: boolean;
  photographerHours: number;
  fullName?: string;
  phone?: string;
  email?: string;
  notes?: string;
  quote: { base: number; extraHours: number; extraHoursCost: number; dj: number; photographer: number; total: number; deposit: number; balance: number };
}

const STEPS = [
  { key: "verify", title: "Verify phone" },
  { key: "birthday", title: "Birthday" },
  { key: "checkout", title: "Pay deposit" }
] as const;

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

const endLabel = (start: string, hours: number) => {
  const [h, m] = start.split(":").map(Number);
  const end = (h + hours) % 24;
  return formatTimeTo12Hour(`${String(end).padStart(2, "0")}:${String(m || 0).padStart(2, "0")}`);
};

export default function AiBookingCheckout() {
  const params = useParams<{ code: string }>();
  const code = String(params?.code || "").toUpperCase();
  const { user } = useAuthStore();

  const [draft, setDraft] = useState<AiDraft | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [guest, setGuest] = useState({ name: "", email: "", phone: "", dateOfBirth: "" });
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let cancelled = false;
    api
      .get(`/ai/bookings/draft/${encodeURIComponent(code)}`)
      .then(({ data }) => {
        if (cancelled) return;
        const d: AiDraft = data.draft;
        setDraft(d);
        setGuest({ name: d.fullName || "", email: d.email || "", phone: d.phone || "", dateOfBirth: user?.dateOfBirth || "" });
      })
      .catch((err) => !cancelled && setLoadError(err?.response?.data?.message || "This booking link has expired or doesn't exist."));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Countdown for the 30-minute hold
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const secondsLeft = draft ? Math.max(0, Math.floor((new Date(draft.holdExpiresAt).getTime() - now) / 1000)) : 0;

  // Same shape the website wizard hands to StepPrivateSummary
  const bookingData = useMemo(() => {
    if (!draft) return null;
    return {
      aiDraftCode: draft.bookingId,
      venueId: null,
      venue: null,
      date: draft.date, // "YYYY-MM-DD" — read without timezone shifts on both sides
      time: draft.startTime,
      guests: Math.max(MIN_PRIVATE_GUESTS, draft.guests),
      durationHours: draft.durationHours,
      occasion: draft.occasion || "celebration",
      needDj: draft.needDj,
      needPhotographer: draft.needPhotographer,
      photographerHours: draft.photographerHours || 2,
      cateringMenu: "none",
      selectedDishes: [],
      dishQuantities: {},
      cateringNotes: draft.notes || "",
      needDecoration: false,
      guestDetails: {
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        dateOfBirth: guest.dateOfBirth,
        notes: [draft.seating ? `Seating: ${draft.seating}` : "", draft.notes || "", `Booked via Tropica AI chat (${draft.bookingId})`].filter(Boolean).join("\n"),
        occasion: draft.occasion || "celebration",
        agreedToTransactional: true,
        agreedToMarketing: false,
        agreedToTerms: true
      }
    };
  }, [draft, guest]);

  const next = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setStep((s) => Math.max(0, s - 1));
  };

  if (loadError) {
    return (
      <Notice
        title="This booking link isn't active anymore"
        body={`${loadError} Booking links from our chat are kept for 1 hour. You can pick a date on our website or message us again.`}
      />
    );
  }
  if (!draft || !bookingData) {
    return (
      <p className="flex items-center justify-center gap-2 text-brand-fg/60 py-24">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading your booking…
      </p>
    );
  }
  if (draft.status === "completed") {
    return (
      <Notice
        ok
        title="This booking is already in progress"
        body="A booking was already created from this link. You'll find it in your account."
        cta={{ href: "/user/venue-bookings", label: "Go to my bookings" }}
      />
    );
  }
  if (draft.status === "expired" || draft.status === "cancelled") {
    return (
      <Notice
        title="This date is no longer held"
        body={`The 30-minute hold on booking ${draft.bookingId} ended and the time was taken, or the booking was replaced. Message us in the chat for new times, or pick a date on our website.`}
      />
    );
  }

  const holdActive = draft.status === "held" && secondsLeft > 0;
  const q = draft.quote;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Booking ID + hold timer */}
      <div className="text-center space-y-2">
        <p className="font-label text-[10px] uppercase tracking-[0.25em] text-brand font-bold">Your booking from our chat</p>
        <h1 className="font-headline text-2xl md:text-3xl text-brand-fg">Booking ID {draft.bookingId}</h1>
        <p
          className={cn(
            "inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold",
            holdActive ? "bg-brand/15 text-brand" : "bg-amber-500/15 text-amber-300"
          )}
        >
          <Timer className="w-3.5 h-3.5" />
          {holdActive
            ? `Date held for you · ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")} left`
            : "Hold ended — still open right now, complete payment to secure it"}
        </p>
      </div>

      {/* What they agreed to in the chat */}
      <div className="bg-brand-fg/5 border border-brand-fg/10 rounded-2xl p-4 sm:p-5 grid gap-3 sm:grid-cols-4 text-sm">
        <Fact icon={<Calendar className="w-4 h-4" />} label="Date" value={formatBookingDate(draft.date, { weekday: "short", month: "short", day: "numeric", year: "numeric" })} />
        <Fact
          icon={<Clock className="w-4 h-4" />}
          label="Time"
          value={`${formatTimeTo12Hour(draft.startTime)} – ${endLabel(draft.startTime, draft.durationHours)} (${draft.durationHours}h)`}
        />
        <Fact icon={<Users className="w-4 h-4" />} label="Guests" value={`${draft.guests}${draft.seating ? ` · ${draft.seating}` : ""}`} />
        <Fact
          icon={<Music className="w-4 h-4" />}
          label="Estimate"
          value={`${money(q.total)} · ${money(q.deposit)} deposit`}
        />
        {(draft.needDj || draft.needPhotographer) && (
          <p className="sm:col-span-4 text-xs text-brand-fg/60 flex flex-wrap gap-3">
            {draft.needDj && (
              <span className="inline-flex items-center gap-1">
                <Music className="w-3 h-3" /> DJ
              </span>
            )}
            {draft.needPhotographer && (
              <span className="inline-flex items-center gap-1">
                <Camera className="w-3 h-3" /> Photographer {draft.photographerHours}h
              </span>
            )}
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <span
              className={cn(
                "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2",
                i < step ? "bg-brand border-brand text-brand-ink" : i === step ? "border-brand text-brand" : "border-brand-fg/15 text-brand-fg/40"
              )}
            >
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </span>
            <span className={cn("text-[10px] uppercase tracking-wider font-bold", i <= step ? "text-brand" : "text-brand-fg/40")}>{s.title}</span>
            {i < STEPS.length - 1 && <span className="hidden sm:block w-8 h-px bg-brand-fg/15" />}
          </div>
        ))}
      </div>

      <div className="bg-background/40 backdrop-blur-md border border-brand-fg/5 rounded-2xl p-2.5 sm:p-6 md:p-8 shadow-2xl">
        {STEPS[step].key === "verify" && (
          <StepPhoneVerification
            initialPhone={guest.phone}
            initialName={guest.name}
            initialEmail={guest.email}
            onNext={(d) => {
              setGuest((g) => ({
                ...g,
                phone: d.phone,
                name: d.name || g.name,
                email: d.email || g.email || `guest_${d.phone.replace(/\D/g, "")}@tropica.nyc`
              }));
              next();
            }}
          />
        )}
        {STEPS[step].key === "birthday" && (
          <StepBirthday
            initialDob={guest.dateOfBirth}
            partyDate={draft.date}
            onNext={(d) => {
              if (d.guestDetails?.dateOfBirth) setGuest((g) => ({ ...g, dateOfBirth: d.guestDetails!.dateOfBirth }));
              next();
            }}
          />
        )}
        {STEPS[step].key === "checkout" && <StepPrivateSummary bookingData={bookingData} onBack={back} />}

        {STEPS[step].key !== "checkout" && step > 0 && (
          <div className="mt-6 pt-4 border-t border-brand-fg/10">
            <button
              type="button"
              onClick={back}
              className="text-brand-fg/60 hover:text-brand-fg font-label tracking-widest text-xs uppercase px-4 py-2 font-bold"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const Fact = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="space-y-0.5">
    <p className="text-[10px] uppercase tracking-widest text-brand-fg/40 flex items-center gap-1">
      <span className="text-brand">{icon}</span> {label}
    </p>
    <p className="text-brand-fg font-semibold">{value}</p>
  </div>
);

const Notice = ({ title, body, ok, cta }: { title: string; body: string; ok?: boolean; cta?: { href: string; label: string } }) => (
  <div className="max-w-md mx-auto text-center bg-brand-fg/5 border border-brand-fg/10 rounded-2xl p-8 space-y-4">
    <div className={cn("w-12 h-12 rounded-full mx-auto flex items-center justify-center", ok ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300")}>
      {ok ? <Check className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
    </div>
    <h1 className="font-headline text-2xl text-brand-fg">{title}</h1>
    <p className="text-sm text-brand-fg/70">{body}</p>
    <Link
      href={cta?.href || "/book-venue"}
      className="inline-flex rounded-full bg-brand text-brand-ink px-6 py-3 text-xs font-bold uppercase tracking-widest"
    >
      {cta?.label || "Book on our website"}
    </Link>
  </div>
);
