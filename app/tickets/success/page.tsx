"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
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
  QrCode,
  Copy,
  Share2
} from "lucide-react";
import { LoungeBackdrop } from "@/components/auth/TropicaAuthShell";

interface IssuedTicket {
  _id: string;
  ticketCode: string;
  tierName: string;
  customerName: string;
  qrCodeToken?: string;
  isBuyerSeat: boolean;
  holderStatus: "unassigned" | "pending" | "accepted";
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
  const [copied, setCopied] = useState(false);

  const shareUrl =
    orderData?.shareToken && typeof window !== "undefined" ? `${window.location.origin}/tickets/share/${orderData.shareToken}` : "";

  const copyShare = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Link copied");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copy failed. Long-press the link to copy it.");
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: eventData?.title, text: `I got you a ticket for ${eventData?.title}! Claim it here:`, url: shareUrl });
      } catch {
        /* closed */
      }
    } else void copyShare();
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
      <div className="relative isolate min-h-screen bg-[#0b0704] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <LoungeBackdrop behind />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-[#C8A96A]"></div>
        <h2 className="text-xl font-bold text-white">Verifying Stripe Payment...</h2>
        <p className="text-xs text-white/50">Issuing secure QR tickets and generating admission passes.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative isolate min-h-screen bg-[#0b0704] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <LoungeBackdrop behind />
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
    <div className="relative isolate min-h-screen bg-[#0b0704] text-white py-12 px-4 sm:px-6">
      <LoungeBackdrop behind />
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

          {/* Your ticket + share link for the extra seats */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/80 flex items-center gap-2">
              <Ticket className="w-4 h-4 text-[#C8A96A]" /> Your Tickets ({tickets.length})
            </h3>

            {tickets
              .filter((t) => t.isBuyerSeat || !orderData?.shareToken)
              .map((t) => (
                <div
                  key={t._id || t.ticketCode}
                  className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Your ticket &bull; {t.tierName}</span>
                    <div className="text-sm font-bold text-white">{t.customerName}</div>
                    <div className="text-xs text-[#C8A96A] font-mono">{t.ticketCode}</div>
                  </div>
                  <Link
                    href="/user/tickets"
                    className="inline-flex items-center justify-center gap-1.5 bg-[#C8A96A] hover:bg-[#d8b97a] text-[#1a1208] px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider self-start sm:self-auto"
                  >
                    <QrCode className="w-3.5 h-3.5" /> My live QR
                  </Link>
                </div>
              ))}

            {orderData?.shareToken && (
              <div className="rounded-2xl border border-[#C8A96A]/40 bg-[#C8A96A]/5 p-5 space-y-3">
                <div className="flex items-start gap-3">
                  <Users className="w-6 h-6 text-[#C8A96A] shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-white">
                      Share your other {tickets.length - 1} ticket{tickets.length - 1 === 1 ? "" : "s"}
                    </p>
                    <p className="text-[11px] text-white/55">
                      Send this link to your friends. Each one verifies their phone and enters their name, then you accept or
                      reject them in My Event Tickets. Everyone gets their own ticket and can arrive at any time.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={shareUrl}
                    onFocus={(e) => e.target.select()}
                    className="flex-1 min-w-0 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-[11px] font-mono text-white/80"
                  />
                  <button onClick={copyShare} className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg border border-white/15 text-[11px] hover:bg-white/5 cursor-pointer">
                    {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />} Copy
                  </button>
                  <button onClick={shareLink} className="shrink-0 inline-flex items-center gap-1 px-3 rounded-lg bg-[#C8A96A] text-[#1a1208] text-[11px] font-bold cursor-pointer">
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
                <Link href="/user/tickets" className="inline-flex items-center gap-1 text-[11px] text-[#C8A96A] underline underline-offset-2">
                  Manage guests <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          {/* Door Info */}
          <div className="pt-2 text-center text-[11px] text-white/50 border-t border-white/10 space-y-1">
            <p className="flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              Present your QR code at the door on your mobile phone for scanning.
            </p>
            <p>Each QR is live and changes every 5 minutes, so screenshots stop working.</p>
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
        <div className="relative isolate min-h-screen bg-[#0b0704] flex items-center justify-center text-white">
          <LoungeBackdrop behind />
          Loading verification...
        </div>
      }
    >
      <TicketSuccessContent />
    </Suspense>
  );
}

