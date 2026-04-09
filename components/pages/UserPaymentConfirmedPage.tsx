"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { CheckCircle2 } from "lucide-react";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function UserPaymentConfirmedPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id") || "";
  const bookingIdFallback = searchParams.get("bookingId") || "";
  const { verifyCheckoutSession, loading } = useBookings();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempted = useRef(false);

  const runVerify = useCallback(async () => {
    if (attempted.current) return;
    attempted.current = true;
    try {
      const b = await verifyCheckoutSession(sessionId);
      setBooking(b);
    } catch {
      attempted.current = false;
      setError("We could not confirm this payment. Your card may have been declined, or the session expired.");
    }
  }, [sessionId, verifyCheckoutSession]);

  useEffect(() => {
    if (!sessionId) return;
    const t = window.setTimeout(() => {
      void runVerify();
    }, 0);
    return () => window.clearTimeout(t);
  }, [sessionId, runVerify]);

  const ctaClass = cn(
    buttonVariants({ variant: "default" }),
    "bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]"
  );
  const outlineClass = cn(buttonVariants({ variant: "outline" }));

  if (!sessionId) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="font-semibold text-[var(--text-primary)]">Invalid confirmation link</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Open this page from the link Stripe shows after paying.</p>
        <Link href="/user/bookings" className={cn(ctaClass, "mt-6 inline-flex w-full justify-center")}>
          My bookings
        </Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-red-500/30 bg-[var(--surface)] p-8 text-center">
        <p className="font-semibold text-red-700">Payment not confirmed</p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{error}</p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
          {bookingIdFallback ? (
            <Link
              href={`/user/payment?bookingId=${bookingIdFallback}`}
              className={cn(ctaClass, "inline-flex justify-center")}
            >
              Try paying again
            </Link>
          ) : null}
          <Link href="/user/bookings" className={cn(outlineClass, "inline-flex justify-center")}>
            My bookings
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !booking) {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <LoadingSpinner />
        <p className="text-sm text-[var(--text-secondary)]">Confirming your payment…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto size-14 text-emerald-600" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">Payment confirmed</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Thank you. Your table reservation is paid and secured.
        </p>
      </div>

      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm">
        <p className="font-semibold text-[var(--text-primary)]">Reservation summary</p>
        <ul className="mt-4 space-y-2 text-[var(--text-secondary)]">
          <li><span className="font-medium text-[var(--text-primary)]">Guest name:</span> {booking.customerName}</li>
          <li><span className="font-medium text-[var(--text-primary)]">Date:</span> {format(new Date(booking.bookingDate), "PPP")}</li>
          <li><span className="font-medium text-[var(--text-primary)]">Time:</span> {booking.bookingTime}</li>
          <li><span className="font-medium text-[var(--text-primary)]">Party size:</span> {booking.partySize}</li>
          <li><span className="font-medium text-[var(--text-primary)]">Total paid:</span> ${booking.totalAmount}</li>
          <li>
            <span className="font-medium text-[var(--text-primary)]">Tables:</span>{" "}
            {booking.tables?.length ? booking.tables.map((t) => `#${t.tableNumber}`).join(", ") : "—"}
          </li>
        </ul>
      </div>

      <Link href="/user/bookings" className={cn(ctaClass, "inline-flex w-full justify-center")}>
        View my bookings
      </Link>
    </div>
  );
}
