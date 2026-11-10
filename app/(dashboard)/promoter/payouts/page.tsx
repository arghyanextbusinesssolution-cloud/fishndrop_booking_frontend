"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/axios";
import {
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ArrowRight,
  RefreshCw,
  Clock,
  Loader2,
  Landmark,
  Ticket,
  Link2Off
} from "lucide-react";

type ConnectState = "not_connected" | "incomplete" | "pending" | "connected";

interface ConnectStatus {
  state: ConnectState;
  connected: boolean;
  accountId?: string;
  chargesEnabled: boolean;
  payoutsEnabled: boolean;
  detailsSubmitted: boolean;
  requirements?: string[];
  disabledReason?: string | null;
  isSimulated?: boolean;
  simulatorAvailable?: boolean;
}

const STATE_UI: Record<ConnectState, { label: string; badge: string; icon: typeof CheckCircle2; title: string; text: string }> = {
  connected: {
    label: "Connected",
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
    icon: CheckCircle2,
    title: "Your Stripe account is connected",
    text: "Ticket money goes straight to your Stripe account after every sale, and Stripe pays it out to your bank automatically."
  },
  pending: {
    label: "Under review",
    badge: "bg-sky-500/15 text-sky-300 border-sky-500/30",
    icon: Clock,
    title: "Stripe is reviewing your details",
    text: "You've submitted your details. Stripe usually finishes within a few minutes, and sometimes asks for one more thing."
  },
  incomplete: {
    label: "Setup incomplete",
    badge: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    icon: AlertCircle,
    title: "Finish your Stripe setup",
    text: "Your Stripe account was created, but the signup isn't finished. You can't receive ticket money until it is."
  },
  not_connected: {
    label: "Not connected",
    badge: "bg-white/10 text-white/60 border-white/15",
    icon: Link2Off,
    title: "Connect Stripe to get paid",
    text: "Connect a Stripe account so ticket sales are paid out to your bank. It takes about 5 minutes."
  }
};

