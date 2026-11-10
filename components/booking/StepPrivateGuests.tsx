"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useReducedMotion } from "framer-motion";
import { ArrowRight, Calendar, Minus, Plus, Users } from "lucide-react";
import { format } from "date-fns";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

export const MIN_PRIVATE_GUESTS = 10;

/* ───────── iPhone-style rolling digits ───────── */

function RollingDigit({ digit, height }: { digit: number; height: number }) {
  const reduce = useReducedMotion();
  return (
    <span className="relative inline-block overflow-hidden tabular-nums" style={{ height, width: "0.62em" }}>
      <motion.span
        className="absolute left-0 top-0 flex flex-col"
        initial={false}
        animate={{ y: -digit * height }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 26, mass: 0.7 }}
      >
        {Array.from({ length: 10 }, (_, n) => (
          <span key={n} className="flex items-center justify-center" style={{ height }}>
            {n}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

/** Number that rolls each digit like the iOS picker / clock. */
export function RollingNumber({ value, height, prefix = "" }: { value: number; height: number; prefix?: string }) {
  const digits = String(Math.max(0, Math.round(value))).split("").map(Number);
  return (
    <span className="inline-flex items-center leading-none" aria-label={`${prefix}${value}`} role="status">
      {prefix && <span aria-hidden>{prefix}</span>}
      {digits.map((d, i) => (
        // key from the right so units stay the same column when the length changes
        <RollingDigit key={digits.length - i} digit={d} height={height} />
      ))}
    </span>
  );
}

/* ───────── Step ───────── */

interface Props {
  onNext: (data: { guests: number }) => void;
  date: string | null;
  initialGuests: number;
}

export const StepPrivateGuests = ({ onNext, date, initialGuests }: Props) => {
  const [guests, setGuests] = useState(Math.max(MIN_PRIVATE_GUESTS, initialGuests || MIN_PRIVATE_GUESTS));
  const [maxCapacity, setMaxCapacity] = useState(40);
  const [perGuestPrice, setPerGuestPrice] = useState(50);
  const holdRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const bumpControls = useAnimationControls();
  const firstRender = useRef(true);

  // Small "tap" bounce on change without re-mounting the digits
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    void bumpControls.start({ scale: [0.95, 1], transition: { type: "spring", stiffness: 500, damping: 18 } });
  }, [guests, bumpControls]);

  useEffect(() => {
    api
      .get("/bookings/venue-capacity")
      .then(({ data }) => {
        if (!data?.success) return;
        const cap = data.totalCapacity || 40;
        setMaxCapacity(cap);
        setPerGuestPrice(data.perGuestPrice || 50);
        setGuests((g) => Math.min(cap, g));
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => () => stopHold(), []);

  const change = (delta: number) => {
    setGuests((g) => {
      const next = Math.min(maxCapacity, Math.max(MIN_PRIVATE_GUESTS, g + delta));
      if (next !== g) {
        if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate?.(8);
      }
      return next;
    });
  };

  /** Press and hold to keep counting, like iOS steppers. */
  const startHold = (delta: number) => {
    change(delta);
    stopHold();
    let ticks = 0;
    holdRef.current = setInterval(() => {
      ticks += 1;
      if (ticks > 3) change(delta);
    }, 110);
  };
  function stopHold() {
    if (holdRef.current) clearInterval(holdRef.current);
    holdRef.current = null;
  }

  const quick = [10, 15, 20, 25, 30, 35, 40].filter((n) => n <= maxCapacity);
  const dateLabel = date ? format(new Date(date), "EEEE, MMMM do") : "";
  const stepBtn =
    "w-16 h-16 rounded-full bg-white/10 hover:bg-[#C8A96A] hover:text-[#0d1612] disabled:opacity-20 disabled:hover:bg-white/10 disabled:hover:text-white disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors active:scale-90 select-none touch-none shadow-lg cursor-pointer";

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      <header className="space-y-3 text-center">
        <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Step 02 &bull; Party size</span>
        <h2 className="font-headline italic text-4xl md:text-5xl text-white leading-tight">
          How many <span className="text-gold-gradient">guests?</span>
        </h2>
        {dateLabel && (
          <span className="inline-flex items-center gap-1.5 text-[#C8A96A] font-semibold bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-3.5 py-1 rounded-full text-xs">
            <Calendar className="w-3.5 h-3.5" /> {dateLabel}
          </span>
        )}
      </header>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 sm:p-10 shadow-xl space-y-8">
        <div className="flex items-center justify-center gap-6 sm:gap-10">
          <button
            type="button"
            aria-label="Fewer guests"
            disabled={guests <= MIN_PRIVATE_GUESTS}
            onPointerDown={() => startHold(-1)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), change(-1))}
            className={stepBtn}
          >
            <Minus className="w-7 h-7" />
          </button>

          <div className="text-center min-w-[150px]">
            <motion.div
              animate={bumpControls}
              className="font-headline font-extrabold text-[#E8CB8A] drop-shadow-[0_0_24px_rgba(200,169,106,0.35)] text-[84px]"
            >
              <RollingNumber value={guests} height={96} />
            </motion.div>
            <p className="font-label text-[11px] uppercase tracking-widest text-white/45 font-bold flex items-center justify-center gap-1.5 -mt-1">
              <Users className="w-3.5 h-3.5 text-[#C8A96A]" /> Guests
            </p>
          </div>

          <button
            type="button"
            aria-label="More guests"
            disabled={guests >= maxCapacity}
            onPointerDown={() => startHold(1)}
            onPointerUp={stopHold}
            onPointerLeave={stopHold}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), change(1))}
            className={stepBtn}
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {quick.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setGuests(n);
              }}
              className={cn(
                "px-4 py-1.5 rounded-full text-xs font-label font-bold transition-all cursor-pointer",
                guests === n ? "bg-[#C8A96A] text-[#0d1612] scale-105 shadow-md shadow-[#C8A96A]/30" : "bg-white/5 text-white/60 hover:bg-white/15 hover:text-white"
              )}
            >
              {n}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-gradient-to-r from-[#C8A96A]/15 to-[#C8A96A]/5 border border-[#C8A96A]/30 px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#C8A96A]">Guests subtotal</p>
            <p className="text-xs text-white/60 font-mono">
              {guests} × ${perGuestPrice}
            </p>
          </div>
          <div className="font-headline text-3xl text-[#E8CB8A] font-bold">
            <RollingNumber value={guests * perGuestPrice} height={36} prefix="$" />
          </div>
        </div>

        <p className="text-[11px] text-center text-white/40">
          Minimum {MIN_PRIVATE_GUESTS} guests · up to {maxCapacity}. Press and hold + or − to count faster.
        </p>
      </div>

      <button
        type="button"
        onClick={() => onNext({ guests })}
        className="w-full inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-[0.2em] rounded-xl hover:scale-[1.02] transition-all shadow-xl shadow-[#C8A96A]/30 cursor-pointer"
      >
        Continue to time &amp; duration <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
};
