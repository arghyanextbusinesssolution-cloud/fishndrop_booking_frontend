"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useBookings } from "@/hooks/useBookings";
import Link from "next/link";
import api from "@/lib/axios";

import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import {
  ShieldCheck,
  CalendarDays,
  Clock,
  Users,
  Sparkles,
  CreditCard,
  Lock,
  QrCode,
  Copy,
  Check,
  Upload,
  AlertCircle,
  FileText
} from "lucide-react";

type PaymentBooking = {
  _id: string;
  totalAmount: number;
  partySize: number;
  bookingDate: string;
  bookingTime: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  cakePrice?: number;
  occasion: string;
  notes?: string;
  cakeDetails?: string;
  remainingAmount?: number;
  bookingType?: string;
  zelleProofUrl?: string;
  zelleVerificationStatus?: string;
};

export default function UserPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId") || "";
  const prefilledTotalAmount = Number(searchParams.get("totalAmount") || 0);
  const prefilledPartySize = Number(searchParams.get("partySize") || 0);
  const prefilledBookingDate = searchParams.get("bookingDate") || "";
  const prefilledBookingTime = searchParams.get("bookingTime") || "";
  const prefilledCustomerName = searchParams.get("customerName") || "";
  const prefilledOccasion = searchParams.get("occasion") || "";
  const prefilledCakePrice = Number(searchParams.get("cakePrice") || 0);
  const { getBookingById, startPayment, startRemainingPayment, loading } = useBookings();
  
  const [booking, setBooking] = useState<PaymentBooking | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "zelle">("stripe");

  // Zelle proof state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);

  const isBalance = searchParams.get("is_balance") === "true";

  const loadBooking = useCallback(async () => {
    if (!bookingId) {
      setPageLoading(false);
      return;
    }

    if (prefilledTotalAmount > 0 && prefilledBookingDate && prefilledBookingTime) {
      setBooking({
        _id: bookingId,
        totalAmount: prefilledTotalAmount,
        partySize: prefilledPartySize,
        bookingDate: prefilledBookingDate,
        bookingTime: prefilledBookingTime,
        customerName: prefilledCustomerName || "Guest",
        customerEmail: "",
        customerPhone: "",
        cakePrice: prefilledCakePrice,
        occasion: prefilledOccasion || "other",
        bookingType: "private_event",
      });
      setPageLoading(false);
      return;
    }

    setPageLoading(true);
    try {
      const data = await getBookingById(bookingId);
      setBooking(data);
    } catch {
      setBooking(null);
    } finally {
      setPageLoading(false);
    }
  }, [bookingId, getBookingById, prefilledTotalAmount, prefilledPartySize, prefilledBookingDate, prefilledBookingTime, prefilledCustomerName, prefilledOccasion, prefilledCakePrice]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  const handleProceedToStripe = async () => {
    if (!booking?._id) return;
    try {
      const url = isBalance
        ? await startRemainingPayment(booking._id)
        : await startPayment(booking._id);
      if (url && typeof window !== "undefined") {
        window.location.href = url;
      }
    } catch {
      toast.error("Failed to start payment");
    }
  };

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Screenshot file size should be less than 10MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setScreenshotPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, type: "email" | "memo") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
    }
    toast.success(`Copied ${type === "email" ? "Zelle email" : "Booking ID"} to clipboard!`);
  };

  const handleProceedToZelle = async () => {
    if (!booking?._id) return;
    if (!screenshotPreview) {
      toast.error("Please upload your Zelle payment screenshot proof");
      return;
    }

    setUploadingProof(true);
    try {
      await api.post("/payments/upload-zelle-proof", {
        bookingId: booking._id,
        imageBase64: screenshotPreview,
        isBalance: isBalance
      });
      toast.success(isBalance
        ? "Balance payment proof uploaded! Redirecting to verification status..."
        : "Zelle payment proof uploaded! Redirecting to verification status...");

      router.push(`/user/payment/zelle-pending?bookingId=${booking._id}${isBalance ? "&isBalance=true" : ""}`);
    } catch (err: any) {
      console.error("Zelle proof upload error:", err);
      toast.error(err?.response?.data?.message || "Failed to upload Zelle proof. Please try again.");
    } finally {
      setUploadingProof(false);
    }
  };

  if (pageLoading) return <LoadingSpinner fullPage message="Preparing secure payment details..." />;

  if (!booking) {
    return (
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
        <p className="text-lg font-semibold text-[var(--text-primary)]">Booking not found</p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">We could not load your booking details for payment.</p>
      </div>
    );
  }

  const isPrivate = booking.bookingType === "private_event";
  const displayAmount = isBalance ? (booking.remainingAmount || booking.totalAmount) : booking.totalAmount;
  const depositPaid = booking.totalAmount - (booking.remainingAmount || 0);
  const zelleMemoText = `#${booking._id.slice(-6).toUpperCase()}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-4">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold"
          style={{ background: "rgba(229,199,122,0.15)", color: "var(--accent)" }}
        >
          <ShieldCheck size={13} />
          {isBalance ? "Pay Remaining Balance" : "Complete Your Booking"}
        </span>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_400px]">
        {/* ── LEFT: Booking Details ── */}
        <div className="flex flex-col gap-5">
          {/* Summary card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Booking Summary</p>
                <h2 className="mt-0.5 text-xl font-bold text-[var(--text-primary)]">
                  {isPrivate ? "Exclusive Venue Reservation" : "Table Reservation"}
                </h2>
              </div>
              {isPrivate && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold"
                  style={{ background: "rgba(229,199,122,0.15)", color: "var(--accent)" }}
                >
                  Private Event
                </span>
              )}
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.1)" }}>
                    <CalendarDays size={15} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Date</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {format(new Date(booking.bookingDate), "PPP")}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.1)" }}>
                    <Clock size={15} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Time</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.bookingTime}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.1)" }}>
                    <Users size={15} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Guests</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.partySize} people</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg p-2" style={{ background: "rgba(229,199,122,0.1)" }}>
                    <Sparkles size={15} className="text-[var(--accent)]" />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">{isPrivate ? "Venue" : "Occasion"}</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {isPrivate ? "Entire Venue Buyout" : booking.occasion}
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Guest Name</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.customerName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Billing breakdown card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-6 py-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Payment Breakdown</p>
            </div>
            <div className="px-6 py-5 space-y-3">
              {isPrivate && isBalance ? (
                <>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Total Venue Cost</span>
                    <span className="font-semibold text-[var(--text-primary)]">${booking.totalAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Deposit Already Paid</span>
                    <span className="font-semibold text-emerald-500">−${depositPaid.toLocaleString()}</span>
                  </div>
                  <div className="mt-1 border-t border-[var(--border)] pt-3 flex items-center justify-between">
                    <span className="text-base font-bold text-[var(--text-primary)]">Remaining Balance Due</span>
                    <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                      ${displayAmount?.toLocaleString()}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[var(--text-primary)]">Total Charge</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                    ${displayAmount?.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Payment Method Selection & Checkout Panel ── */}
        <div className="flex flex-col gap-5">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-[var(--accent)]" />
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Select Payment Method</p>
              </div>
            </div>

            {/* Payment Method Selector Tabs */}
            <div className="p-4 bg-[var(--surface-2)] border-b border-[var(--border)] grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("stripe")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all border ${
                  paymentMethod === "stripe"
                    ? "bg-[#E5C77A] text-[#0F2D23] border-[#E5C77A] shadow"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-gray-500"
                }`}
              >
                <CreditCard size={15} />
                Stripe (Card)
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("zelle")}
                className={`flex items-center justify-center gap-2 py-3 px-3 rounded-xl font-bold text-xs transition-all border ${
                  paymentMethod === "zelle"
                    ? "bg-[#E5C77A] text-[#0F2D23] border-[#E5C77A] shadow"
                    : "bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:border-gray-500"
                }`}
              >
                <QrCode size={15} />
                Zelle Pay
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {paymentMethod === "stripe" ? (
                /* STRIPE PAYMENT CONTENT */
                <>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Pay via Stripe</h3>
                    <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                      You&apos;ll be redirected to Stripe&apos;s secure checkout. We never store your card details.
                    </p>
                  </div>

                  {/* Amount preview */}
                  <div
                    className="rounded-xl px-5 py-4 flex items-center justify-between"
                    style={{ background: "rgba(229,199,122,0.08)", border: "1px solid rgba(229,199,122,0.2)" }}
                  >
                    <div>
                      <p className="text-xs text-[var(--text-secondary)]">{isBalance ? "Due Now" : "Charge Total"}</p>
                      <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                        ${displayAmount?.toLocaleString()}
                      </p>
                    </div>
                    <CreditCard size={28} className="opacity-30 text-[var(--accent)]" />
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mt-4 flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms-stripe"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label htmlFor="terms-stripe" className="text-sm text-[var(--text-secondary)]">
                      I agree to the{' '}
                      <Link href="/terms-and-conditions" className="font-medium underline" style={{ color: "var(--accent)" }}>
                        Terms & Conditions
                      </Link>
                    </label>
                  </div>

                  <button
                    disabled={loading || !termsAccepted}
                    onClick={handleProceedToStripe}
                    className="mt-4 w-full rounded-xl py-4 text-base font-bold transition-all disabled:opacity-60 shadow-lg"
                    style={{ background: "#E5C77A", color: "#0F2D23" }}
                  >
                    {loading ? "Opening Stripe…" : `Pay $${displayAmount?.toLocaleString()} via Stripe`}
                  </button>

                  <p className="text-center text-xs text-[var(--text-secondary)]">
                    Test card: <span className="font-semibold text-[var(--text-primary)]">4242 4242 4242 4242</span>
                    {" "}· any future date · any CVC
                  </p>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)]">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>256-bit SSL encrypted · Powered by Stripe</span>
                  </div>
                </>
              ) : (
                /* ZELLE PAYMENT CONTENT */
                <>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Pay via Zelle</h3>
                    <p className="mt-1.5 text-xs text-[var(--text-secondary)] leading-relaxed">
                      Send payment using Zelle, then upload your transaction screenshot below for backend team verification.
                    </p>
                  </div>

                  {/* Zelle Instructions Box */}
                  <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)]">Zelle Tag Recipient:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-[var(--accent)]">
                        <span>tropica-nyc</span>
                        <button
                          type="button"
                          onClick={() => handleCopy("tropica-nyc", "memo")}
                          className="p-1 hover:text-white transition-colors"
                        >
                          {copiedMemo ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)]">Exact Amount:</span>
                      <span className="font-bold text-lg text-emerald-400">${displayAmount?.toLocaleString()}</span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">Required Zelle Memo:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-[#E5C77A]">
                        <span>{zelleMemoText}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(zelleMemoText, "memo")}
                          className="p-1 hover:text-white transition-colors"
                        >
                          {copiedMemo ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-start gap-2 text-xs text-amber-200">
                    <AlertCircle size={15} className="mt-0.5 text-amber-400 shrink-0" />
                    <span>
                      IMPORTANT: You MUST include <strong>{zelleMemoText}</strong> in your Zelle transfer memo for automatic backend verification.
                    </span>
                  </div>

                  {/* Screenshot upload drop zone */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Upload Zelle Payment Screenshot</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Uploateded to Cloudinary</span>
                    </label>

                    {screenshotPreview ? (
                      <div className="relative rounded-xl border border-[var(--accent)] overflow-hidden bg-black/40 group">
                        <img
                          src={screenshotPreview}
                          alt="Zelle screenshot preview"
                          className="w-full max-h-48 object-contain py-2"
                        />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label className="px-3 py-1.5 bg-[#E5C77A] text-[#0F2D23] font-bold text-xs rounded-lg cursor-pointer hover:bg-yellow-400">
                            Change Image
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleScreenshotChange}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setScreenshotPreview(null)}
                            className="px-3 py-1.5 bg-red-600 text-white font-bold text-xs rounded-lg hover:bg-red-700"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] rounded-xl p-5 cursor-pointer transition-colors bg-[var(--surface-2)] hover:bg-[var(--surface)] text-center group">
                        <Upload size={24} className="text-[var(--text-secondary)] group-hover:text-[var(--accent)] transition-colors mb-1.5" />
                        <span className="text-xs font-semibold text-[var(--text-primary)]">Click or Drag Zelle Receipt Here</span>
                        <span className="text-[10px] text-[var(--text-secondary)] mt-0.5">PNG, JPG, WEBP or JPEG up to 10MB</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  {/* Terms & Conditions */}
                  <div className="mt-4 flex items-start space-x-2">
                    <input
                      type="checkbox"
                      id="terms-zelle"
                      checked={termsAccepted}
                      onChange={e => setTermsAccepted(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-gray-300 text-accent focus:ring-accent"
                    />
                    <label htmlFor="terms-zelle" className="text-sm text-[var(--text-secondary)]">
                      I agree to the{' '}
                      <Link href="/terms-and-conditions" className="font-medium underline" style={{ color: "var(--accent)" }}>
                        Terms & Conditions
                      </Link>
                    </label>
                  </div>

                  <button
                    disabled={uploadingProof || !termsAccepted || !screenshotPreview}
                    onClick={handleProceedToZelle}
                    className="mt-4 w-full rounded-xl py-4 text-base font-bold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
                    style={{ background: "#E5C77A", color: "#0F2D23" }}
                  >
                    {uploadingProof ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-[#0F2D23] border-t-transparent animate-spin" />
                        <span>Uploading to Cloudinary & Submitting…</span>
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        <span>Submit Zelle Proof (${displayAmount?.toLocaleString()})</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] pt-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Uploads securely to Cloudinary · Pending GHL email verification</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

