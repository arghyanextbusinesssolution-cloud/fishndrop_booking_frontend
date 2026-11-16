"use client";

import { ReactNode } from "react";
import { format } from "date-fns";

/** Shared bits for the partner (venue owner) portal pages. */

export interface OwnerBooking {
  _id: string;
  bookingNumber: string;
  status: "requested" | "availability_confirmed" | "deposit_paid" | "paid" | "completed" | "declined" | "expired" | "cancelled";
  date: string;
  startTime: string;
  endTime: string;
  durationHours: number;
  guests: number;
  packageName?: string;
  occasion?: string;
  notes?: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  regularPrice: number;
  venuePayout: number;
  amountPaid: number;
  remainingAmount: number;
  declineReason?: string;
  cancelReason?: string;
  paymentLinkExpiresAt?: string;
  respondedAt?: string;
  settlement?: { mode: "connect" | "manual"; status: "pending" | "transferred" | "paid_manually"; paidAt?: string };
  createdAt: string;
}

export const money = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const time12 = (hhmm?: string) => {
  if (!hhmm) return "";
  const [h, m] = hhmm.split(":").map(Number);
  return format(new Date(2000, 0, 1, h, m), "h:mm a");
};

/** "2026-11-26" → "Thu, Nov 26, 2026" without timezone drift. */
export const dateLabel = (ymd: string, pattern = "EEE, MMM d, yyyy") => format(new Date(`${ymd}T12:00:00`), pattern);

export const apiError = (err: unknown, fallback: string) =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;

export const STATUS_LABEL: Record<OwnerBooking["status"], { label: string; cls: string }> = {
  requested: { label: "Waiting for you", cls: "bg-sky-500/15 text-sky-300" },
  availability_confirmed: { label: "Confirmed · awaiting payment", cls: "bg-amber-500/15 text-amber-300" },
  deposit_paid: { label: "Booked · deposit paid", cls: "bg-emerald-500/15 text-emerald-300" },
  paid: { label: "Booked · paid in full", cls: "bg-emerald-500/15 text-emerald-300" },
  completed: { label: "Completed", cls: "bg-white/10 text-white/70" },
  declined: { label: "Declined", cls: "bg-rose-500/15 text-rose-300" },
  expired: { label: "Customer didn't pay in time", cls: "bg-white/10 text-white/60" },
  cancelled: { label: "Cancelled", cls: "bg-white/10 text-white/60" }
};

export const PortalHeader = ({ eyebrow = "Partner Portal", title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) => (
  <header className="flex flex-wrap items-end justify-between gap-4">
    <div className="space-y-1">
      <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">{eyebrow}</span>
      <h1 className="text-3xl md:text-4xl font-headline italic text-white">{title}</h1>
      {subtitle && <p className="text-xs text-white/60 max-w-2xl">{subtitle}</p>}
    </div>
    {action}
  </header>
);

export const Tabs = <T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: Array<{ value: T; label: string; count?: number }> }) => (
  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={`rounded-full px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider transition-colors ${
          value === o.value ? "bg-[#C8A96A] text-[#0d1612]" : "text-white/60 hover:text-white"
        }`}
      >
        {o.label}
        {o.count ? <span className="ml-1.5 rounded-full bg-black/20 px-1.5">{o.count}</span> : null}
      </button>
    ))}
  </div>
);
