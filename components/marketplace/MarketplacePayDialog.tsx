"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { CalendarDays, Clock, Loader2, Lock, ShieldCheck, X } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/axios";
import { getStripe } from "@/lib/stripe";

const stripePromise = getStripe();

export interface PayableBooking {
  _id: string;
  bookingNumber: string;
  venueName: string;
  venue?: { name: string; logoUrl?: string; theme?: { primary?: string } };
  date: string;
  startTime: string;
  endTime: string;
  guests: number;
  customerPrice: number;
  amountPaid: number;
  remainingAmount: number;
  status: string;
}

interface Props {
  booking: PayableBooking;
  onClose: () => void;
  /** Called with the refreshed booking after the server has recorded the payment. */
  onPaid: (updated: unknown, status: "succeeded" | "processing") => void;
}

const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const time12 = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
};
const apiError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

/** Stripe card payment for a partner-venue booking (deposit, full price, or balance). */
export const MarketplacePayDialog = ({ booking, onClose, onPaid }: Props) => {
  const [intent, setIntent] = useState<{ clientSecret: string; amount: number; kind: "deposit" | "full" | "balance" } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api
      .post(`/marketplace/requests/${booking._id}/pay`)
      .then(({ data }) => !cancelled && setIntent({ clientSecret: data.clientSecret, amount: data.amount, kind: data.kind }))
      .catch((err) => !cancelled && setError(apiError(err, "Couldn't start the payment. Please try again.")));
    return () => {
      cancelled = true;
    };
  }, [booking._id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const name = booking.venue?.name || booking.venueName;
  const label = intent?.kind === "balance" ? "Remaining balance" : intent?.kind === "deposit" ? "Deposit to confirm" : "Pay in full to confirm";

  return (
    <div
      className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pay-title"
      onClick={() => !busy && onClose()}
    >
      <div className="w-full max-w-lg bg-[#0d1612] border border-white/10 rounded-3xl overflow-hidden shadow-2xl my-auto" onClick={(e) => e.stopPropagation()}>
        <div className="h-1" style={{ background: booking.venue?.theme?.primary || "#C8A96A" }} />
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              {booking.venue?.logoUrl ? (
                <img src={booking.venue.logoUrl} alt="" className="w-12 h-12 rounded-full object-cover border border-white/30 bg-white shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-[#C8A96A]/15 text-[#C8A96A] flex items-center justify-center font-headline text-xl shrink-0">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Secure payment</p>
                <h2 id="pay-title" className="font-headline text-2xl italic text-white truncate capitalize">
                  {name}
                </h2>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              aria-label="Close"
              className="w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white flex items-center justify-center shrink-0 disabled:opacity-30"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3 text-sm">
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-white/70">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-[#C8A96A]" /> {format(new Date(`${booking.date}T12:00:00`), "EEE, MMM d, yyyy")}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-[#C8A96A]" /> {time12(booking.startTime)} – {time12(booking.endTime)}
              </span>
            </div>
            <div className="border-t border-white/10 pt-3 space-y-1.5">
              <Row label="Booking total" value={money(booking.customerPrice)} />
              {booking.amountPaid > 0 && <Row label="Already paid" value={`− ${money(booking.amountPaid)}`} />}
              {intent && intent.kind === "deposit" && (
                <Row label="Balance due before your event" value={money(booking.customerPrice - intent.amount)} muted />
              )}
              <div className="flex justify-between items-baseline pt-1">
                <span className="text-white font-semibold">{intent ? label : "Due now"}</span>
                <span className="font-headline text-2xl text-[#C8A96A]">{intent ? money(intent.amount) : "…"}</span>
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">{error}</p>}

          {!error && !intent && (
            <div className="flex items-center justify-center gap-2 py-10 text-white/60 text-sm">
              <Loader2 className="w-5 h-5 animate-spin text-[#C8A96A]" /> Preparing secure payment…
            </div>
          )}

          {!error && intent && !stripePromise && (
            <p className="text-sm text-rose-300">Card payments aren&apos;t configured in this environment (missing Stripe publishable key).</p>
          )}

          {intent && stripePromise && (
            <Elements
              key={intent.clientSecret}
              stripe={stripePromise}
              options={{
                clientSecret: intent.clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#C8A96A",
                    colorBackground: "#0f1d17",
                    colorText: "#ffffff",
                    colorDanger: "#fb7185",
                    borderRadius: "10px",
                    fontSizeBase: "14px"
                  }
                }
              }}
            >
              <PayForm
                bookingId={booking._id}
                amount={intent.amount}
                onBusy={setBusy}
                onDone={async (paymentIntentId) => {
                  try {
                    const { data } = await api.post(`/marketplace/requests/${booking._id}/verify-payment`, { paymentIntentId });
                    onPaid(data.booking, data.status);
                  } catch {
                    // Stripe took the money; the webhook will record it even if this call failed.
                    onPaid(null, "processing");
                  }
                }}
              />
            </Elements>
          )}
        </div>
      </div>
    </div>
  );
};

const PayForm = ({
  bookingId,
  amount,
  onBusy,
  onDone
}: {
  bookingId: string;
  amount: number;
  onBusy: (b: boolean) => void;
  onDone: (paymentIntentId: string) => Promise<void>;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || paying) return;
    setError(null);
    setPaying(true);
    onBusy(true);
    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      // Only used by banks that need a redirect (3-D Secure); the page verifies on return.
      confirmParams: { return_url: `${window.location.origin}/user/marketplace-bookings?paid=${bookingId}` },
      redirect: "if_required"
    });
    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please check your card and try again.");
      setPaying(false);
      onBusy(false);
      return;
    }
    if (paymentIntent && (paymentIntent.status === "succeeded" || paymentIntent.status === "processing")) {
      await onDone(paymentIntent.id);
      return;
    }
    setError("Payment was not completed. Please try again.");
    setPaying(false);
    onBusy(false);
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3 text-[#E0C68E]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Card payment</span>
        </div>
        {!ready && (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#C8A96A]" />
          </div>
        )}
        <PaymentElement onReady={() => setReady(true)} options={{ layout: "tabs", wallets: { applePay: "auto", googlePay: "auto" } }} />
      </div>

      {error && <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={!stripe || !ready || paying}
        className="w-full py-3.5 rounded-full bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-[#C8A96A]/20 flex items-center justify-center gap-2 disabled:opacity-40"
      >
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {paying ? "Processing payment…" : `Pay ${money(amount)}`}
      </button>
      <p className="text-[10px] text-center text-white/40 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" /> Secured by Stripe · Your card details never touch Tropica&apos;s servers
      </p>
    </form>
  );
};

const Row = ({ label, value, muted }: { label: string; value: string; muted?: boolean }) => (
  <div className={`flex justify-between gap-4 ${muted ? "text-white/45" : "text-white/70"}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

export default MarketplacePayDialog;
