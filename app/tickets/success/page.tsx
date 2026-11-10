"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  CheckCircle2,
  Ticket,
  Calendar,
  Clock,
  MapPin,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Users,
  User as UserIcon,
  QrCode,
  Loader2
} from "lucide-react";

interface IssuedTicket {
  ticketCode: string;
  tierName: string;
  customerName: string;
  qrCodeToken: string;
  status: string;
}

function TicketSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const sessionId = searchParams.get("session_id");
  const isSimulated = searchParams.get("simulated");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orderData, setOrderData] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [tickets, setTickets] = useState<IssuedTicket[]>([]);
  const [qrMode, setQrMode] = useState<"individual" | "group" | null>(null);
  const [groupToken, setGroupToken] = useState<string | null>(null);
  const [savingMode, setSavingMode] = useState<"individual" | "group" | null>(null);

  /** Save the buyer's QR choice (fetch, not axios: a 401 must not bounce them to /login). */
  const chooseMode = async (mode: "individual" | "group") => {
    const id = orderData?.orderId || orderId;
    const token = Cookies.get("token");
    if (!id || !token) {
      toast.error("Please sign in again to change how your QR passes work.");
      return;
    }
    setSavingMode(mode);
    try {
      const base = process.env.NEXT_PUBLIC_API_URL || "/api";
      const res = await fetch(`${base}/tickets/orders/${id}/qr-mode`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || "Could not save your choice");
      setQrMode(data.qrMode);
      setGroupToken(data.groupQrToken || null);
      toast.success(mode === "group" ? "One group QR created for everyone" : "Separate QR for each person");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Could not save your choice");
    } finally {
      setSavingMode(null);
    }
  };

  useEffect(() => {
    if (!orderId) {
      setError("No order ID provided");
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    // Embedded Stripe payments can take a few seconds to settle, so retry before giving up.
    const verify = async (attempt = 1): Promise<void> => {
      const MAX_ATTEMPTS = 8;
      try {
        setIsLoading(true);
        const { data, status } = await api.post("/tickets/verify-order", {
          orderId,
          sessionId,
          simulated: isSimulated
        });
        if (cancelled) return;

        if (data.success) {
          setOrderData(data.order);
          setEventData(data.event);
          setTickets(data.tickets);
          setQrMode(data.order?.qrMode || (data.tickets?.length > 1 ? null : "individual"));
          setGroupToken(data.order?.groupQrToken || null);
          setIsLoading(false);
          return;
        }
        if (status === 202 && attempt < MAX_ATTEMPTS) {
          setTimeout(() => !cancelled && verify(attempt + 1), 2500);
          return;
        }
        setError(data.message || "Failed to verify ticket payment");
        setIsLoading(false);
      } catch (err: any) {
        if (cancelled) return;
        const httpStatus = err.response?.status;
        if ((httpStatus === 400 || httpStatus === 202) && attempt < MAX_ATTEMPTS) {
          setTimeout(() => !cancelled && verify(attempt + 1), 2500);
          return;
        }
        setError(err.response?.data?.message || "Failed to verify ticket order");
        setIsLoading(false);
      }
    };

    verify();
    return () => {
      cancelled = true;
    };
  }, [orderId, sessionId, isSimulated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C8A96A]"></div>
        <h2 className="text-xl font-bold text-white">Verifying Stripe Payment...</h2>
        <p className="text-xs text-white/50">Issuing secure QR tickets and generating admission passes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#070B09] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Payment Verification Pending</h2>
        <p className="text-xs text-white/60 max-w-sm">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#C8A96A] text-black text-xs font-bold rounded-xl cursor-pointer"
        >
          Check Again
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B09] text-white py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_25px_rgba(16,185,129,0.3)]">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <span className="text-[10px] uppercase font-bold tracking-[0.25em] text-[#C8A96A] block">
            Payment Verified &bull; Official Tickets
          </span>
          <h1 className="text-3xl font-headline italic text-white">You&apos;re Going to Tropica!</h1>
          <p className="text-xs text-white/60">
            A confirmation email with ticket access links has been sent to{" "}
            <span className="text-white font-medium">{orderData?.customerEmail}</span>.
          </p>
        </div>

        {/* Order Card */}
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-white/10">
            <div>
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Order Number
              </span>
              <div className="text-base font-bold text-[#C8A96A] font-mono">
                {orderData?.orderNumber}
              </div>
            </div>
            <div className="sm:text-right">
              <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                Total Paid
              </span>
              <div className="text-base font-bold text-white font-mono">
                ${orderData?.totalAmount?.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Event Details */}
          {eventData && (
            <div className="space-y-2 pb-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">{eventData.title}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-white/70">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>{new Date(eventData.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>{eventData.startTime} – {eventData.endTime}</span>
                </div>
                <div className="flex items-center gap-1.5 sm:col-span-2">
                  <MapPin className="w-3.5 h-3.5 text-[#C8A96A]" />
                  <span>{eventData.venueName} &bull; {eventData.venueAddress}</span>
                </div>
              </div>
            </div>
          )}

          {/* QR passes: ask group vs individual for multi-ticket orders */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#C8A96A]" /> Your QR Admission Passes ({tickets.length})
            </h3>

            {tickets.length > 1 && qrMode === null && (
              <div className="rounded-2xl border border-[#C8A96A]/40 bg-[#C8A96A]/5 p-5 space-y-4">
                <div>
                  <p className="text-sm font-bold text-white">How would you like your {tickets.length} QR passes?</p>
                  <p className="text-xs text-white/55">You can change this later from My Event Tickets.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => chooseMode("group")}
                    disabled={!!savingMode}
                    className="text-left rounded-xl border border-white/15 hover:border-[#C8A96A] bg-black/30 p-4 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <Users className="w-6 h-6 text-[#C8A96A] mb-2" />
                    <span className="block text-sm font-bold">One QR for everyone</span>
                    <span className="block text-[11px] text-white/55 mt-0.5">
                      One scan lets all {tickets.length} people in. Best if you arrive together.
                    </span>
                    {savingMode === "group" && <Loader2 className="w-4 h-4 animate-spin text-[#C8A96A] mt-2" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => chooseMode("individual")}
                    disabled={!!savingMode}
                    className="text-left rounded-xl border border-white/15 hover:border-[#C8A96A] bg-black/30 p-4 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <UserIcon className="w-6 h-6 text-[#C8A96A] mb-2" />
                    <span className="block text-sm font-bold">Separate QR for each person</span>
                    <span className="block text-[11px] text-white/55 mt-0.5">
                      Send each friend their own pass, so they can arrive at different times.
                    </span>
                    {savingMode === "individual" && <Loader2 className="w-4 h-4 animate-spin text-[#C8A96A] mt-2" />}
                  </button>
                </div>
              </div>
            )}

            {qrMode === "group" && groupToken && (
              <div className="rounded-2xl border border-[#C8A96A]/40 bg-[#C8A96A]/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-[#C8A96A] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">Group QR · admits {tickets.length} people</p>
                    <p className="text-[11px] text-white/55">Show this one QR at the door. One scan lets your whole group in.</p>
                  </div>
                </div>
                <Link
                  href={`/tickets/group/${groupToken}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0"
                >
                  <QrCode className="w-4 h-4" /> Open group QR
                </Link>
              </div>
            )}

            {(qrMode === "individual" || (qrMode === null && tickets.length <= 1)) && (
              <div className="space-y-3">
                {tickets.map((t, idx) => (
                  <div
                    key={idx}
                    className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-[#C8A96A]/30 transition-all"
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
                        Pass #{idx + 1} &bull; {t.tierName}
                      </span>
                      <div className="text-sm font-bold text-white">{t.customerName}</div>
                      <div className="text-xs text-[#C8A96A] font-mono">{t.ticketCode}</div>
                    </div>

                    <Link
                      href={`/tickets/${t.qrCodeToken}`}
                      className="inline-flex items-center justify-center gap-1.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#070B09] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all self-start sm:self-auto cursor-pointer"
                    >
                      View QR Pass <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}

            {tickets.length > 1 && qrMode !== null && (
              <button
                type="button"
                onClick={() => chooseMode(qrMode === "group" ? "individual" : "group")}
                disabled={!!savingMode}
                className="text-[11px] text-[#C8A96A] hover:text-[#E0C68E] underline underline-offset-2 cursor-pointer disabled:opacity-50"
              >
                {savingMode ? "Saving…" : qrMode === "group" ? "Switch to a separate QR for each person" : "Switch to one QR for the whole group"}
              </button>
            )}
          </div>

          {/* Door Info */}
          <div className="pt-2 text-center text-[11px] text-white/50 border-t border-white/10 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Present your QR code at the door on your mobile phone for scanning.
            </p>
            <p>
              {qrMode === "group"
                ? "The group QR admits everyone once. Anyone already inside is never counted twice."
                : "Each QR code is unique and valid for one admission only."}
            </p>
          </div>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-white/50 hover:text-white underline">
            Return to Tropica NYC Homepage
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TicketSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070B09] flex items-center justify-center text-white">
          Loading verification...
        </div>
      }
    >
      <TicketSuccessContent />
    </Suspense>
  );
}

