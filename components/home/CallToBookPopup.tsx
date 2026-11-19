"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, Phone, X } from "lucide-react";

/**
 * Homepage popup: "Call us directly to book". Shows a few seconds after every page load;
 * closable (✕, "Maybe later", backdrop click or Escape) until the next reload.
 */

const PHONE_DISPLAY = "1-866-990-7422";
const PHONE_TEL = "tel:+18669907422";

export function CallToBookPopup({ delayMs = 3500 }: { delayMs?: number }) {
  const [open, setOpen] = useState(false);

  // Shows on every page load (closing it only hides it until the next reload / visit)
  useEffect(() => {
    const t = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  const close = () => setOpen(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="call-popup-title"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="assistant-pop relative w-full max-w-md overflow-hidden rounded-3xl border border-[#C8A96A]/40 bg-[#0d1612] text-center shadow-[0_0_60px_rgba(0,0,0,0.6)]"
      >
        <div className="h-1 bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent" />
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-8 pb-6 sm:px-8 space-y-5">
          <span className="assistant-pulse mx-auto w-16 h-16 rounded-full bg-[#C8A96A] text-[#0F3D2E] flex items-center justify-center">
            <Phone className="w-7 h-7" />
          </span>

          <div className="space-y-2 assistant-rise">
            <p className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Book with a real person</p>
            <h2 id="call-popup-title" className="font-headline italic text-3xl text-white">
              Call us directly to book
            </h2>
            <p className="text-sm text-white/70 leading-relaxed">
              Talk to our team to check your date, get pricing and reserve Tropica for your celebration — it only takes a few minutes.
            </p>
          </div>

          <div className="grid gap-2 assistant-stagger">
            <a
              href={PHONE_TEL}
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#C8A96A] text-[#0F3D2E] px-5 py-3.5 text-sm font-bold uppercase tracking-wider hover:brightness-110 transition"
            >
              <Phone className="w-4 h-4" /> Call {PHONE_DISPLAY}
            </a>
            <Link
              href="/book-venue"
              onClick={close}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#C8A96A]/40 text-white px-5 py-3 text-sm font-semibold hover:bg-white/5 transition"
            >
              <CalendarCheck className="w-4 h-4 text-[#C8A96A]" /> Book online instead
            </Link>
            <button type="button" onClick={close} className="py-2 text-xs text-white/50 hover:text-white">
              Maybe later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CallToBookPopup;
