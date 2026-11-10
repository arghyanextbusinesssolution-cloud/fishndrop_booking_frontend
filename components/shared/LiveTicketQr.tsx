"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { CheckCircle2, Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import api from "@/lib/axios";

/** Server error message from an axios error, or a fallback. */
const apiMessage = (err: unknown, fallback: string): string =>
  (err as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });

interface LiveQrResponse {
  token?: string;
  refreshInMs?: number;
  windowMs?: number;
  checkedIn: boolean;
  checkedInAt?: string;
}

/**
 * Rotating door QR for the signed-in ticket holder.
 * Each code admits for 5 minutes; a fresh one is fetched just before that, so screenshots stop working.
 */

/** 285000 → "4:45" */
const mmss = (ms: number) => {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
};
export default function LiveTicketQr({ ticketId, size = 220 }: { ticketId: string; size?: number }) {
  const [data, setData] = useState<LiveQrResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const expiresAt = useRef(0);
  const loadRef = useRef<() => void>(() => {});

  const load = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    try {
      const { data: res } = await api.get(`/tickets/seats/${ticketId}/live-qr`);
      setData(res);
      setError(null);
      if (!res.checkedIn && res.refreshInMs) {
        expiresAt.current = Date.now() + res.refreshInMs;
        // Fetch the next code shortly before this one stops scanning (server sends 4:45 of a 5:00 life)
        timer.current = setTimeout(() => loadRef.current(), Math.max(1000, res.refreshInMs));
      }
    } catch (err: unknown) {
      setError(apiMessage(err, "Could not load your live QR"));
      timer.current = setTimeout(() => loadRef.current(), 5000);
    }
  }, [ticketId]);

  useEffect(() => {
    loadRef.current = () => void load();
  }, [load]);

  useEffect(() => {
    const first = setTimeout(() => void load(), 0);
    // Phones throttle background tabs: refresh immediately when the screen comes back
    const onVisible = () => document.visibilityState === "visible" && void load();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearTimeout(first);
      if (timer.current) clearTimeout(timer.current);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [load]);

  useEffect(() => {
    const id = setInterval(() => setRemaining(Math.max(0, expiresAt.current - Date.now())), 250);
    return () => clearInterval(id);
  }, []);

  if (data?.checkedIn) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-emerald-300">
        <CheckCircle2 className="w-12 h-12" />
        <p className="text-sm font-bold">Checked in</p>
        {data.checkedInAt && (
          <p className="text-[11px] text-white/50">
            at {new Date(data.checkedInAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
          </p>
        )}
      </div>
    );
  }

  if (!data?.token) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-white/60" style={{ minHeight: size }}>
        {error ? (
          <>
            <p className="text-xs text-rose-300 text-center max-w-[220px]">{error}</p>
            <button onClick={() => void load()} className="inline-flex items-center gap-1 text-[11px] text-[#C8A96A] underline cursor-pointer">
              <RefreshCw className="w-3 h-3" /> Try again
            </button>
          </>
        ) : (
          <Loader2 className="w-6 h-6 animate-spin text-[#C8A96A]" />
        )}
      </div>
    );
  }

  const pct = data.refreshInMs ? Math.min(100, (remaining / data.refreshInMs) * 100) : 0;

  return (
    <div className="flex flex-col items-center gap-2 select-none">
      <div className="relative rounded-2xl bg-white p-3">
        <QrCodeCard value={data.token} size={size} />
        {/* Moving strip: shows staff this is a live screen, not a photo */}
        <div className="absolute left-3 right-3 bottom-1.5 h-1 rounded-full bg-black/10 overflow-hidden">
          <div className="h-full bg-emerald-500 transition-[width] duration-200 ease-linear" style={{ width: `${pct}%` }} />
        </div>
      </div>
      <p className="text-[10px] text-white/50 inline-flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        Live QR · new code in {mmss(remaining)} · screenshots expire after 5 min
      </p>
    </div>
  );
}
