"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Clock, XCircle, AlertTriangle } from "lucide-react";
import api from "@/lib/axios";
import { formatTimeTo12Hour } from "@/lib/utils";

/**
 * Public return page for the deposit link the Instagram / Facebook AI assistant sends.
 * The customer isn't logged in, so this calls the public /ai/booking/status endpoint, which
 * confirms the booking with Stripe and returns non-sensitive details.
 */

type Status = "confirmed" | "awaiting_payment" | "expired" | "cancelled" | "paid_needs_review";

interface Info {
  status: Status;
  ref: string;
  firstName: string;
  date: string;
  time: string;
  durationHours: number;
  guests: number;
  total: number;
  deposit: number;
  balance: number;
}

const prettyDate = (ymd: string) =>
  new Date(`${ymd}T12:00:00Z`).toLocaleDateString("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

export default function AiBookingPaidPage() {
  const params = useSearchParams();
  const bookingId = params.get("bookingId") || "";
  const sessionId = params.get("session_id") || "";
  const cancelled = params.get("cancelled") === "1";
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState("");
  const tries = useRef(0);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = async () => {
      try {
        const { data } = await api.get("/ai/booking/status", { params: { bookingId, session_id: sessionId || undefined } });
        setInfo(data);
        // Stripe can take a few seconds to mark the payment — poll briefly after a successful return
        if (data.status === "awaiting_payment" && sessionId && !cancelled && tries.current < 10) {
          tries.current += 1;
          timer = setTimeout(load, 3000);
        }
      } catch {
        setError("We couldn't find this booking. Please message us on Instagram or call 1 866-990-7422.");
      }
    };
    if (bookingId) load();
    else setError("Missing booking reference.");
    return () => clearTimeout(timer);
  }, [bookingId, sessionId, cancelled]);

  const end = info ? formatTimeTo12Hour(addHours(info.time, info.durationHours)) : "";

  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-[#C8A96A]/20 bg-[#0d1612]/60 p-6 sm:p-8 text-center">
        {!info && !error && <p className="text-white/70">Checking your payment…</p>}
        {error && (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <p className="mt-4 text-white/80">{error}</p>
          </>
        )}

        {info && info.status === "confirmed" && (
          <>
            <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-400" />
            <h1 className="mt-4 font-headline text-3xl text-[#E8CB8A]">You&apos;re booked{info.firstName ? `, ${info.firstName}` : ""}!</h1>
            <p className="mt-2 text-white/70">Your deposit was received and Tropica is reserved for you.</p>
            <Details info={info} end={end} />
            {info.balance > 0 && (
              <p className="mt-4 text-sm text-white/60">
                The remaining ${info.balance.toFixed(2)} is due 72 hours before the event. We&apos;ve emailed your confirmation.
              </p>
            )}
          </>
        )}

        {info && info.status === "awaiting_payment" && (
          <>
            <Clock className="mx-auto h-12 w-12 text-[#E8CB8A]" />
            <h1 className="mt-4 font-headline text-2xl text-[#E8CB8A]">
              {cancelled ? "Payment not completed" : "Confirming your payment…"}
            </h1>
            <p className="mt-2 text-white/70">
              {cancelled
                ? "Your slot is still held for a short time. Use the payment link we sent in your DM to finish booking."
                : "This can take a few seconds. You'll also get a message in your DM as soon as it's confirmed."}
            </p>
            <Details info={info} end={end} />
          </>
        )}

        {info && (info.status === "expired" || info.status === "cancelled") && (
          <>
            <XCircle className="mx-auto h-12 w-12 text-red-400" />
            <h1 className="mt-4 font-headline text-2xl text-[#E8CB8A]">This hold has ended</h1>
            <p className="mt-2 text-white/70">
              The slot was released because the deposit wasn&apos;t paid in time. Message us again to check availability, or book online.
            </p>
            <Link href="/book-venue" className="mt-5 inline-block rounded-lg bg-[#C8A96A] px-5 py-2.5 font-bold text-[#0d1612]">
              Book the venue
            </Link>
          </>
        )}

        {info && info.status === "paid_needs_review" && (
          <>
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-400" />
            <h1 className="mt-4 font-headline text-2xl text-[#E8CB8A]">We received your payment</h1>
            <p className="mt-2 text-white/70">
              Your hold had already expired, so our team will confirm your date or refund you shortly. Questions: 1 866-990-7422.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const addHours = (hhmm: string, hours: number) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m + hours * 60) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
};

function Details({ info, end }: { info: Info; end: string }) {
  return (
    <div className="mt-6 space-y-2 rounded-xl border border-white/10 bg-white/5 p-4 text-left text-sm">
      <Row label="Booking" value={`#${info.ref}`} />
      <Row label="Date" value={prettyDate(info.date)} />
      <Row label="Time" value={`${formatTimeTo12Hour(info.time)} – ${end} (${info.durationHours}h)`} />
      <Row label="Guests" value={String(info.guests)} />
      <Row label="Total" value={`$${info.total.toFixed(2)}`} />
      <Row label="Deposit" value={`$${info.deposit.toFixed(2)}`} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-white/50">{label}</span>
      <span className="font-semibold text-white/90 text-right">{value}</span>
    </div>
  );
}
