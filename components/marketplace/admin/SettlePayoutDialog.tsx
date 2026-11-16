"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Banknote, Loader2, Send, X } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import type { RevenueBooking } from "@/components/pages/ExternalRevenuePage";

const usd = (n = 0) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Props {
  booking: RevenueBooking;
  venueName: string;
  stripeConnected: boolean;
  onClose: () => void;
  onDone: () => void;
}

/** Admin: pay a venue its share of a booking Tropica collected — by Stripe transfer, or record an outside payment. */
export function SettlePayoutDialog({ booking, venueName, stripeConnected, onClose, onDone }: Props) {
  const [method, setMethod] = useState<"stripe" | "manual">(stripeConnected ? "stripe" : "manual");
  const [reference, setReference] = useState("");
  const [busy, setBusy] = useState(false);
  const owed = booking.owedToVenue || 0;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onClose]);

  const submit = async () => {
    setBusy(true);
    try {
      const { data } = await api.post(`/admin/marketplace/bookings/${booking._id}/settle`, { method, reference: reference.trim() });
      toast.success(data.message || "Payout recorded");
      onDone();
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Couldn't complete the payout");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => !busy && onClose()} role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d1612] p-6 space-y-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] font-bold">Pay venue</p>
            <h2 className="font-headline text-2xl italic text-white capitalize">{venueName}</h2>
            <p className="text-xs text-white/50 mt-1">
              #{booking.bookingNumber} · {booking.customerName}
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="w-9 h-9 rounded-full border border-white/15 text-white/60 hover:text-white flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm space-y-1.5">
          <Row label="Customer paid Tropica" value={usd(booking.amountPaid)} />
          <Row label="Tropica commission" value={`− ${usd(booking.commission)}`} />
          <div className="flex justify-between pt-2 border-t border-white/10">
            <span className="text-white font-semibold">Owed to the venue</span>
            <span className="font-headline text-xl text-[#E0C68E]">{usd(owed)}</span>
          </div>
        </div>

        <div className="space-y-2">
          <Option
            active={method === "stripe"}
            disabled={!stripeConnected}
            onClick={() => setMethod("stripe")}
            icon={<Send className="w-4 h-4" />}
            title={`Send ${usd(owed)} via Stripe`}
            text={stripeConnected ? "Transferred now to the venue's connected Stripe account." : "The venue hasn't connected Stripe yet."}
          />
          <Option
            active={method === "manual"}
            onClick={() => setMethod("manual")}
            icon={<Banknote className="w-4 h-4" />}
            title="I already paid them another way"
            text="Bank transfer, Zelle, cheque… just mark it as paid."
          />
          {method === "manual" && (
            <input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              maxLength={200}
              placeholder="Reference (optional) — e.g. Zelle #1234"
              className="w-full rounded-xl bg-black/40 border border-white/15 px-4 py-2.5 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#C8A96A]"
            />
          )}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={busy || (method === "stripe" && !stripeConnected)}
          className="w-full py-3 rounded-full bg-[#C8A96A] hover:bg-[#E0C68E] text-[#0d1612] text-xs font-black uppercase tracking-[0.15em] flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" />}
          {method === "stripe" ? `Send ${usd(owed)}` : "Mark as paid"}
        </button>
      </div>
    </div>
  );
}

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-white/70">
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const Option = ({
  active,
  disabled,
  onClick,
  icon,
  title,
  text
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  text: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "w-full text-left rounded-2xl border p-3.5 flex gap-3 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
      active ? "border-[#C8A96A] bg-[#C8A96A]/10" : "border-white/10 hover:border-white/25"
    )}
  >
    <span className={cn("mt-0.5", active ? "text-[#E0C68E]" : "text-white/50")}>{icon}</span>
    <span>
      <span className="block text-sm font-semibold text-white">{title}</span>
      <span className="block text-xs text-white/50">{text}</span>
    </span>
  </button>
);

export default SettlePayoutDialog;
