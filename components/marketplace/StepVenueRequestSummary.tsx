"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { CalendarDays, CheckCircle2, Clock, Loader2, MapPin, PartyPopper, Send, Users } from "lucide-react";
import api from "@/lib/axios";
import type { CustomerPrice, MarketplaceVenue } from "@/types";

interface Props {
  venue: MarketplaceVenue;
  data: {
    date: string | null;
    guests: number;
    time: string | null;
    endTime?: string;
    durationHours: number;
    packageId?: string;
    packageName?: string;
    price?: CustomerPrice;
    occasion: string;
    guestDetails: { name: string; email: string; phone: string; dateOfBirth?: string };
  };
}

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const label12 = (hhmm?: string | null) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
};

/**
 * Last step for a partner venue: no payment yet. The request goes to the venue owner, who
 * confirms availability; the customer then gets a payment link by email.
 */
export const StepVenueRequestSummary = ({ venue, data }: Props) => {
  const [notes, setNotes] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ bookingNumber: string } | null>(null);
  const price = data.price;

  const submit = async () => {
    if (!data.date || !data.time) return;
    setSubmitting(true);
    try {
      const { data: res } = await api.post("/marketplace/requests", {
        venueSlug: venue.slug,
        date: format(new Date(data.date), "yyyy-MM-dd"),
        startTime: data.time,
        hours: data.durationHours,
        packageId: data.packageId,
        guests: data.guests,
        customerName: data.guestDetails.name,
        customerEmail: data.guestDetails.email,
        customerPhone: data.guestDetails.phone,
        occasion: data.occasion,
        birthday: data.guestDetails.dateOfBirth,
        notes
      });
      setSubmitted({ bookingNumber: res.booking?.bookingNumber });
      if (res.duplicate) toast("You already requested this slot — we're on it.");
    } catch (err: unknown) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't send your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto text-center space-y-5 py-6">
        <CheckCircle2 className="w-14 h-14 text-brand mx-auto" />
        <h2 className="font-headline text-3xl text-brand-fg">Request sent!</h2>
        <p className="text-brand-fg/70 text-sm leading-relaxed">
          {venue.name} is confirming your date. As soon as they do, we&apos;ll email you a secure payment link to lock it in.
          Nothing is charged until then.
        </p>
        {submitted.bookingNumber && (
          <p className="text-xs uppercase tracking-widest text-brand-fg/50">
            Request <span className="text-brand font-bold">{submitted.bookingNumber}</span>
          </p>
        )}
        <Link
          href="/user/marketplace-bookings"
          className="inline-flex rounded-full bg-brand text-brand-ink px-8 py-3 font-label text-xs uppercase tracking-widest font-bold"
        >
          Track my request
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-5">
        <div
          className="relative h-44 rounded-2xl overflow-hidden bg-cover bg-center"
          style={
            venue.flyerUrl || venue.coverUrl
              ? { backgroundImage: `url(${venue.flyerUrl || venue.coverUrl})` }
              : { background: `linear-gradient(135deg, ${venue.theme.background}, ${venue.theme.primary})` }
          }
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
          <div className="absolute bottom-4 left-5 right-5 flex items-end gap-3">
            {venue.logoUrl && <img src={venue.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white/80" />}
            <div>
              <h2 className="font-headline text-2xl text-white">{venue.name}</h2>
              <p className="text-xs text-white/75 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {venue.address}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info icon={<CalendarDays className="w-4 h-4" />} label="Date" value={data.date ? format(new Date(data.date), "EEE, MMM d, yyyy") : ""} />
          <Info icon={<Clock className="w-4 h-4" />} label="Time" value={`${label12(data.time)} – ${label12(data.endTime)}`} />
          <Info icon={<Users className="w-4 h-4" />} label="Guests" value={String(data.guests)} />
          <Info icon={<PartyPopper className="w-4 h-4" />} label="Occasion" value={data.occasion?.replace(/_/g, " ") || "—"} />
        </div>

        <div className="rounded-xl border border-brand-fg/10 p-4 text-sm space-y-1">
          <p className="text-brand-fg font-semibold">{data.guestDetails.name}</p>
          <p className="text-brand-fg/60">{data.guestDetails.phone} · {data.guestDetails.email}</p>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs uppercase tracking-widest text-brand-fg/50">Anything the venue should know?</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Setup time, decorations, catering, accessibility…"
            className="w-full rounded-xl bg-brand-fg/5 border border-brand-fg/15 p-3 text-sm text-brand-fg placeholder:text-brand-fg/30 focus:border-brand outline-none"
          />
        </label>
      </div>

      <div className="rounded-2xl border border-brand-fg/10 bg-brand-fg/5 p-5 space-y-4 h-fit">
        <h3 className="font-headline text-xl text-brand-fg">Price estimate</h3>
        {price && (
          <div className="space-y-2 text-sm">
            <Row label={data.packageName || `${data.durationHours} hrs at ${venue.name}`} value={money(price.regularPrice)} />
            {price.customerSavings > 0 && <Row label="Tropica member discount" value={`− ${money(price.customerSavings)}`} accent />}
            <div className="border-t border-brand-fg/10 pt-2">
              <Row label="Total" value={money(price.customerPrice)} bold />
            </div>
            <Row
              label={price.depositPct < 100 ? `Due when confirmed (${price.depositPct}% deposit)` : "Due when confirmed"}
              value={money(price.depositAmount)}
            />
            {price.remainingAmount > 0 && <Row label="Balance before your event" value={money(price.remainingAmount)} muted />}
          </div>
        )}
        <ol className="text-xs text-brand-fg/60 space-y-1.5 list-decimal pl-4">
          <li>{venue.name} confirms your date (usually within 24 hours).</li>
          <li>You receive a secure payment link by email.</li>
          <li>Pay to lock in the venue — then it&apos;s yours.</li>
        </ol>
        {venue.cancellationPolicy && (
          <p className="text-[11px] text-brand-fg/50 leading-relaxed">Cancellation policy: {venue.cancellationPolicy}</p>
        )}
        <label className="flex items-start gap-2 text-xs text-brand-fg/70 cursor-pointer">
          <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 accent-[rgb(var(--brand))]" />
          <span>
            I agree to the venue rules and Tropica&apos;s{" "}
            <Link href="/terms-and-conditions" className="underline" target="_blank">
              terms
            </Link>
            .
          </span>
        </label>
        <button
          type="button"
          onClick={submit}
          disabled={!agreed || submitting || !price}
          className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-brand text-brand-ink py-3 font-label text-xs uppercase tracking-widest font-bold hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send booking request
        </button>
        <p className="text-[11px] text-center text-brand-fg/50">No payment is taken now.</p>
      </div>
    </div>
  );
};

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-brand-fg/10 p-3">
    <p className="text-[10px] uppercase tracking-widest text-brand-fg/50 flex items-center gap-1.5">
      <span className="text-brand">{icon}</span> {label}
    </p>
    <p className="text-brand-fg mt-1 capitalize">{value}</p>
  </div>
);

const Row = ({ label, value, bold, accent, muted }: { label: string; value: string; bold?: boolean; accent?: boolean; muted?: boolean }) => (
  <div className={`flex justify-between gap-4 ${muted ? "text-brand-fg/50" : "text-brand-fg/80"}`}>
    <span>{label}</span>
    <span className={bold ? "text-brand-fg font-bold" : accent ? "text-brand" : ""}>{value}</span>
  </div>
);

export default StepVenueRequestSummary;
