"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { AlertCircle, CheckCircle2, CreditCard, ExternalLink, Loader2, RefreshCw, Unplug, Wallet } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";
import { OwnerBooking, PortalHeader, apiError, dateLabel, money } from "./shared";

interface ConnectStatus {
  state: "not_connected" | "incomplete" | "pending" | "connected";
  connected: boolean;
  payoutsEnabled?: boolean;
  requirements: string[];
  simulatorAvailable?: boolean;
  isSimulated?: boolean;
  settled?: { count: number; amount: number };
}

const SETTLEMENT: Record<string, { label: string; cls: string }> = {
  pending: { label: "Pending", cls: "bg-amber-500/15 text-amber-300" },
  transferred: { label: "Sent to Stripe", cls: "bg-emerald-500/15 text-emerald-300" },
  paid_manually: { label: "Paid by Tropica", cls: "bg-emerald-500/15 text-emerald-300" }
};

/** Venue owner: connect Stripe (same Express flow promoters use) and see payouts per booking. */
export default function PartnerPayoutsPage() {
  const params = useSearchParams();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [payouts, setPayouts] = useState<{ totals: { bookedPayout: number; paidOut: number; pending: number }; bookings: OwnerBooking[] } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [waitingForStripe, setWaitingForStripe] = useState(false);

  const loadPayouts = useCallback(() => {
    api
      .get("/marketplace/partner/payouts")
      .then(({ data }) => setPayouts(data))
      .catch(() => setPayouts((p) => p ?? { totals: { bookedPayout: 0, paidOut: 0, pending: 0 }, bookings: [] }));
  }, []);

  const loadStatus = useCallback(async (quiet = false): Promise<ConnectStatus | null> => {
    try {
      const { data } = await api.get("/marketplace/partner/connect/status");
      setStatus(data);
      // Money Tropica was holding for you is sent automatically once Stripe is connected
      if (data.settled?.count > 0) {
        toast.success(`${money(data.settled.amount)} from ${data.settled.count} booking${data.settled.count === 1 ? "" : "s"} was sent to your Stripe account`, { duration: 7000 });
        loadPayouts();
      }
      return data;
    } catch (err) {
      if (!quiet) toast.error(apiError(err, "Couldn't check Stripe status"));
      setStatus((s) => s ?? { state: "not_connected", connected: false, requirements: [] });
      return null;
    }
  }, [loadPayouts]);

  useEffect(() => {
    void loadStatus();
    loadPayouts();
  }, [loadStatus, loadPayouts]);

  // Back from Stripe's hosted onboarding. Stripe can take a few seconds to switch the account on,
  // so keep checking for up to a minute instead of trusting the first answer.
  useEffect(() => {
    const c = params.get("connect");
    if (c === "refresh") toast("That Stripe link expired — click Continue setup to get a fresh one.");
    if (c !== "success" && c !== "simulated_success") return;
    window.history.replaceState(null, "", window.location.pathname);
    let cancelled = false;
    setWaitingForStripe(true);
    (async () => {
      for (let i = 0; i < 20 && !cancelled; i++) {
        const st = await loadStatus(true);
        if (cancelled) return;
        if (st?.connected) {
          toast.success("Stripe connected — you're ready to get paid! 🎉");
          break;
        }
        await new Promise((r) => setTimeout(r, 3000));
      }
      if (!cancelled) setWaitingForStripe(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params, loadStatus]);

  const refresh = async () => {
    setBusy("refresh");
    const st = await loadStatus();
    setBusy(null);
    if (st?.connected) toast.success("Stripe is connected");
    else if (st) toast("Stripe hasn't finished activating your account yet.", { icon: "⏳" });
  };

  const disconnect = async () => {
    setConfirmDisconnect(false);
    setBusy("disconnect");
    try {
      const { data } = await api.post("/marketplace/partner/connect/disconnect");
      toast.success(data.message || "Stripe disconnected");
      await loadStatus();
    } catch (err) {
      toast.error(apiError(err, "Couldn't disconnect Stripe"));
    } finally {
      setBusy(null);
    }
  };

  const startOnboarding = async () => {
    setBusy("onboard");
    try {
      await api.post("/marketplace/partner/connect/create-account");
      const { data } = await api.post("/marketplace/partner/connect/onboarding-link");
      window.location.assign(data.url);
    } catch (err) {
      toast.error(apiError(err, "Couldn't start Stripe setup"));
      setBusy(null);
    }
  };

  const openDashboard = async () => {
    setBusy("dashboard");
    try {
      const { data } = await api.post("/marketplace/partner/connect/dashboard-link");
      window.open(data.url, "_blank", "noopener");
    } catch (err) {
      toast.error(apiError(err, "Couldn't open Stripe"));
    } finally {
      setBusy(null);
    }
  };

  const simulate = async () => {
    setBusy("simulate");
    try {
      await api.post("/marketplace/partner/connect/simulate-onboarding");
      toast.success("Test account marked as connected");
      await loadStatus();
    } catch (err) {
      toast.error(apiError(err, "Simulation failed"));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto space-y-8 min-h-screen">
      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Stripe?"
        message="New booking payments will go to Tropica instead of straight to your bank, and Tropica will pay you your share manually. Your Stripe account and past payouts are not affected, and you can connect again any time."
        confirmLabel="Disconnect"
        cancelLabel="Keep connected"
        variant="danger"
        onConfirm={disconnect}
        onCancel={() => setConfirmDisconnect(false)}
      />
      <PortalHeader
        title="Stripe & Payouts"
        subtitle="Connect your Stripe account so your share of every booking is paid straight to your bank. Tropica keeps its commission automatically."
      />

      {/* Stripe Connect panel */}
      <section className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
        {!status ? (
          <p className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Checking Stripe…
          </p>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "w-11 h-11 rounded-xl flex items-center justify-center",
                    status.connected ? "bg-emerald-500/15 text-emerald-300" : "bg-[#C8A96A]/10 text-[#C8A96A]"
                  )}
                >
                  {status.connected ? <CheckCircle2 className="w-6 h-6" /> : <CreditCard className="w-6 h-6" />}
                </div>
                <div>
                  <p className="text-white font-bold">
                    {status.connected
                      ? "Stripe connected — you're ready to get paid"
                      : waitingForStripe
                        ? "Finishing your Stripe connection…"
                        : status.state === "pending"
                        ? "Stripe is reviewing your details"
                        : status.state === "incomplete"
                          ? "Stripe setup not finished"
                          : "Stripe not connected"}
                  </p>
                  <p className="text-xs text-white/50">
                    {status.connected
                      ? `Payouts ${status.payoutsEnabled ? "enabled" : "pending verification"}${status.isSimulated ? " · test mode" : ""}`
                      : waitingForStripe
                        ? "Stripe is activating your account — this usually takes a few seconds."
                        : status.state === "pending"
                          ? "Your details are in. Stripe usually activates accounts within minutes."
                          : "Takes about 5 minutes: business details, ID and a bank account."}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {status.connected && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                )}
                {waitingForStripe && !status.connected && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white/70 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest">
                    <Loader2 className="w-4 h-4 animate-spin" /> Checking…
                  </span>
                )}
                {!status.connected && !waitingForStripe && status.state !== "not_connected" && (
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white/80 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    <RefreshCw className={cn("w-4 h-4", busy === "refresh" && "animate-spin")} /> Refresh status
                  </button>
                )}
                {!status.connected && !waitingForStripe && (
                  <button
                    type="button"
                    onClick={startOnboarding}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#635BFF] text-white px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {busy === "onboard" ? <Loader2 className="w-4 h-4 animate-spin" /> : <ExternalLink className="w-4 h-4" />}
                    {status.state === "not_connected" ? "Connect Stripe" : "Continue setup"}
                  </button>
                )}
                {status.state !== "not_connected" && (
                  <button
                    type="button"
                    onClick={openDashboard}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 text-white/80 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {busy === "dashboard" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />} Stripe dashboard
                  </button>
                )}
                {status.state !== "not_connected" && (
                  <button
                    type="button"
                    onClick={() => setConfirmDisconnect(true)}
                    disabled={Boolean(busy)}
                    className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 text-rose-300 hover:bg-rose-500/10 px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest disabled:opacity-50"
                  >
                    {busy === "disconnect" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unplug className="w-4 h-4" />} Disconnect
                  </button>
                )}
                {!status.connected && status.simulatorAvailable && (
                  <button
                    type="button"
                    onClick={simulate}
                    disabled={Boolean(busy)}
                    className="rounded-full border border-dashed border-white/20 text-white/50 px-4 py-2.5 text-[11px] font-bold uppercase tracking-widest"
                  >
                    Simulate (dev)
                  </button>
                )}
              </div>
            </div>
            {status.requirements.length > 0 && (
              <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200 flex gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Stripe still needs: {status.requirements.join(", ")}.</span>
              </div>
            )}
            {!status.connected && !waitingForStripe && (
              <p className="text-[11px] text-white/40">
                Until Stripe is connected, Tropica collects the payment and pays you your share manually.
              </p>
            )}
          </>
        )}
      </section>

      {/* Totals */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Total label="Earned from bookings" value={money(payouts?.totals.bookedPayout)} />
        <Total label="Paid out" value={money(payouts?.totals.paidOut)} />
        <Total label="Pending" value={money(payouts?.totals.pending)} highlight />
      </div>

      {/* Per-booking payouts */}
      <section className="space-y-3">
        <h2 className="text-base font-bold text-white">Payout history</h2>
        {!payouts ? (
          <p className="flex items-center gap-2 text-white/60 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading…
          </p>
        ) : payouts.bookings.length === 0 ? (
          <p className="text-sm text-white/50 bg-white/[0.03] border border-white/10 rounded-2xl p-6">No paid bookings yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead className="bg-white/[0.04] text-[10px] uppercase tracking-widest text-white/50">
                <tr>
                  <th className="text-left px-4 py-3">Event date</th>
                  <th className="text-left px-4 py-3">Customer</th>
                  <th className="text-right px-4 py-3">Your payout</th>
                  <th className="text-left px-4 py-3">How</th>
                  <th className="text-left px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {payouts.bookings.map((b) => {
                  const st = b.status === "cancelled" ? { label: "Cancelled", cls: "bg-white/10 text-white/60" } : SETTLEMENT[b.settlement?.status || "pending"];
                  return (
                    <tr key={b._id} className="border-t border-white/5">
                      <td className="px-4 py-3 text-white">{dateLabel(b.date, "MMM d, yyyy")}</td>
                      <td className="px-4 py-3 text-white/70">
                        {b.customerName} <span className="text-white/30">#{b.bookingNumber}</span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-[#C8A96A]">{money(b.venuePayout)}</td>
                      <td className="px-4 py-3 text-white/60">
                        {b.settlement?.mode === "connect" || b.settlement?.status === "transferred"
                          ? "Stripe"
                          : b.settlement?.status === "paid_manually"
                            ? "Paid by Tropica"
                            : "Tropica will send it"}
                        {b.settlement?.mode !== "connect" && b.settlement?.status === "pending" && b.status !== "cancelled" && (
                          <span className="block text-[10px] text-white/35">Paid before your Stripe was connected</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider", st.cls)}>{st.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

const Total = ({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) => (
  <div className={cn("rounded-2xl border p-5", highlight ? "border-[#C8A96A]/40 bg-[#C8A96A]/10" : "border-white/10 bg-white/[0.03]")}>
    <p className="text-[10px] uppercase tracking-widest text-white/50">{label}</p>
    <p className={cn("text-2xl font-headline mt-1", highlight ? "text-[#C8A96A]" : "text-white")}>{value}</p>
  </div>
);
