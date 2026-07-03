"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2, CalendarDays, Clock, Users, Sparkles, ShieldCheck, CreditCard } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const GOLD = "#E5C77A";
const DARK = "#0F2D23";

export default function UserPaymentConfirmedPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const paymentIntentId = searchParams.get("payment_intent") || "";
  const bookingIdFallback = searchParams.get("bookingId") || "";
  const { verifyCheckoutSession, verifyPaymentIntent, getBookingById, loading } = useBookings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  const runVerify = useCallback(async () => {
    if (attempted.current) return;
    attempted.current = true;
    try {
      if (sessionId) {
        const b = await verifyCheckoutSession(sessionId);
        setBooking(b);
      } else if (paymentIntentId) {
        const b = await verifyPaymentIntent(paymentIntentId);
        setBooking(b);
      } else if (bookingIdFallback) {
        const b = await getBookingById(bookingIdFallback);
        setBooking(b);
      }
    } catch {
      attempted.current = false;
      setError("We could not confirm this payment. Your card may have been declined, or the session expired.");
    }
  }, [sessionId, paymentIntentId, bookingIdFallback, verifyCheckoutSession, verifyPaymentIntent, getBookingById]);

  useEffect(() => {
    if (!sessionId && !paymentIntentId && !bookingIdFallback) return;
    const t = window.setTimeout(() => { void runVerify(); }, 300);
    return () => window.clearTimeout(t);
  }, [sessionId, paymentIntentId, bookingIdFallback, runVerify]);

  if (!sessionId && !paymentIntentId && !bookingIdFallback) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="font-semibold text-[var(--text-primary)]">Invalid confirmation link</p>
        <Link href="/user/bookings" className="mt-6 inline-flex w-full justify-center rounded-xl py-3 font-bold" style={{ background: GOLD, color: DARK }}>
          My bookings
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-[var(--surface)] p-8 text-center">
        <p className="font-semibold text-red-500">Payment not confirmed</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>
        <Link href="/user/bookings" className="mt-6 inline-flex w-full justify-center rounded-xl py-3 font-bold" style={{ background: GOLD, color: DARK }}>
          My bookings
        </Link>
      </div>
    );
  }

  if (loading || !booking) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <LoadingSpinner />
        <p className="text-sm text-[var(--text-secondary)]">Confirming your payment…</p>
      </div>
    );
  }

  const isPrivate = booking.bookingType === "private_event";
  // Determine if fully paid using the status flags from DB — not just remainingAmount
  const isFullyPaid = (booking as any).paymentStatus === "paid" || (booking as any).remainingPaymentStatus === "paid" || (booking.remainingAmount ?? 0) === 0;
  const depositPaid = booking.totalAmount - (booking.remainingAmount || 0);

  return (
    <div className="mx-auto max-w-2xl space-y-5 px-4 py-4">
      {/* Hero confirmation banner */}
      <div className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #0F2D23, #163D30)" }}>
        <div className="flex flex-col items-center px-8 py-10 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "rgba(229,199,122,0.15)", border: "2px solid #E5C77A" }}>
            <CheckCircle2 size={32} style={{ color: GOLD }} />
          </div>
          <h1 className="mt-5 text-3xl font-bold" style={{ color: GOLD }}>Payment confirmed</h1>
          <p className="mt-2 text-sm text-white/60">
            {isPrivate && !isFullyPaid
              ? "Your deposit is secured. Please pay the remaining balance 48 hours before your event."
              : isPrivate && isFullyPaid
                ? "Your venue is fully booked and confirmed. See you on the day!"
                : "Your table reservation is paid and secured."}
          </p>
        </div>
      </div>

      {/* Booking details card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Booking Details</p>
            <h2 className="mt-0.5 text-lg font-bold text-[var(--text-primary)]">
              {isPrivate ? "Exclusive Venue Reservation" : "Table Reservation"}
            </h2>
          </div>
          {isPrivate && (
            <span className="rounded-full px-3 py-1 text-xs font-bold" style={{ background: "rgba(229,199,122,0.12)", color: GOLD }}>
              Private Event
            </span>
          )}
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.08)" }}>
                <CalendarDays size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Date</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{format(new Date(booking.bookingDate), "PPP")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.08)" }}>
                <Clock size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Time</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.bookingTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.08)" }}>
                <Users size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">Guests</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.partySize} people</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.08)" }}>
                <Sparkles size={14} style={{ color: GOLD }} />
              </div>
              <div>
                <p className="text-xs text-[var(--text-secondary)]">{isPrivate ? "Venue" : "Tables"}</p>
                <p className="text-sm font-semibold text-[var(--text-primary)]">
                  {isPrivate
                    ? "Entire Venue Buyout"
                    : booking.tables?.length ? booking.tables.map((t) => `#${t.tableNumber}`).join(", ") : "—"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
            <p className="text-xs text-[var(--text-secondary)]">Guest</p>
            <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.customerName}</p>
          </div>
        </div>
      </div>

      {/* Payment breakdown card */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
        <div className="border-b border-[var(--border)] px-6 py-4 flex items-center gap-2">
          <CreditCard size={14} style={{ color: GOLD }} />
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Payment Summary</p>
        </div>
        <div className="px-6 py-5 space-y-3">
          {isPrivate ? (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Total Venue Cost</span>
                <span className="font-semibold text-[var(--text-primary)]">${booking.totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--text-secondary)]">Amount Paid</span>
                <span className="font-semibold text-emerald-500">
                  {isFullyPaid ? `$${booking.totalAmount.toLocaleString()}` : `$${depositPaid.toLocaleString()}`}
                </span>
              </div>
              {!isFullyPaid && (
                <div className="flex items-center justify-between text-sm rounded-lg px-3 py-2" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
                  <span className="text-red-400 font-medium">Remaining Balance</span>
                  <span className="font-bold text-red-400">${(booking.remainingAmount || 0).toLocaleString()} <span className="text-xs font-normal opacity-70">(Due 48 hrs before event)</span></span>
                </div>
              )}
              {isFullyPaid && (
                <div className="flex items-center justify-center gap-2 rounded-lg px-3 py-2" style={{ background: "rgba(229,199,122,0.08)", border: "1px solid rgba(229,199,122,0.2)" }}>
                  <ShieldCheck size={14} style={{ color: GOLD }} />
                  <span className="text-sm font-semibold" style={{ color: GOLD }}>Fully Paid — No Balance Due</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-between">
              <span className="font-bold text-[var(--text-primary)]">Total Paid</span>
              <span className="text-xl font-bold" style={{ color: GOLD }}>${booking.totalAmount.toLocaleString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/user/venue-bookings"
        className="flex w-full items-center justify-center rounded-xl py-4 text-base font-bold shadow-lg transition-all hover:brightness-90"
        style={{ background: GOLD, color: DARK }}
      >
        View My Venue Bookings
      </Link>
    </div>
  );
}
