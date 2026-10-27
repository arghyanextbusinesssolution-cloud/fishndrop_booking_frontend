"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { useBookings } from "@/hooks/useBookings";
import Link from "next/link";
import api from "@/lib/axios";
import { formatBookingDate } from "@/lib/utils";

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
  depositAmount?: number;
  remainingAmount?: number;
  bookingType?: string;
  paymentBreakdown?: Array<{
    _id?: string;
    amount: number;
    paymentMethod: "card" | "zelle" | "cash" | "bank_transfer" | "other";
    paymentType: "deposit" | "balance_partial" | "balance_full" | "food_catering" | "manual";
    status: "verified" | "pending";
    transactionId?: string;
    proofUrl?: string;
    iterationIndex?: number;
    notes?: string;
    paidAt: string;
  }>;
  zelleProofUrl?: string;
  remainingZelleProofUrl?: string;
  zelleVerificationStatus?: string;
  remainingZelleVerificationStatus?: string;
  offerPrice?: number;
  foodBasePrice?: number;
  foodPaymentStatus?: string;
  foodZelleProofUrl?: string;
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

  // Partial breakdown payment state for balance
  const [paymentPlanMode, setPaymentPlanMode] = useState<"full" | "custom">("full");
  const [customAmountInput, setCustomAmountInput] = useState<string>("");

  // Zelle proof state
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedMemo, setCopiedMemo] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  const isBalance = searchParams.get("is_balance") === "true";
  const isFood = searchParams.get("is_food") === "true";

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
      if (data?.remainingAmount && data.remainingAmount > 0) {
        // Default custom breakdown to 50% or remaining
        const half = Math.round((data.remainingAmount / 2) * 100) / 100;
        setCustomAmountInput(half > 0 ? String(half) : String(data.remainingAmount));
      }
    } catch {
      setBooking(null);
    } finally {
      setPageLoading(false);
    }
  }, [bookingId, getBookingById, prefilledTotalAmount, prefilledPartySize, prefilledBookingDate, prefilledBookingTime, prefilledCustomerName, prefilledOccasion, prefilledCakePrice]);

  useEffect(() => {
    void loadBooking();
  }, [loadBooking]);

  // Compute effective charge amount
  const fullRemaining = isFood
    ? (booking?.offerPrice ?? 0)
    : isBalance
    ? (booking?.remainingAmount ?? booking?.totalAmount ?? 0)
    : (booking?.totalAmount ?? 0);

  const parsedCustomAmount = Number(customAmountInput) || 0;

  const currentPayAmount = (!isFood && isBalance && paymentPlanMode === "custom")
    ? Math.min(Math.max(1, parsedCustomAmount), fullRemaining)
    : fullRemaining;

  const leftoverBalance = Math.max(0, Math.round((fullRemaining - currentPayAmount) * 100) / 100);
  const iterationNumber = (booking?.paymentBreakdown?.length || 0) + 1;

  const handleProceedToStripe = async () => {
    if (!booking?._id) return;
    if (!isFood && isBalance && paymentPlanMode === "custom" && (parsedCustomAmount <= 0 || parsedCustomAmount > fullRemaining)) {
      toast.error(`Please enter a valid amount between $1 and $${fullRemaining.toFixed(2)}`);
      return;
    }

    if (isFood) {
      try {
        const { data } = await api.post("/payments/create-balance-checkout-session", {
          bookingId: booking._id,
          isFoodPayment: true
        });
        if (data.url && typeof window !== "undefined") {
          window.location.href = data.url;
          return;
        }
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to start food payment");
        return;
      }
    }

    try {
      const url = isBalance
        ? await startRemainingPayment(booking._id, paymentPlanMode === "custom" ? currentPayAmount : undefined)
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

  const handleCopy = (text: string, type: "email" | "memo" | "id") => {
    navigator.clipboard.writeText(text);
    if (type === "email") {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
      toast.success("Zelle email copied!");
    } else if (type === "memo") {
      setCopiedMemo(true);
      setTimeout(() => setCopiedMemo(false), 2000);
      toast.success("Zelle Memo copied!");
    } else {
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
      toast.success("Booking ID copied!");
    }
  };

  const handleProceedToZelle = async () => {
    if (!booking?._id) return;
    if (!screenshotPreview) {
      toast.error("Please upload your Zelle payment screenshot proof");
      return;
    }

    if (isFood) {
      setUploadingProof(true);
      try {
        await api.post("/payments/upload-zelle-proof", {
          bookingId: booking._id,
          imageBase64: screenshotPreview,
          isFood: true,
          amount: fullRemaining,
          notes: `Zelle payment for food catering package ($${fullRemaining.toFixed(2)})`
        });
        toast.success(`Food catering payment proof ($${fullRemaining.toFixed(2)}) uploaded! Redirecting...`);
        router.push(`/user/venue-bookings`);
      } catch (err: any) {
        toast.error(err?.response?.data?.message || "Failed to upload Zelle proof");
      } finally {
        setUploadingProof(false);
      }
      return;
    }

    if (isBalance && paymentPlanMode === "custom" && (parsedCustomAmount <= 0 || parsedCustomAmount > fullRemaining)) {
      toast.error(`Please enter a valid breakdown amount between $1 and $${fullRemaining.toFixed(2)}`);
      return;
    }

    setUploadingProof(true);
    try {
      await api.post("/payments/upload-zelle-proof", {
        bookingId: booking._id,
        imageBase64: screenshotPreview,
        isBalance: isBalance,
        amount: isBalance && paymentPlanMode === "custom" ? currentPayAmount : undefined,
        notes: isBalance && paymentPlanMode === "custom" ? `Installment #${iterationNumber} of $${currentPayAmount.toFixed(2)}` : undefined
      });
      toast.success(isBalance
        ? `Balance installment proof ($${currentPayAmount.toFixed(2)}) uploaded! Redirecting...`
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
  const depositPaid = booking.totalAmount - (booking.remainingAmount || 0);
  const shortBookingId = booking._id.slice(-6).toUpperCase();
  const zelleMemoText = `#${shortBookingId}`;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-4">
      {/* Top Banner with prominent Booking ID & Status */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-xl p-2.5" style={{ background: "rgba(229,199,122,0.15)", color: "var(--accent)" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
                {isBalance ? "Remaining Balance Settlement" : "Initial Reservation"}
              </span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold uppercase">
                {isBalance ? `Installment #${iterationNumber}` : "Step 2/2"}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)]">
                Booking ID: <span className="font-mono text-[#E5C77A]">#{shortBookingId}</span>
              </h1>
              <button
                type="button"
                onClick={() => handleCopy(shortBookingId, "memo")}
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-[var(--surface-2)] hover:bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-white transition-colors"
                title="Copy short booking ID"
              >
                {copiedMemo ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copiedMemo ? "Copied" : "Copy"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full ID copy for reference */}
        <div className="text-right hidden sm:block">
          <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wider">Full Reference Code</p>
          <div className="flex items-center justify-end gap-1 mt-0.5">
            <span className="font-mono text-xs text-[var(--text-primary)]">{booking._id}</span>
            <button
              type="button"
              onClick={() => handleCopy(booking._id, "id")}
              className="p-1 text-[var(--text-secondary)] hover:text-white transition-colors"
              title="Copy 24-char ObjectId"
            >
              {copiedId ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-[1fr_400px]">
        {/* ── LEFT: Booking Details & Breakdown Selector ── */}
        <div className="flex flex-col gap-5">
          {/* Summary card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Reservation Details</p>
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
                      {formatBookingDate(booking.bookingDate, { month: "long", day: "numeric", year: "numeric" })}
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
              <div className="mt-4 flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3">
                <div>
                  <p className="text-xs text-[var(--text-secondary)]">Customer</p>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{booking.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[var(--text-secondary)]">Booking Short Code</p>
                  <p className="font-mono text-xs font-bold text-[#E5C77A]">#{shortBookingId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* ── CUSTOM BREAKDOWN / INSTALLMENT SELECTOR (FOR BALANCE PAYMENTS) ── */}
          {isPrivate && isBalance && (
            <div className="rounded-2xl border border-[#E5C77A]/30 bg-[var(--surface)] overflow-hidden">
              <div className="border-b border-[var(--border)] bg-[#E5C77A]/10 px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#E5C77A]">Flexible Payment Breakdown</p>
                  <h3 className="text-base font-bold text-[var(--text-primary)]">Choose How Much to Pay Today</h3>
                </div>
                <span className="text-[10px] bg-[#E5C77A] text-[#0F2D23] font-bold px-2 py-0.5 rounded uppercase">
                  Installment Support
                </span>
              </div>

              <div className="p-6 space-y-4">
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  You can pay the full remaining balance now or break it down into multiple installments however you like before the 72-hour event deadline.
                </p>

                {/* Mode Selector Tabs */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentPlanMode("full")}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      paymentPlanMode === "full"
                        ? "border-[#E5C77A] bg-[#E5C77A]/10 text-[var(--text-primary)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Pay Full Balance</span>
                      {paymentPlanMode === "full" && <Check size={14} className="text-[#E5C77A]" />}
                    </div>
                    <p className="text-lg font-bold text-[#E5C77A] mt-1">${fullRemaining.toFixed(2)}</p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Settle 100% of the event balance</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentPlanMode("custom")}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      paymentPlanMode === "custom"
                        ? "border-[#E5C77A] bg-[#E5C77A]/10 text-[var(--text-primary)] shadow-sm"
                        : "border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-secondary)] hover:border-gray-500"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">Custom Breakdown</span>
                      {paymentPlanMode === "custom" && <Check size={14} className="text-[#E5C77A]" />}
                    </div>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      ${parsedCustomAmount > 0 ? parsedCustomAmount.toFixed(2) : "Custom"}
                    </p>
                    <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">Pay in partial installments</p>
                  </button>
                </div>

                {/* Custom Amount Input & Quick Preset Chips */}
                {paymentPlanMode === "custom" && (
                  <div className="space-y-3 pt-2 animate-in fade-in duration-300">
                    <div>
                      <label className="text-xs font-semibold text-[var(--text-primary)] block mb-1">
                        Enter Custom Installment Amount ($USD)
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-[var(--text-secondary)]">$</span>
                        <input
                          type="number"
                          min="1"
                          max={fullRemaining}
                          step="any"
                          value={customAmountInput}
                          onChange={(e) => setCustomAmountInput(e.target.value)}
                          placeholder={`Enter amount up to ${fullRemaining}`}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--text-primary)] font-bold text-base focus:border-[#E5C77A] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Quick Preset Percentage Chips */}
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] font-semibold uppercase">Quick Presets:</span>
                      {[
                        { label: "25%", val: Math.round((fullRemaining * 0.25) * 100) / 100 },
                        { label: "50%", val: Math.round((fullRemaining * 0.50) * 100) / 100 },
                        { label: "75%", val: Math.round((fullRemaining * 0.75) * 100) / 100 },
                        { label: "Full", val: fullRemaining }
                      ].map((chip) => (
                        <button
                          key={chip.label}
                          type="button"
                          onClick={() => setCustomAmountInput(String(chip.val))}
                          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--surface-2)] hover:bg-[#E5C77A]/20 border border-[var(--border)] hover:border-[#E5C77A] text-[var(--text-primary)] transition-colors"
                        >
                          {chip.label} (${chip.val.toFixed(0)})
                        </button>
                      ))}
                    </div>

                    {/* Live Calculator Breakdown */}
                    <div className="p-3.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] space-y-1.5 text-xs">
                      <div className="flex justify-between text-[var(--text-secondary)]">
                        <span>Total Due Remaining:</span>
                        <span>${fullRemaining.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Paying Today (Installment #{iterationNumber}):</span>
                        <span>−${currentPayAmount.toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[var(--border)] pt-1.5 flex justify-between font-bold text-[var(--text-primary)]">
                        <span>Balance Left After This Payment:</span>
                        <span className={leftoverBalance === 0 ? "text-emerald-400" : "text-amber-400"}>
                          ${leftoverBalance.toFixed(2)} {leftoverBalance === 0 ? "(Fully Paid!)" : "(Due Later)"}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Billing breakdown card */}
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden">
            <div className="border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-secondary)]">Payment Summary</p>
              <span className="text-xs font-mono text-[var(--text-secondary)]">#{shortBookingId}</span>
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
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[var(--text-secondary)]">Total Remaining Balance</span>
                    <span className="font-semibold text-amber-400">${fullRemaining.toFixed(2)}</span>
                  </div>
                  <div className="mt-2 border-t border-[var(--border)] pt-3 flex items-center justify-between">
                    <div>
                      <span className="text-base font-bold text-[var(--text-primary)]">Charge Today</span>
                      {paymentPlanMode === "custom" && (
                        <p className="text-[10px] text-emerald-400">Installment #{iterationNumber} Breakdown</p>
                      )}
                    </div>
                    <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                      ${currentPayAmount.toFixed(2)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-between">
                  <span className="text-base font-bold text-[var(--text-primary)]">Deposit Charge Due</span>
                  <span className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                    ${currentPayAmount.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Past Payments History Timeline — verified only */}
          {(() => {
            const verifiedHistory = (booking.paymentBreakdown ?? []).filter(item => item.status === "verified");
            if (verifiedHistory.length === 0) return null;
            return (
              <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-secondary)]">Payment History &amp; Installments</p>
                <div className="space-y-2">
                  {verifiedHistory.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)]">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-[var(--text-primary)] capitalize">
                            {item.paymentType.replace(/_/g, " ")} ({item.paymentMethod === "zelle" ? "Zelle" : "Card"})
                          </span>
                          <p className="text-[10px] text-[var(--text-secondary)]">
                            {item.paidAt ? format(new Date(item.paidAt), "PPp") : "Recorded"}
                          </p>
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400 font-mono">+${item.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
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
                      <p className="text-xs text-[var(--text-secondary)]">
                        {isBalance ? `Due Now (Installment #${iterationNumber})` : "Deposit Total"}
                      </p>
                      <p className="text-2xl font-bold" style={{ color: "var(--accent)" }}>
                        ${currentPayAmount.toFixed(2)}
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
                    className="mt-4 w-full rounded-xl py-4 text-base font-bold transition-all disabled:opacity-60 shadow-lg cursor-pointer"
                    style={{ background: "#E5C77A", color: "#0F2D23" }}
                  >
                    {loading ? "Opening Stripe…" : `Pay $${currentPayAmount.toFixed(2)} via Stripe`}
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
                      Send payment using Zelle, then upload your transaction screenshot below for automatic verification.
                    </p>
                  </div>

                  {/* Zelle Instructions Box */}
                  <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)]">Zelle Recipient Email:</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-[var(--accent)]">
                        <span>tropicapayments@gmail.com</span>
                        <button
                          type="button"
                          onClick={() => handleCopy("tropicapayments@gmail.com", "email")}
                          className="p-1 hover:text-white transition-colors"
                          title="Copy Zelle email"
                        >
                          {copiedEmail ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                      <span className="text-[var(--text-secondary)]">Exact Transfer Amount:</span>
                      <span className="font-bold text-lg text-emerald-400">${currentPayAmount.toFixed(2)}</span>
                    </div>

                    {/* Required Zelle Memo with prominent Booking ID */}
                    <div className="flex items-center justify-between text-xs border-b border-[var(--border)] pb-2">
                      <div>
                        <span className="text-[var(--text-secondary)] block">Required Zelle Memo:</span>
                        <span className="text-[10px] text-amber-400 font-medium">(Booking ID)</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-mono font-bold text-base text-[#E5C77A]">
                        <span>{zelleMemoText}</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(zelleMemoText, "memo")}
                          className="px-2 py-1 rounded bg-[#E5C77A]/20 hover:bg-[#E5C77A]/30 text-[#E5C77A] text-xs transition-colors flex items-center gap-1"
                          title="Copy Zelle Memo text"
                        >
                          {copiedMemo ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                          <span>{copiedMemo ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[var(--text-secondary)]">Full Booking ID:</span>
                      <span className="font-mono text-[11px] text-[var(--text-secondary)]">{booking._id}</span>
                    </div>
                  </div>

                  <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-2.5 flex items-start gap-2 text-xs text-amber-200">
                    <AlertCircle size={15} className="mt-0.5 text-amber-400 shrink-0" />
                    <span>
                      IMPORTANT: You MUST write <strong>{zelleMemoText}</strong> in your Zelle transfer memo so our backend matches your installment automatically!
                    </span>
                  </div>

                  {/* Screenshot upload drop zone */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-[var(--text-primary)] flex items-center justify-between">
                      <span>Upload Zelle Payment Screenshot</span>
                      <span className="text-[10px] text-[var(--text-secondary)]">Uploaded to Cloudinary</span>
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
                    className="mt-4 w-full rounded-xl py-4 text-base font-bold transition-all disabled:opacity-50 shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                    style={{ background: "#E5C77A", color: "#0F2D23" }}
                  >
                    {uploadingProof ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-[#0F2D23] border-t-transparent animate-spin" />
                        <span>Uploading to Cloudinary &amp; Submitting…</span>
                      </>
                    ) : (
                      <>
                        <FileText size={18} />
                        <span>Submit Zelle Proof (${currentPayAmount.toFixed(2)})</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)] pt-1">
                    <ShieldCheck size={13} className="text-emerald-500" />
                    <span>Uploads securely to Cloudinary · Pending verification</span>
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

