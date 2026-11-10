"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { Calendar, CheckCircle, AlertCircle, Loader2, Ticket } from "lucide-react";

const QrCodeCard = dynamic(() => import("@/components/shared/QrCodeCard"), { ssr: false });

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface PassDetails {
  passCode: string;
  qrCodeToken: string;
  guestName: string;
  status: string;
  checkedIn: boolean;
  checkedInAt?: string;
  booking?: {
    occasion?: string;
    eventDate?: string;
    startTime?: string;
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
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "#0F3D2E" }}>
        <Loader2 className="w-8 h-8 text-[#C8A96A] animate-spin" />
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: "#0F3D2E" }}>
        <div className="w-full max-w-md text-center rounded-2xl border border-red-500/30 bg-black/40 backdrop-blur-xl p-8">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-white mb-2">Pass Not Found</h1>
          <p className="text-white/60 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  const isValid = pass.status === "approved" && !pass.checkedIn;
  const isUsed = pass.checkedIn;
  const isPending = pass.status === "pending_approval";

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-8" style={{ backgroundColor: "#0F3D2E" }}>
      <div className="w-full max-w-md rounded-2xl border border-[#C8A96A]/20 bg-black/40 backdrop-blur-xl p-8 text-center">
        <Link href="/" className="mb-4 flex justify-center">
          <div className="relative w-36 h-20">
            <Image src="/tropica-logo.png" alt="Tropica" fill className="object-contain" priority />
          </div>
        </Link>

        {/* Status Banner */}
        {isUsed && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30">
            <p className="text-blue-300 text-sm font-bold">✓ Already Checked In</p>
            {pass.checkedInAt && (
              <p className="text-blue-300/60 text-xs mt-0.5">
                {new Date(pass.checkedInAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {isPending && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-yellow-500/20 border border-yellow-500/30">
            <p className="text-yellow-300 text-sm font-bold">⏳ Pending Host Approval</p>
          </div>
        )}

        {isValid && (
          <div className="mb-4 py-2 px-4 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <p className="text-emerald-300 text-sm font-bold">Valid – Show at Door</p>
          </div>
        )}

        {/* QR Code */}
        {isValid && (
          <div className="my-6">
            <QrCodeCard
              value={pass.qrCodeToken}
              size={240}
            />
          </div>
        )}

        {/* Pass Details */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3 text-left mt-4">
          <div className="flex items-center gap-3">
            <Ticket className="w-4 h-4 text-[#C8A96A] shrink-0" />
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Pass Code</p>
              <p className="text-white font-mono font-bold">{pass.passCode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full bg-[#C8A96A]/20 flex items-center justify-center shrink-0">
              <span className="text-[#C8A96A] text-[10px]">👤</span>
            </div>
            <div>
              <p className="text-white/40 text-[10px] uppercase tracking-wider">Guest</p>
              <p className="text-white text-sm font-semibold">{pass.guestName}</p>
            </div>
          </div>
          {pass.booking?.occasion && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-[#C8A96A] shrink-0" />
              <div>
                <p className="text-white/40 text-[10px] uppercase tracking-wider">Event</p>
                <p className="text-white text-sm">{pass.booking.occasion}</p>
                {pass.booking.eventDate && (
                  <p className="text-white/60 text-xs">{pass.booking.eventDate}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={() => window.print()}
          className="mt-6 w-full py-3 rounded-xl border border-[#C8A96A]/30 text-[#C8A96A] text-xs font-bold tracking-wider uppercase hover:bg-[#C8A96A]/10 transition-colors"
        >
          Print Pass
        </button>
      </div>
    </div>
  );
}