function Check({ ok, label, okText, noText }: { ok: boolean; label: string; okText: string; noText: string }) {
  return (
    <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 space-y-1">
      <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">{label}</span>
      <div className="flex items-center gap-2">
        {ok ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-amber-400" />}
        <span className="text-sm font-semibold text-white">{ok ? okText : noText}</span>
      </div>
    </div>
  );
}

export default function PromoterPayoutsPage() {
  const router = useRouter();
  const [status, setStatus] = useState<ConnectStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const prevState = useRef<ConnectState | null>(null);

  const fetchStatus = useCallback(async (quiet = false) => {
    try {
      if (!quiet) setIsRefreshing(true);
      const { data } = await api.get("/payments/connect/status");
      if (data.success) {
        setStatus(data);
        if (prevState.current && prevState.current !== "connected" && data.state === "connected") {
          toast.success("Stripe connected! You're ready to receive ticket payouts.");
        }
        prevState.current = data.state;
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to fetch payout status");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load + handle the return from Stripe's hosted onboarding
  useEffect(() => {
    const connect = new URLSearchParams(window.location.search).get("connect");
    void fetchStatus(true);
    if (connect === "success") toast("Checking your Stripe account…", { icon: "🔄" });
    if (connect === "refresh") toast("That Stripe link expired. Click the button to continue setup.");
    if (connect) router.replace("/promoter/payouts");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-check when the tab regains focus, and poll briefly while Stripe is reviewing
  useEffect(() => {
    const onFocus = () => void fetchStatus(true);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [fetchStatus]);

  useEffect(() => {
    if (status?.state !== "pending") return;
    const id = setInterval(() => void fetchStatus(true), 10_000);
    const stop = setTimeout(() => clearInterval(id), 5 * 60_000);
    return () => {
      clearInterval(id);
      clearTimeout(stop);
    };
  }, [status?.state, fetchStatus]);

  const handleStartOnboarding = async () => {
    setIsConnecting(true);
    try {
      await api.post("/payments/connect/create-account");
      const { data } = await api.post("/payments/connect/onboarding-link");
      if (data.success && data.url) {
        if (data.isSimulated) {
          toast.success("Test mode simulated onboarding activated!");
          void fetchStatus();
        } else {
          window.location.href = data.url;
          return;
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to start Stripe onboarding");
    }
    setIsConnecting(false);
  };

  const handleOpenDashboard = async () => {
    try {
      const { data } = await api.post("/payments/connect/dashboard-link");
      if (data.success && data.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to open Stripe dashboard");
    }
  };

  const handleSimulateTestMode = async () => {
    try {
      const { data } = await api.post("/payments/connect/simulate-onboarding");
      if (data.success) {
        toast.success("Promoter test account enabled for ticket sales!");
        void fetchStatus();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Simulation failed");
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
      </div>
    );
  }

  const state: ConnectState = status?.state || (status?.accountId ? "incomplete" : "not_connected");
  const ui = STATE_UI[state];
  const StateIcon = ui.icon;
  const requirements = status?.requirements || [];

  const primaryBtn =
    "w-full sm:w-auto px-6 py-3.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50";

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto space-y-8 min-h-screen">
      <header className="space-y-1">
        <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">Payouts &amp; Banking</span>
        <h1 className="text-3xl md:text-4xl font-headline italic text-white">Stripe &amp; Payouts</h1>
        <p className="text-xs text-white/60">Secure bank payouts powered by Stripe. Tropica never sees your banking details.</p>
      </header>

      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl">
        {/* Status header */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-start gap-3">
            <div
              className={`w-12 h-12 rounded-xl border flex items-center justify-center shrink-0 ${
                state === "connected" ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#C8A96A]/10 border-[#C8A96A]/20"
              }`}
            >
              {state === "connected" ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <CreditCard className="w-6 h-6 text-[#C8A96A]" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{ui.title}</h2>
              <p className="text-xs text-white/55 max-w-md">{ui.text}</p>
              {status?.accountId && <p className="text-[10px] text-white/30 font-mono mt-1">Stripe account {status.accountId}</p>}
            </div>
          </div>
          <span className={`self-start inline-flex items-center gap-1.5 border px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shrink-0 ${ui.badge}`}>
            <StateIcon className="w-4 h-4" /> {ui.label}
          </span>
        </div>

        {/* What Stripe still needs */}
        {state !== "connected" && requirements.length > 0 && (
          <div className="rounded-xl border border-amber-400/25 bg-amber-400/5 p-4">
            <p className="text-xs font-bold text-amber-200 mb-2">Stripe still needs:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
              {requirements.map((r) => (
                <li key={r} className="text-xs text-white/70 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-300" /> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Checkpoints */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Check ok={!!status?.detailsSubmitted} label="Details" okText="Submitted" noText="Not finished" />
          <Check ok={state === "connected"} label="Receive ticket money" okText="Enabled" noText="Not yet" />
          <Check ok={!!status?.payoutsEnabled} label="Bank payouts" okText="Active" noText="Not yet" />
        </div>

        {state === "connected" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-white/60">
            <p className="flex items-start gap-2">
              <Ticket className="w-4 h-4 text-[#C8A96A] shrink-0" /> Every ticket sale sends your share to Stripe automatically.
            </p>
            <p className="flex items-start gap-2">
              <Landmark className="w-4 h-4 text-[#C8A96A] shrink-0" /> Stripe pays your bank on its automatic schedule (usually about 2 business days).
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
          {state === "connected" ? (
            <button onClick={handleOpenDashboard} className={primaryBtn}>
              View payouts in Stripe <ExternalLink className="w-4 h-4" />
            </button>
          ) : (
            <button onClick={handleStartOnboarding} disabled={isConnecting} className={primaryBtn}>
              {isConnecting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {isConnecting
                ? "Opening Stripe…"
                : state === "not_connected"
                ? "Connect Stripe"
                : state === "pending"
                ? "Update details on Stripe"
                : "Finish Stripe setup"}
              {!isConnecting && <ArrowRight className="w-4 h-4" />}
            </button>
          )}

          <button
            onClick={() => fetchStatus()}
            disabled={isRefreshing}
            className="w-full sm:w-auto px-4 py-3 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} /> Refresh status
          </button>
        </div>

        {/* Local-dev simulator: only when no real Stripe key is configured */}
        {status?.simulatorAvailable && state !== "connected" && (
          <div className="pt-6 border-t border-white/5 flex items-center justify-between text-xs text-white/40">
            <span>Local dev without Stripe keys?</span>
            <button onClick={handleSimulateTestMode} className="text-[#C8A96A] hover:underline font-semibold cursor-pointer">
              Simulate connected account
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
