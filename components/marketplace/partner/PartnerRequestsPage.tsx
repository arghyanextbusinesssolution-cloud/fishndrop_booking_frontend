"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Check, Clock, Inbox, Loader2, MessageSquare, PartyPopper, Users, X } from "lucide-react";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { OwnerBooking, PortalHeader, STATUS_LABEL, Tabs, apiError, dateLabel, money, time12 } from "./shared";

type Tab = "requested" | "answered";

const DECLINE_REASONS = ["Already booked that day", "Closed for a private event", "Too many guests for this date", "Staffing not available"];

/** Venue owner: accept or decline incoming booking requests. */
export default function PartnerRequestsPage() {
  const [tab, setTab] = useState<Tab>("requested");
  const [data, setData] = useState<{ tab: Tab; requests: OwnerBooking[]; waiting: number } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [declining, setDeclining] = useState<OwnerBooking | null>(null);
  const [accepting, setAccepting] = useState<OwnerBooking | null>(null);

  const load = useCallback(async (t: Tab) => {
    try {
      const { data } = await api.get("/marketplace/partner/requests", { params: { status: t } });
      setData({ tab: t, requests: data.requests || [], waiting: data.waiting || 0 });
    } catch (err) {
      toast.error(apiError(err, "Couldn't load requests"));
      setData({ tab: t, requests: [], waiting: 0 });
    }
  }, []);

  useEffect(() => {
    void load(tab);
  }, [tab, load]);

  const loading = !data || data.tab !== tab;

  const accept = async (r: OwnerBooking) => {
    setBusy(r._id);
    try {
      const { data: res } = await api.post(`/marketplace/partner/requests/${r._id}/confirm`);
      toast.success(res.message);
      setAccepting(null);
      void load(tab);
    } catch (err) {
      toast.error(apiError(err, "Couldn't confirm this request"));
    } finally {
      setBusy(null);
    }
  };

  const decline = async (r: OwnerBooking, reason: string) => {
    setBusy(r._id);
    try {
      const { data: res } = await api.post(`/marketplace/partner/requests/${r._id}/decline`, { reason });
      toast.success(res.message);
      setDeclining(null);
      void load(tab);
    } catch (err) {
      toast.error(apiError(err, "Couldn't decline this request"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-6 min-h-screen">
      <PortalHeader
        title="Booking Requests"
        subtitle="Customers are waiting on you. Accept to send them a payment link, or decline and they'll be told straight away. Please answer within 24 hours."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        options={[
          { value: "requested", label: "Waiting", count: data?.waiting },
          { value: "answered", label: "Answered" }
        ]}
      />

      {loading && (
        <p className="flex items-center gap-2 text-white/60 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading…
        </p>
      )}

      {!loading && data.requests.length === 0 && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-10 text-center space-y-2">
          <Inbox className="w-10 h-10 text-[#C8A96A] mx-auto" />
          <p className="text-white font-semibold">{tab === "requested" ? "No requests waiting" : "Nothing answered yet"}</p>
          <p className="text-sm text-white/50">New requests appear here and arrive by email.</p>
        </div>
      )}

      <div className="space-y-4">
        {!loading &&
          data.requests.map((r) => {
            const s = STATUS_LABEL[r.status];
            return (
              <div key={r._id} className="bg-white/[0.03] border border-white/10 rounded-2xl p-5 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-bold text-white">{r.customerName}</p>
                    <p className="text-[11px] text-white/40">
                      #{r.bookingNumber} · requested {new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <span className={cn("rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider", s.cls)}>{s.label}</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <Info icon={<CalendarDays className="w-4 h-4" />} label="Date" value={dateLabel(r.date)} />
                  <Info icon={<Clock className="w-4 h-4" />} label="Time" value={`${time12(r.startTime)} – ${time12(r.endTime)} (${r.durationHours}h)`} />
                  <Info icon={<Users className="w-4 h-4" />} label="Guests" value={String(r.guests)} />
                  <Info icon={<PartyPopper className="w-4 h-4" />} label="Occasion" value={r.occasion?.replace(/_/g, " ") || "—"} />
                </div>

                {r.notes && (
                  <p className="text-sm text-white/70 bg-white/[0.03] border border-white/10 rounded-xl p-3 flex gap-2">
                    <MessageSquare className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" /> {r.notes}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <p className="text-sm text-white/70">
                    {r.packageName && <span className="text-white/50">{r.packageName} · </span>}
                    You receive <strong className="text-[#C8A96A]">{money(r.venuePayout)}</strong>
                  </p>
                  {r.status === "requested" ? (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setDeclining(r)}
                        disabled={busy === r._id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-rose-400/40 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-rose-300 hover:bg-rose-500/10 disabled:opacity-50"
                      >
                        <X className="w-4 h-4" /> Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => setAccepting(r)}
                        disabled={busy === r._id}
                        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#06140d] hover:bg-emerald-400 disabled:opacity-50"
                      >
                        {busy === r._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Accept
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-white/50">
                      {r.status === "declined" && r.declineReason && <>Reason: “{r.declineReason}”</>}
                      {r.status === "availability_confirmed" && r.paymentLinkExpiresAt && (
                        <>Payment link valid until {new Date(r.paymentLinkExpiresAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" })}</>
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>

      {declining && (
        <DeclineDialog request={declining} busy={busy === declining._id} onCancel={() => setDeclining(null)} onConfirm={(reason) => decline(declining, reason)} />
      )}
      {accepting && (
        <AcceptDialog request={accepting} busy={busy === accepting._id} onCancel={() => setAccepting(null)} onConfirm={() => accept(accepting)} />
      )}
    </div>
  );
}

/** In-page confirmation (replaces the browser's "localhost says" pop-up). */
const AcceptDialog = ({
  request: r,
  busy,
  onCancel,
  onConfirm
}: {
  request: OwnerBooking;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="accept-title"
      onClick={() => !busy && onCancel()}
    >
      <div className="w-full max-w-md bg-[#0d1612] border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="h-1 bg-emerald-500" />
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/15 text-emerald-300 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.25em] text-white/40 font-bold">Accept booking request</p>
              <h2 id="accept-title" className="text-xl font-headline italic text-white">
                Confirm {r.customerName}&apos;s booking?
              </h2>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 divide-y divide-white/5 text-sm">
            <Row label="Date" value={dateLabel(r.date)} />
            <Row label="Time" value={`${time12(r.startTime)} – ${time12(r.endTime)} (${r.durationHours}h)`} />
            <Row label="Guests" value={String(r.guests)} />
            {r.occasion && <Row label="Occasion" value={r.occasion.replace(/_/g, " ")} />}
            <Row label="You receive" value={money(r.venuePayout)} highlight />
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            The customer gets a payment link straight away. Once they pay, the booking is confirmed and this time is blocked on your calendar.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              disabled={busy}
              className="rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white disabled:opacity-40"
            >
              Not yet
            </button>
            <button
              type="button"
              autoFocus
              onClick={onConfirm}
              disabled={busy}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-6 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[#06140d] hover:bg-emerald-400 disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Yes, accept
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Row = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className="flex justify-between gap-4 px-4 py-2.5">
    <span className="text-white/50">{label}</span>
    <span className={cn("capitalize text-right", highlight ? "text-[#C8A96A] font-bold" : "text-white")}>{value}</span>
  </div>
);

const Info = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div className="rounded-xl border border-white/10 p-3">
    <p className="text-[10px] uppercase tracking-widest text-white/40 flex items-center gap-1.5">
      <span className="text-[#C8A96A]">{icon}</span> {label}
    </p>
    <p className="text-white mt-1 capitalize text-sm">{value}</p>
  </div>
);

const DeclineDialog = ({
  request,
  busy,
  onCancel,
  onConfirm
}: {
  request: OwnerBooking;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) => {
  const [reason, setReason] = useState("");
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md bg-[#0d1612] border border-white/10 rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-headline italic text-white">Decline this request?</h2>
        <p className="text-sm text-white/60">
          {request.customerName} · {dateLabel(request.date, "MMM d")} at {time12(request.startTime)}. The reason is shared with the customer.
        </p>
        <div className="flex flex-wrap gap-2">
          {DECLINE_REASONS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setReason(r)}
              className={cn("rounded-full border px-3 py-1.5 text-xs", reason === r ? "border-[#C8A96A] text-[#C8A96A]" : "border-white/15 text-white/60")}
            >
              {r}
            </button>
          ))}
        </div>
        <textarea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          placeholder="Or write your own reason"
          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[#C8A96A]"
        />
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white/60 hover:text-white">
            Keep it
          </button>
          <button
            type="button"
            disabled={!reason.trim() || busy}
            onClick={() => onConfirm(reason.trim())}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-white disabled:opacity-40"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Decline request
          </button>
        </div>
      </div>
    </div>
  );
};
