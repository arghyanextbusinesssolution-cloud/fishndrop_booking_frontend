"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function UserPaymentFailedPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const reason = searchParams.get("reason") || "unknown";

  const title = reason === "cancelled" ? "Checkout cancelled" : "Payment did not go through";
  const body =
    reason === "cancelled"
      ? "You left Stripe’s payment page before finishing. Your reservation is still held, but it stays unpaid until you complete checkout."
      : "Your bank or Stripe may have declined the charge, or the session timed out. You can try again with another card or contact support.";

  const ctaClass = cn(
    buttonVariants({ variant: "default" }),
    "bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]"
  );
  const outlineClass = cn(buttonVariants({ variant: "outline" }));

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-2xl border border-amber-500/35 bg-amber-500/10 p-8 text-center">
        <XCircle className="mx-auto size-14 text-amber-700" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-[var(--text-primary)]">{title}</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">{body}</p>
      </div>

      <p className="text-center text-xs text-[var(--text-secondary)]">
        Card details are entered only on Stripe’s secure page—we never see your full card number.
      </p>

      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {bookingId ? (
          <Link href={`/user/payment?bookingId=${bookingId}`} className={cn(ctaClass, "inline-flex justify-center")}>
            Try payment again
          </Link>
        ) : null}
        <Link href="/user/bookings" className={cn(outlineClass, "inline-flex justify-center")}>
          My bookings
        </Link>
        <Link href="/user/book" className={cn(outlineClass, "inline-flex justify-center")}>
          New booking
        </Link>
      </div>
    </div>
  );
}
