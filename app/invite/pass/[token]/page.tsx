"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, CheckCircle, AlertCircle, Loader2, Printer, Ticket, User } from "lucide-react";
import { LoungeBackdrop, TropicaPanel, tropicaGhostButton } from "@/components/auth/TropicaAuthShell";
import { formatTimeTo12Hour } from "@/lib/utils";

const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PassDetails {
  passCode: string;
  qrCodeToken: string;
  guestName: string;
  status: string;
  checkedIn: boolean;
  checkedInAt?: string;
  event?: {
    title?: string;
    flyerUrl?: string;
    occasion?: string;
    hostName?: string;
    date?: string;
    startTime?: string;
    endTime?: string;
    cancelled?: boolean;
  };
}

export default function GuestPassPage() {
  const params = useParams();
  const qrToken = params?.token as string;

  const [loading, setLoading] = useState(true);
  const [pass, setPass] = useState<PassDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchPass = useCallback(async () => {
    try {
      const res = await fetch(`${API}/invitations/pass/${qrToken}`);
      const data = await res.json();
      if (data.success) {
        setPass(data.pass);
      } else {
        setError(data.message || "Pass not found");
      }
    } catch {
      setError("Could not load pass details");
    } finally {
      setLoading(false);
    }
  }, [qrToken]);

  useEffect(() => {
    if (qrToken) fetchPass();
  }, [qrToken, fetchPass]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-[#0b0704]">
        <LoungeBackdrop />
        <Loader2 className="relative z-10 w-8 h-8 text-[#E0C68E] animate-spin" />
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="relative flex min-h-screen items-center justify-center px-4 bg-[#0b0704] text-white">
        <LoungeBackdrop />
        <TropicaPanel className="relative z-10 w-full max-w-md p-8 text-center">
          <AlertCircle className="w-12 h-12 text-rose-300 mx-auto mb-4" />
          <h1 className="font-headline text-2xl font-bold mb-2">Pass not found</h1>
          <p className="text-white/60 text-sm">{error}</p>
          <Link href="/" className="inline-block mt-4 text-xs text-[#E0C68E] underline">
            Go to Tropica NYC
          </Link>
        </TropicaPanel>
      </div>
    );
  }

  const isValid = pass.status === "approved" && !pass.checkedIn;
  const isUsed = pass.checkedIn;
  const isPending = pass.status === "pending_approval";
  const ev = pass.event;
  const evDate = ev?.date ? new Date(ev.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }) : "";

  return (
    <div className="relative min-h-screen bg-[#0b0704] text-white overflow-x-hidden print:bg-white">
      <div className="print:hidden">
        <LoungeBackdrop />
      </div>

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
        <Link href="/" className="group flex flex-col items-center gap-2">
          <div className="relative h-20 w-36 sm:h-24 sm:w-44 drop-shadow-[0_0_18px_rgba(255,190,90,0.45)] transition-transform duration-300 group-hover:scale-105">
            <Image src="/tropica-logo.png" alt="Tropica" fill className="object-contain" priority />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.45em] text-[#E0C68E]/85">Private Event Space</span>
        </Link>

        <TropicaPanel className="mt-6 w-full max-w-md text-center">
          {ev?.flyerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={ev.flyerUrl} alt="" className="block w-full max-h-80 object-contain bg-black border-b border-[#C8A96A]/30 print:hidden" />
          )}
          <div className="p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.35em] text-[#E0C68E]">Door pass</p>
              <h1 className="font-headline text-3xl sm:text-4xl font-bold capitalize break-words">{ev?.title || "Guest pass"}</h1>
              {evDate && (
                <p className="text-xs text-white/55 inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A96A]" /> {evDate}
                  {ev?.startTime ? ` · ${formatTimeTo12Hour(ev.startTime)}` : ""}
                </p>
              )}
            </div>

            {/* Status */}
            {isValid && (
              <div className="py-2 px-4 rounded-xl bg-emerald-500/10 border border-emerald-400/35 flex items-center justify-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-300" />
                <p className="text-emerald-200 text-sm font-bold">Valid · Show at the door</p>
              </div>
            )}
            {isUsed && (
              <div className="py-2 px-4 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/40">
                <p className="text-[#F1D9A0] text-sm font-bold">✓ Already checked in</p>
                {pass.checkedInAt && <p className="text-white/50 text-xs mt-0.5">{new Date(pass.checkedInAt).toLocaleString()}</p>}
              </div>
            )}
            {pass.status === "removed" && (
              <div className="py-2 px-4 rounded-xl bg-rose-500/10 border border-rose-400/35">
                <p className="text-rose-200 text-sm font-bold">This pass is no longer valid</p>
                <p className="text-white/50 text-xs mt-0.5">The host removed this guest from the list.</p>
              </div>
            )}
            {isPending && (
              <div className="py-2 px-4 rounded-xl bg-amber-500/10 border border-amber-400/35">
                <p className="text-amber-200 text-sm font-bold">⏳ Waiting for the host to approve</p>
              </div>
            )}

            {/* QR */}
            {isValid && (
              <div className="mx-auto w-fit rounded-2xl bg-white p-3 ring-2 ring-[#C8A96A]/60 shadow-[0_0_40px_-8px_rgba(255,190,90,0.6)]">
                <QrCodeCard value={pass.qrCodeToken} size={240} />
              </div>
            )}

            {/* Details */}
            <div className="rounded-2xl bg-black/40 border border-[#C8A96A]/20 p-4 sm:p-5 space-y-3 text-left">
              <div className="flex items-center gap-3">
                <Ticket className="w-4 h-4 text-[#E0C68E] shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-bold">Pass code</p>
                  <p className="font-mono font-bold tracking-widest text-[#F1D9A0]">{pass.passCode}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-[#E0C68E] shrink-0" />
                <div>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-bold">Guest</p>
                  <p className="text-sm font-semibold">{pass.guestName}</p>
                </div>
              </div>
            </div>

            <button onClick={() => window.print()} className={`${tropicaGhostButton} print:hidden`}>
              <Printer className="w-4 h-4" /> Print pass
            </button>
          </div>
        </TropicaPanel>
      </main>
    </div>
  );
}
