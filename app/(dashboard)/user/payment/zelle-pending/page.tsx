"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { Booking } from "@/types";
import { Loader2, CheckCircle2, AlertTriangle, Copy, Upload, ArrowRight, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { formatBookingDate } from "@/lib/utils";

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
  const [uploadingProof, setUploadingProof] = useState(false);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!bookingId) return;
    try {
      const { data } = await api.get(`/bookings/public-status/${bookingId}`);
      if (data.success && data.booking) { setBooking(data.booking); setError(null); }
    } catch {
      try {
        const { data: protData } = await api.get(`/bookings/${bookingId}`);
        if (protData.success && protData.booking) { setBooking(protData.booking); setError(null); }
      } catch { setError("Failed to load booking details."); }
    } finally { setLoading(false); }
  }, [bookingId]);

  useEffect(() => {
    void fetchStatus();
    const interval = setInterval(() => { void fetchStatus(); }, 4000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const handleCopyBookingId = () => {
    if (!bookingId) return;
    navigator.clipboard.writeText(bookingId);
    setCopiedId(true); toast.success("Booking ID copied!"); setTimeout(() => setCopiedId(false), 2000);
  };
  const handleCopyEmail = () => {
    navigator.clipboard.writeText("tropicapayments@gmail.com");
    setCopiedEmail(true); toast.success("Zelle Email copied!"); setTimeout(() => setCopiedEmail(false), 2000);
  };

  const handleUploadScreenshot = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bookingId) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File size must be under 10MB"); return; }
    setUploadingProof(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setScreenshotPreview(base64);
      const isBalanceUpload = isBalanceParam || (booking?.paymentStatus === "deposit_paid" && (booking?.remainingAmount ?? 0) > 0);
      try {
        const { data } = await api.post("/payments/upload-zelle-proof", { bookingId, imageBase64: base64, isBalance: isBalanceUpload });
        if (data.success) { toast.success("Screenshot uploaded! Pending GHL verification."); await fetchStatus(); }
      } catch (err: any) { toast.error(err.response?.data?.message || "Failed to upload screenshot"); }
      finally { setUploadingProof(false); }
    };
    reader.readAsDataURL(file);
  };

  if (loading) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-[#C8A96A]" />
      <p className="text-sm font-semibold text-gray-600">Loading Zelle payment details...</p>
    </div>
  );

  if (error || !booking) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md mx-auto">
      <AlertTriangle className="w-12 h-12 text-amber-500" />
      <h2 className="text-xl font-bold text-gray-900">Booking Not Found</h2>
      <p className="text-sm text-gray-600">We could not locate this reservation ID. Please check your dashboard.</p>
      <button onClick={() => router.push("/user/bookings")} className="px-6 py-2.5 bg-[#0F4C3A] text-white rounded-xl text-xs font-bold uppercase tracking-wider">Go to My Bookings</button>
    </div>
  );

  const isConfirmed = booking.status === "confirmed" || booking.zelleVerificationStatus === "verified";
  const isMismatched = booking.zelleVerificationStatus === "mismatched" || booking.zelleVerificationStatus === "manual_review";
  const isBalancePayment = isBalanceParam || (booking.paymentStatus === "deposit_paid" && (booking.remainingAmount ?? 0) > 0);
  const remainingAfter = booking.remainingAmount ?? 0;
  const isFullyPaid = booking.paymentStatus === "paid" || booking.remainingPaymentStatus === "paid" || remainingAfter <= 0;

  const verifiedBreakdown = (booking.paymentBreakdown ?? []).filter((p: any) => p.status === "verified");
  const verifiedTotal = verifiedBreakdown.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0) || (booking.depositAmount || booking.totalAmount || 0);
  const latestVerified = verifiedBreakdown[verifiedBreakdown.length - 1];
  const thisPaymentAmount = latestVerified ? latestVerified.amount : (booking.depositAmount || booking.totalAmount || 0);

  const expectedAmount = isBalancePayment ? remainingAfter : booking.bookingType === "private_event" ? (booking.depositAmount || booking.totalAmount) : booking.totalAmount;
  const proofUrl = isBalancePayment ? (booking.remainingZelleProofUrl || booking.zelleProofUrl) : booking.zelleProofUrl;

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 bg-[#fcfbfa]">
      <div className="max-w-xl mx-auto space-y-6">

        {isConfirmed ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-emerald-200 space-y-6 text-center animate-in zoom-in-95 duration-500">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-[10px] uppercase tracking-widest font-extrabold rounded-full inline-block">
                {isFullyPaid ? "Fully Paid & Confirmed" : "Installment Verified"}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900">
                {isFullyPaid ? "Booking Confirmed!" : "Installment Verified!"}
              </h1>
              <p className="text-sm text-gray-600">
                {isFullyPaid
                  ? "Your Zelle payment has been fully verified. Your venue reservation is confirmed and your slot is locked!"
                  : <>Your payment of <strong>${thisPaymentAmount.toFixed(2)}</strong> has been verified. You still have <strong className="text-amber-600">${remainingAfter.toFixed(2)}</strong> remaining before your event.</>
                }
              </p>
            </div>

            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1 text-left text-xs text-emerald-950">
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Booking ID:</span>
                <span className="font-mono font-bold">{booking._id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Customer:</span>
                <span>{booking.customerName} ({booking.customerEmail})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Date & Time:</span>
                <span>{formatBookingDate(booking.bookingDate, { month: "short", day: "numeric", year: "numeric" })} at {booking.bookingTime}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">This Payment:</span>
                <span className="font-bold text-emerald-700">+${thisPaymentAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-emerald-200/60">
                <span className="font-semibold text-emerald-800">Total Paid So Far:</span>
                <span className="font-bold text-emerald-900">${verifiedTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-emerald-800">Remaining Balance:</span>
                <span className={`font-bold ${isFullyPaid ? "text-emerald-600" : "text-amber-600"}`}>
                  {isFullyPaid ? "$0.00 — Fully Settled" : `$${remainingAfter.toFixed(2)} due`}
                </span>
              </div>
            </div>

            {!isFullyPaid && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 text-left">
                <p className="font-bold mb-0.5">Balance Still Due</p>
                <p>You have <strong>${remainingAfter.toFixed(2)}</strong> remaining. Please pay before the 72-hour event deadline.</p>
              </div>
            )}

            <button
              onClick={() => router.push(isFullyPaid ? "/user/bookings" : `/user/payment?is_balance=true&bookingId=${bookingId}`)}
              className="w-full py-4 bg-[#0F4C3A] text-white rounded-xl font-extrabold text-xs uppercase tracking-widest hover:bg-[#155e49] shadow-lg transition flex items-center justify-center gap-2"
            >
              <span>{isFullyPaid ? "View My Bookings" : "Pay Remaining Balance"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!isFullyPaid && (
              <button onClick={() => router.push("/user/bookings")} className="w-full py-2 text-gray-500 text-xs underline hover:text-gray-700 transition">
                Back to My Bookings
              </button>
            )}
          </div>

        ) : isMismatched ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-amber-300 space-y-6 animate-in fade-in duration-500">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <AlertTriangle className="w-9 h-9" />
            </div>
            <div className="text-center space-y-2">
              <span className="px-3 py-1 bg-amber-100 text-amber-900 text-[10px] uppercase tracking-widest font-extrabold rounded-full inline-block">Manual Review Required</span>
              <h1 className="text-2xl font-black text-gray-900">Payment Details Mismatched</h1>
              <p className="text-sm text-gray-600">Our backend team detected a mismatched payment. Your booking remains <strong>Pending</strong> while our support team looks into it.</p>
            </div>
            {booking.zelleNotes && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                <p className="font-bold">System Note:</p><p className="mt-0.5 italic">{booking.zelleNotes}</p>
              </div>
            )}
            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-200">
                <span className="font-semibold text-gray-600">Booking ID:</span>
                <span className="font-mono font-bold text-gray-900">{booking._id}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="font-semibold text-gray-600">Expected Amount:</span>
                <span className="font-bold text-gray-900">${expectedAmount.toFixed(2)}</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <p className="text-xs text-gray-500">Questions? Contact us at bookings@tropica.nyc</p>
              <button onClick={() => router.push("/user/bookings")} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-xs uppercase tracking-wider">Go to Dashboard</button>
            </div>
          </div>

        ) : (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-purple-200 space-y-6 animate-in fade-in duration-500">
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
                  : <>Your booking is <strong>Pending</strong>. Our backend team reads your Zelle confirmation email, matches your <strong>Booking ID</strong> and confirms your slot!</>}
              </p>
            </div>

            <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl text-white space-y-3 shadow-lg">
              <div className="flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-widest text-purple-200 font-bold">Your Zelle Memo Code</span>
                <span className="text-[10px] bg-purple-800 text-purple-100 px-2 py-0.5 rounded uppercase font-bold">Must Include in Memo</span>
              </div>
              <div className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-lg border border-amber-400/40">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-purple-200">Recommended Short Memo:</p>
                  <span className="font-mono font-extrabold text-2xl tracking-wider text-amber-300 select-all">#{booking._id.slice(-6).toUpperCase()}</span>
                </div>
                <button type="button" onClick={() => { navigator.clipboard.writeText(`#${booking._id.slice(-6).toUpperCase()}`); toast.success("Memo code copied!"); }}
                  className="px-3 py-2 bg-amber-400 text-purple-950 font-bold rounded-lg text-xs hover:bg-amber-300 transition flex items-center gap-1.5 shrink-0 shadow">
                  <Copy className="w-3.5 h-3.5" /><span>Copy Memo</span>
                </button>
              </div>
              <div className="flex items-center justify-between text-xs pt-1 border-t border-purple-400/20 text-purple-200">
                <span className="font-mono opacity-80">Full ID: {booking._id}</span>
                <button type="button" onClick={handleCopyBookingId} className="text-amber-300 hover:text-amber-200 underline text-[11px] font-semibold">
                  {copiedId ? "Copied Full ID" : "Copy Full ID"}
                </button>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Recipient Email</p>
                  <p className="text-sm font-extrabold text-purple-950 font-mono">tropicapayments@gmail.com</p>
                </div>
                <button type="button" onClick={handleCopyEmail} className="px-3 py-1 bg-purple-700 text-white text-[10px] font-bold rounded-lg uppercase tracking-wider hover:bg-purple-800 transition">
                  {copiedEmail ? "Copied!" : "Copy Email"}
                </button>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-purple-200/60 text-xs">
                <span className="font-semibold text-purple-900">{isBalancePayment ? "Remaining Balance Due:" : "Exact Payment Amount:"}</span>
                <span className="text-base font-black text-emerald-700">${expectedAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 space-y-3">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Payment Screenshot Proof</h3>
                  <p className="text-[11px] text-gray-500">
                    {proofUrl ? `Screenshot uploaded & sent to backend team` : `Upload payment proof to assist verification`}
                  </p>
                </div>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${proofUrl ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                  {proofUrl ? "Uploaded" : "Pending Upload"}
                </span>
              </div>
              {(proofUrl || screenshotPreview) && (
                <div className="relative rounded-lg overflow-hidden border border-gray-300 max-h-48">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={screenshotPreview || proofUrl || ""} alt="Uploaded Zelle Screenshot" className="w-full h-full object-cover" />
                </div>
              )}
              <label className="block w-full cursor-pointer">
                <div className="w-full py-2.5 px-4 bg-white border border-dashed border-purple-300 rounded-xl text-center hover:border-purple-500 transition flex items-center justify-center gap-2 text-xs font-bold text-purple-800">
                  {uploadingProof ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{proofUrl ? "Change Screenshot" : "Upload Zelle Screenshot"}</span>
                </div>
                <input type="file" accept="image/*" onChange={handleUploadScreenshot} disabled={uploadingProof} className="hidden" />
              </label>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>How it works:</strong> Our backend team verifies incoming Zelle payment emails. Once matched with Booking ID <strong>{booking._id}</strong>, your reservation automatically flips to confirmed!
              </p>
            </div>

            <button onClick={() => router.push("/user/bookings")} className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs uppercase tracking-widest font-bold hover:bg-black transition">
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
