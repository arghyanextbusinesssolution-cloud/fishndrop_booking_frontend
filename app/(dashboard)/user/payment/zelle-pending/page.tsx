"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Booking } from "@/types";
import { Loader2, CheckCircle2, AlertTriangle, Copy, Check, Upload, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import Image from "next/image";

function ZellePendingContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("bookingId");
  const isBalanceParam = searchParams.get("isBalance") === "true";

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Upload proof state
  const [uploadingProof, setUploadingProof] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!bookingId) return;
    try {
      const { data } = await api.get(`/bookings/public-status/${bookingId}`);
      if (data.success && data.booking) {
        setBooking(data.booking);
        setError(null);
      }
    } catch (err: any) {
      console.error("Failed to fetch Zelle booking status:", err);
      // Fallback try protected endpoint
      try {
        const { data: protData } = await api.get(`/bookings/${bookingId}`);
        if (protData.success && protData.booking) {
          setBooking(protData.booking);
          setError(null);
        }
      } catch (err2) {
        setError("Failed to load booking details.");
      }
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    void fetchStatus();
    // Poll every 4 seconds until confirmed or rejected
    const interval = setInterval(() => {
      void fetchStatus();
    }, 4000);

    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCopyBookingId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopiedId(true);
    toast.success("Booking ID copied!");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText("bookings@tropica.nyc");
    setCopiedEmail(true);
    toast.success("Zelle email copied!");
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookingId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be under 10MB");
      return;
    }

    setUploadingProof(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setScreenshotPreview(base64);
      // Detect if this is a balance payment from URL param or booking state
      const isBalanceUpload = isBalanceParam || (booking?.paymentStatus === "deposit_paid" && (booking?.remainingAmount ?? 0) > 0);
      try {
        const { data } = await api.post("/payments/upload-zelle-proof", {
          bookingId,
          imageBase64: base64,
          isBalance: isBalanceUpload
        });
        if (data.success) {
          toast.success("Zelle screenshot uploaded! Booking is pending GHL verification.");
          await fetchStatus();
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to upload screenshot");
      } finally {
        setUploadingProof(false);
      }
    };
    reader.readAsDataURL(file);
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-[#C8A96A]" />
        <p className="text-sm font-semibold text-gray-600">Loading Zelle payment details...</p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
        <AlertTriangle className="w-12 h-12 text-amber-500" />
        <h2 className="text-xl font-bold text-gray-900">Booking Not Found</h2>
        <p className="text-sm text-gray-600">We could not locate this reservation ID. Please check your dashboard.</p>
        <button
          onClick={() => router.push("/user/bookings")}
          className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-xs font-bold uppercase tracking-wider"
        >
          Go to My Bookings
        </button>
      </div>
    );
  }

  const isConfirmed = booking.status === "confirmed" || booking.zelleVerificationStatus === "verified";
  const isMismatched = booking.zelleVerificationStatus === "mismatched" || booking.zelleVerificationStatus === "manual_review";
  // Detect if this is a remaining balance payment
  const isBalancePayment = isBalanceParam || (booking.paymentStatus === "deposit_paid" && (booking.remainingAmount ?? 0) > 0);
  // Show the correct amount: remaining balance if balance context, else deposit/full amount
  const expectedAmount = isBalancePayment
    ? (booking.remainingAmount ?? 0)
    : booking.bookingType === "private_event"
      ? (booking.depositAmount || booking.totalAmount)
      : booking.totalAmount;
  const proofUrl = isBalancePayment ? (booking.remainingZelleProofUrl || booking.zelleProofUrl) : booking.zelleProofUrl;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-[#fcfbfa]">
      <div className="max-w-xl mx-auto space-y-6">

        {/* STATUS CARD 1: CONFIRMED */}
        {isConfirmed ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-200 space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-widest font-extrabold rounded-full inline-block">
                Confirmed &amp; Locked 🎉
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">Booking Verified &amp; Confirmed!</h1>
              <p className="text-sm text-gray-600">
                Our backend team verified your Zelle payment! Your table reservation is officially confirmed and your slot is locked.
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-2 text-left text-xs text-emerald-950">
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Booking ID:</span>
                <span className="font-mono font-bold">{booking._id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Customer:</span>
                <span>{booking.customerName} ({booking.customerEmail})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Date &amp; Time:</span>
                <span>{new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-emerald-800">Verified Amount:</span>
                <span className="font-bold text-emerald-900">${expectedAmount.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => router.push("/user/bookings")}
              className="w-full py-4 bg-[#0F4C3A] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#155e49] shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>View My Bookings</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : isMismatched ? (
          /* STATUS CARD 2: MISMATCHED / MANUAL REVIEW */
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-300 space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-9 h-9" />
            </div>

            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[10px] uppercase tracking-widest font-extrabold rounded-full inline-block">
                Manual Review Required
              </span>
              <h1 className="text-2xl font-black text-gray-900">Payment Details Mismatched</h1>
              <p className="text-sm text-gray-600">
                Our backend team detected a mismatched payment amount or detail. Your booking remains <strong>Pending</strong> while our support team looks into it.
              </p>
            </div>

            {booking.zelleNotes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold">System Note:</p>
                <p className="mt-0.5 italic">{booking.zelleNotes}</p>
              </div>
            )}

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Booking ID:</span>
                <span className="font-mono font-bold text-gray-900">{booking._id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Expected Amount:</span>
                <span className="font-bold text-gray-900">${expectedAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">Questions? Contact us at bookings@tropica.nyc</p>
              <button
                onClick={() => router.push("/user/bookings")}
                className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* STATUS CARD 3: PENDING GHL VERIFICATION */
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-200 space-y-6 animate-in fade-in duration-500">

            {/* Radar / Pulsing Indicator */}
            <div className="text-center space-y-3">
              <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <div className="relative w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-lg">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              </div>

              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-100 text-purple-900 text-[10px] uppercase tracking-widest font-extrabold rounded-full">
                <Loader2 className="w-3 h-3 animate-spin text-purple-700" />
                Backend Team Verifying Payment...
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                {isBalancePayment ? "Balance Payment Submitted" : "Zelle Payment Submitted"}
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
                {isBalancePayment
                  ? <>Your <strong>remaining balance</strong> of <strong>${expectedAmount.toFixed(2)}</strong> is Pending. Our backend team verifies your Zelle email and marks your booking as <strong>fully paid</strong> automatically!</>
                  : <>Your booking is <strong>Pending</strong>. Our backend team automatically reads your Zelle confirmation email, matches your <strong>Booking ID</strong> &amp; <strong>Amount</strong>, and confirms your slot!</>}
              </p>
            </div>

            {/* COPY BOOKING ID HIGHLIGHT BOX */}
            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl text-white space-y-2 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-purple-200 font-bold">Your Booking ID (Memo Requirement)</span>
                <span className="text-[10px] bg-purple-800 text-purple-100 px-2 py-0.5 rounded uppercase font-bold">Must Include in Zelle Memo</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-black/30 p-2.5 rounded-lg border border-purple-400/30">
                <span className="font-mono font-extrabold text-lg tracking-wider text-amber-300 select-all overflow-hidden text-ellipsis">
                  {booking._id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyBookingId}
                  className="px-3 py-1.5 bg-amber-400 text-purple-950 font-bold rounded-lg text-xs hover:bg-amber-300 transition flex items-center gap-1.5 shrink-0"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId ? "Copied!" : "Copy ID"}
                </button>
              </div>
            </div>

            {/* Zelle Recipient Info */}
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Email</p>
                  <p className="text-sm font-extrabold text-purple-950 font-mono">bookings@tropica.nyc</p>
                  <p className="text-[11px] font-bold text-purple-800">Tag: <span className="font-mono text-purple-950">tropica-nyc</span></p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="px-3 py-1 bg-purple-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-purple-800 transition"
                >
                  {copiedEmail ? "Copied!" : "Copy Email"}
                </button>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200/60 text-xs">
                <span className="font-semibold text-purple-900">
                  {isBalancePayment ? "Remaining Balance Due:" : "Exact Payment Amount:"}
                </span>
                <span className="text-base font-black text-emerald-700">${expectedAmount.toFixed(2)}</span>
              </div>
            </div>

            {/* Screenshot Upload Section */}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Payment Screenshot Proof</h3>
                  <p className="text-[11px] text-gray-500">
                    {proofUrl ? `✓ ${isBalancePayment ? "Balance" : "Deposit"} screenshot uploaded & sent to backend team` : `Upload ${isBalancePayment ? "remaining balance" : "payment"} proof screenshot to assist backend team verification`}
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  proofUrl ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}>
                  {proofUrl ? "Uploaded" : "Pending Upload"}
                </span>
              </div>

              {(proofUrl || screenshotPreview) && (
                <div className="relative rounded-lg overflow-hidden border border-gray-300 max-h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshotPreview || proofUrl || ""}
                    alt="Uploaded Zelle Screenshot"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="pt-1">
                <label className="block w-full cursor-pointer">
                  <div className="w-full py-2.5 px-4 bg-white border border-dashed border-purple-300 rounded-xl text-center hover:border-purple-500 transition flex items-center justify-center gap-2 text-xs font-bold text-purple-800">
                    {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{proofUrl ? `Change ${isBalancePayment ? "Balance" : "Deposit"} Screenshot` : `Upload ${isBalancePayment ? "Balance Payment" : "Zelle"} Screenshot`}</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleUploadScreenshot}
                    disabled={uploadingProof}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Notice Footer */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>How it works:</strong> Our backend team verifies incoming Zelle payment emails. Once matched with Booking ID <strong>{booking._id}</strong>, your reservation automatically flips to confirmed! You can leave this page open or check back in your dashboard.
              </p>
            </div>

            <button
              onClick={() => router.push("/user/bookings")}
              className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-black transition"
            >
              Return to My Bookings
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function ZellePendingPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm font-semibold">Loading verification page...</div>}>
      <ZellePendingContent />
    </Suspense>
  );
}
