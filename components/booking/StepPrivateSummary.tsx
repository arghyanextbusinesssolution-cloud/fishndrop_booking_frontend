"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2, Ticket, Check, X, Music, UtensilsCrossed, AlertCircle, Sparkles, ChefHat } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

import { BookingPolicyModal } from "./BookingPolicyModal";

interface StepPrivateSummaryProps {
  bookingData: any;
  onBack: () => void;
}

const stripePromise = getStripe();

import { CATERING_LABEL_MAP } from "@/lib/cateringRestaurants";

export default function StepPrivateSummary({ bookingData, onBack }: StepPrivateSummaryProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { setAuth } = useAuthStore();

  const djCost = bookingData.needDj ? 300 : 0;
  const extraHours = (bookingData.durationHours || 5) > 5 ? (bookingData.durationHours - 5) * 125 : 0;
  const photographerCost = bookingData.needPhotographer
    ? 300 + Math.max(0, (bookingData.photographerHours || 2) - 2) * 150
    : 0;
  const baseCost = 500 + extraHours + djCost + photographerCost;
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const finalCost = appliedCoupon ? Math.max(0, baseCost - appliedCoupon.discountAmount) : baseCost;
  const minDeposit = Math.min(finalCost, 200);
  const [customDeposit, setCustomDeposit] = useState<number>(minDeposit);

  useEffect(() => {
    setCustomDeposit(Math.min(finalCost, 200));
  }, [finalCost]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const { data } = await api.post("/bookings/validate-coupon", { couponCode, totalAmount: baseCost });
      if (data.success) {
        const discountAmount = data.discountType === "percentage"
          ? (baseCost * data.discount) / 100
          : data.discount;
        setAppliedCoupon({ code: couponCode, discountAmount });
        toast.success("Coupon applied!");
        setCouponCode("");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Invalid coupon");
    } finally {
      setIsValidating(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    toast.success("Coupon removed");
  };
  const [paymentMethod, setPaymentMethod] = useState<"card" | "zelle">("card");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedZelle, setCopiedZelle] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Screenshot file size must be under 10MB");
        return;
      }
      setScreenshotFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyZelle = () => {
    navigator.clipboard.writeText("tropicapayments@gmail.com");
    setCopiedZelle(true);
    toast.success("Zelle Email copied!");
    setTimeout(() => setCopiedZelle(false), 2000);
  };

  const handleReserve = async () => {
    setSubmitting(true);
    setError(null);
    try {
      let zelleProofUrl = "";
      if (paymentMethod === "zelle" && screenshotPreview) {
        try {
          const { data: uploadRes } = await api.post("/upload-cake-photo", { imageBase64: screenshotPreview });
          if (uploadRes.success && uploadRes.url) {
            zelleProofUrl = uploadRes.url;
          }
        } catch (upErr) {
          console.warn("Proof upload failed during reserve, will proceed with standard Zelle flow:", upErr);
        }
      }

      let formattedNotes = bookingData.notes || "";
      if (bookingData.selectedDishes && bookingData.selectedDishes.length > 0) {
        const dishStrs = bookingData.selectedDishes.map((dish: string) => {
          const qty = bookingData.dishQuantities?.[dish];
          return qty && qty > 1 ? `${dish} (x${qty} platters)` : `${dish} (x1 platter)`;
        });
        const dishStr = `[Dishes: ${dishStrs.join(", ")}]`;
        formattedNotes = formattedNotes ? `${formattedNotes} | ${dishStr}` : dishStr;
      }
      if (bookingData.cateringNotes) {
        formattedNotes = formattedNotes ? `${formattedNotes} | [Dietary: ${bookingData.cateringNotes}]` : `[Dietary: ${bookingData.cateringNotes}]`;
      }
      if (bookingData.needDecoration && bookingData.decorationStyle) {
        formattedNotes = formattedNotes ? `${formattedNotes} | [Decor: ${bookingData.decorationStyle}]` : `[Decor: ${bookingData.decorationStyle}]`;
      }

      const payload = {
        customerName: bookingData.guestDetails.name,
        customerEmail: bookingData.guestDetails.email,
        customerPhone: bookingData.guestDetails.phone,
        password: bookingData.guestDetails.password || undefined,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time || "19:00",
        partySize: bookingData.guests,
        durationHours: bookingData.durationHours || 1,
        occasion: bookingData.occasion || "other",
        notes: formattedNotes.slice(0, 500),
        needDj: bookingData.needDj ?? false,
        needPhotographer: bookingData.needPhotographer ?? false,
        photographerHours: bookingData.needPhotographer ? (bookingData.photographerHours || 2) : 0,
        cateringMenu: bookingData.cateringMenu || "jamaican_jerk_house",
        dishQuantities: bookingData.dishQuantities || {},
        customDepositAmount: customDeposit,
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
        zelleProofUrl: zelleProofUrl || undefined
      };

      const res = await api.post("/bookings/reserve-private", payload);

      if (res.data.success) {
        if (res.data.token && res.data.user) {
          setAuth(res.data.user, res.data.token);
        }
        setBookingId(res.data.booking._id);

        if (paymentMethod === "zelle") {
          if (screenshotPreview && !zelleProofUrl) {
            try {
              await api.post("/payments/upload-zelle-proof", {
                bookingId: res.data.booking._id,
                imageBase64: screenshotPreview
              });
            } catch (proofErr) {
              console.warn("Direct Zelle proof upload error:", proofErr);
            }
          }
          toast.success("Private venue Zelle booking submitted! Redirecting to verification status...");
          router.push(`/user/payment/zelle-pending?bookingId=${res.data.booking._id}`);
          return;
        }

        const { data: piData } = await api.post(
          "/payments/create-payment-intent",
          { bookingId: res.data.booking._id },
          res.data.token ? { headers: { Authorization: `Bearer ${res.data.token}` } } : undefined
        );

        if (piData.success && piData.clientSecret) {
          setClientSecret(piData.clientSecret);
        } else {
          setError(piData.message || "Failed to initialize payment. Please try again.");
        }
      } else {
        setError(res.data.message || "Failed to create booking.");
      }
    } catch (err: any) {
      console.error("Payment init failed:", err);
      let errorMsg = "An error occurred. Please go back and try again.";
      if (err.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        errorMsg = err.response.data.errors.map((e: any) => e.message || e.msg).join(", ");
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = (bookingId: string, paymentIntentId?: string) => {
    if (bookingId) {
      try {
        fetch(
          "https://services.leadconnectorhq.com/hooks/3HmJCw40C6xzJYaLg6cK/webhook-trigger/bc6da1e0-2155-4d01-a223-318afd60c723",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: bookingData.guestDetails.name,
              email: bookingData.guestDetails.email,
              phone: bookingData.guestDetails.phone,
              bookingDate: bookingData.date,
              bookingTime: bookingData.time || "19:00",
              partySize: bookingData.guests,
              durationHours: bookingData.durationHours || 1,
              occasion: bookingData.occasion || "other",
              needDj: bookingData.needDj ?? false,
              cateringMenu: bookingData.cateringMenu || "seafood_buffet",
              notes: bookingData.notes || "",
              depositAmount: customDeposit,
              totalAmount: finalCost,
              bookingId,
              paymentIntentId: paymentIntentId || "",
              bookingType: "private_event",
              status: "confirmed",
              couponApplied: Boolean(appliedCoupon),
              couponCode: appliedCoupon?.code || "",
              couponDiscountAmount: appliedCoupon?.discountAmount || 0,
              couponDetails: appliedCoupon
                ? { code: appliedCoupon.code, discountAmount: appliedCoupon.discountAmount }
                : null,
              bookingDetails: {
                occasion: bookingData.occasion || "other",
                needDj: bookingData.needDj ?? false,
                cateringMenu: bookingData.cateringMenu || "seafood_buffet",
                notes: bookingData.notes || "",
                partySize: bookingData.guests,
                durationHours: bookingData.durationHours || 1,
                bookingDate: bookingData.date,
                bookingTime: bookingData.time || "19:00",
                depositAmount: customDeposit,
                totalAmount: finalCost,
                customDepositAmount: customDeposit,
              },
            }),
          }
        ).catch((ghlErr) => {
          console.warn("Lead Connector webhook failed:", ghlErr);
        });
      } catch (ghlErr) {
        console.warn("Lead Connector webhook failed:", ghlErr);
      }

      let url = `/user/payment/confirmed?bookingId=${bookingId}`;
      if (paymentIntentId) url += `&payment_intent=${paymentIntentId}`;
      router.push(url);
    }
  };

  const cateringLabel = CATERING_LABEL_MAP[bookingData.cateringMenu] || bookingData.cateringMenu || "Not selected";

  return (
    <div className="max-w-md mx-auto space-y-3 pt-1 sm:pt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!clientSecret && !bookingId && !submitting && (
        <div className="bg-[#f7f6f2] rounded-xl p-4 sm:p-6 shadow-lg space-y-4">

          {/* Deposit / Total Header */}
          <div className="space-y-3 border-b border-black/10 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#1a1c1b]/60 font-bold leading-tight">Total Venue Package</p>
                <p className="font-headline text-2xl sm:text-4xl text-[#1a1c1b] font-bold tracking-tighter">${finalCost.toFixed(2)}</p>
                <p className="text-[10px] text-[#1a1c1b]/50 font-light mt-0.5">$500 base (5 hrs) · $125/extra hr</p>
              </div>
              {appliedCoupon && (
                <div className="text-right">
                  <p className="text-[9px] tracking-widest uppercase text-emerald-600 font-bold">Discount Applied</p>
                  <p className="font-semibold text-xs sm:text-sm text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)}</p>
                  <p className="text-[10px] text-gray-500 line-through">Orig: ${baseCost.toFixed(2)}</p>
                </div>
              )}
            </div>
            {/* Deposit breakdown */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-[#C8A96A]/10 border border-[#C8A96A]/30 rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-[#C8A96A] font-bold">Due Today (Deposit)</p>
                <p className="font-headline text-2xl text-[#C8A96A] font-bold">${customDeposit.toFixed(2)}</p>
                <p className="text-[9px] text-[#1a1c1b]/50 mt-0.5">Secures your venue date &amp; time</p>
              </div>
              <div className="bg-black/5 border border-black/10 rounded-xl p-3">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Remaining Balance</p>
                <p className="font-headline text-2xl text-[#1a1c1b] font-bold">${Math.max(0, finalCost - customDeposit).toFixed(2)}</p>
                <p className="text-[9px] text-[#1a1c1b]/40 mt-0.5">Due 72 hrs before event</p>
              </div>
            </div>
          </div>

          {/* 72-Hour Balance Deadline Notice */}
          {finalCost - customDeposit > 0 && (
            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30 text-xs text-amber-800 space-y-1">
              <p className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>72-Hour Balance Policy</span>
              </p>
              <p className="text-[11px] leading-relaxed text-amber-900">
                The remaining <strong>${(finalCost - customDeposit).toFixed(2)}</strong> balance is due no later than <strong>72 hours before the event</strong>. If unpaid by that deadline, the reservation may be canceled.
              </p>
            </div>
          )}

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-2 border-t border-black/10">
            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Choose Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === "card"
                    ? "bg-[#0F4C3A] text-white border-[#0F4C3A] shadow-md"
                    : "bg-white text-[#1a1c1b] border-gray-200 hover:border-[#C8A96A]"
                }`}
              >
                <span>💳 Credit / Debit Card</span>
                <span className="text-[9px] opacity-80">Stripe Card Deposit</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("zelle")}
                className={`py-3 px-3 rounded-xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                  paymentMethod === "zelle"
                    ? "bg-[#6B1D2F] text-white border-[#6B1D2F] shadow-md"
                    : "bg-white text-[#1a1c1b] border-gray-200 hover:border-[#6B1D2F]"
                }`}
              >
                <span>⚡ Zelle Pay</span>
                <span className="text-[9px] opacity-80">Backend Verification</span>
              </button>
            </div>
          </div>

          {/* Zelle Instructions & Screenshot Upload */}
          {paymentMethod === "zelle" && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Recipient Email</p>
                  <p className="text-sm font-extrabold text-purple-950 font-mono">tropicapayments@gmail.com</p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyZelle}
                  className="px-3 py-1 bg-purple-600 text-white rounded-lg text-[10px] uppercase tracking-wider font-bold hover:bg-purple-700 transition"
                >
                  {copiedZelle ? "Copied!" : "Copy Email"}
                </button>
              </div>

              <div className="p-3 bg-white/80 rounded-lg border border-purple-100 space-y-1.5 text-xs text-purple-900">
                <p className="font-bold text-[11px] text-purple-950">📋 Private Event Zelle Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-700">
                  <li>Send deposit of <strong className="text-purple-950">${customDeposit.toFixed(2)}</strong> via Zelle to email <span className="font-mono font-bold">tropicapayments@gmail.com</span></li>
                  <li>Paste your generated <strong className="text-purple-950">Booking ID</strong> in your Zelle payment memo/notes.</li>
                  <li>Upload payment screenshot proof below.</li>
                  <li>Booking stays <span className="font-bold text-amber-600">Pending</span> until the backend team verifies your Zelle payment, Booking ID &amp; deposit amount, and confirms your venue slot!</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-purple-900 font-bold block">
                  📷 Upload Zelle Screenshot Proof
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                />
                {screenshotPreview && (
                  <div className="mt-2 relative rounded-lg overflow-hidden border border-purple-300 max-h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={screenshotPreview} alt="Zelle Proof" className="object-cover w-full h-full" />
                    <button
                      type="button"
                      onClick={() => { setScreenshotFile(null); setScreenshotPreview(null); }}
                      className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full text-xs"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Preferences & Catering Dishes Summary */}
          <div className="pt-3 border-t border-black/10 space-y-2.5">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold">Event Preferences &amp; Catering</p>

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <UtensilsCrossed className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Catering Partner</p>
                <p className="text-xs sm:text-sm font-bold text-[#1a1c1b] mt-0.5">{cateringLabel}</p>
              </div>
            </div>

            {bookingData.selectedDishes && bookingData.selectedDishes.length > 0 && (
              <div className="p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10 space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold flex items-center gap-1">
                    <ChefHat className="w-3 h-3 text-[#C8A96A]" /> Selected Event Dishes ({bookingData.selectedDishes.length})
                  </p>
                  <span className="text-[9px] text-[#0F4C3A] font-bold">Included</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {bookingData.selectedDishes.map((dish: string, i: number) => {
                    const qty = bookingData.dishQuantities?.[dish] || 1;
                    return (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-900 border border-amber-500/20 font-medium flex items-center gap-1.5"
                      >
                        <span>✓ {dish}</span>
                        <span className="font-bold text-amber-800 bg-amber-500/20 px-1 rounded text-[9px]">
                          {qty} {qty === 1 ? "platter" : "platters"}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {bookingData.cateringNotes && (
              <div className="p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Dietary / Special Notes</p>
                <p className="text-xs text-[#1a1c1b]/80 italic mt-0.5 leading-relaxed font-body">"{bookingData.cateringNotes}"</p>
              </div>
            )}

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <Music className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">DJ Service</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold mt-0.5",
                  bookingData.needDj ? "text-[#0F4C3A]" : "text-[#1a1c1b]/60"
                )}>
                  {bookingData.needDj ? "✓ Yes — DJ Requested (+$300 USD)" : "No DJ"}
                </p>
              </div>
            </div>

            {bookingData.needDecoration && (
              <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
                <Sparkles className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Event Decoration</p>
                  <p className="text-xs sm:text-sm font-bold text-[#1a1c1b] mt-0.5 capitalize">
                    ✓ {bookingData.decorationStyle?.replace(/_/g, " ") || "Custom Decoration"}
                  </p>
                </div>
              </div>
            )}

            {/* Photographer Add-On Row */}
            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <span className="text-base flex-shrink-0">📷</span>
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Event Photographer</p>
                <p className={cn(
                  "text-xs sm:text-sm font-bold mt-0.5",
                  bookingData.needPhotographer ? "text-[#0F4C3A]" : "text-[#1a1c1b]/60"
                )}>
                  {bookingData.needPhotographer
                    ? `✓ ${bookingData.photographerHours || 2} hrs (+$${photographerCost} USD)`
                    : "No Photographer"}
                </p>
                {bookingData.needPhotographer && (bookingData.photographerHours || 2) > 2 && (
                  <p className="text-[10px] text-[#1a1c1b]/40 mt-0.5">
                    $300 base + {(bookingData.photographerHours - 2)} extra hr{(bookingData.photographerHours - 2) > 1 ? "s" : ""} × $150
                  </p>
                )}
              </div>
            </div>

          </div>

          {/* Coupon */}
          <div className="space-y-3 pt-3 border-t border-black/10">
            {!appliedCoupon ? (
              <div className="space-y-1.5">
                <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold flex items-center gap-1.5">
                  <Ticket className="w-3 h-3" /> Referral Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 bg-white border border-[#C8A96A]/30 rounded-lg px-3 py-1.5 text-xs sm:text-sm text-[#1a1c1b] focus:outline-none focus:border-[#C8A96A]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={isValidating || !couponCode}
                    className="bg-[#C8A96A] text-white px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 min-w-[70px] flex justify-center items-center"
                  >
                    {isValidating ? <Loader2 className="w-3 h-3 animate-spin" /> : "Apply"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</p>
                    <p className="text-[10px] text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)} applied</p>
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <label className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Adjust your initial payment amount (Min: ${minDeposit})
            </label>
            <input
              type="range"
              min={minDeposit}
              max={finalCost}
              step="1"
              value={customDeposit}
              onChange={(e) => setCustomDeposit(Number(e.target.value))}
              className="w-full accent-[#C8A96A] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>${minDeposit}</span>
              <span>${finalCost}</span>
            </div>
          </div>

          <div className="pt-1 space-y-2">
            <button
              type="button"
              onClick={() => setShowPolicyModal(true)}
              className="text-[10px] sm:text-[11px] text-[#C8A96A] underline font-semibold flex items-center justify-center gap-1.5 w-full hover:text-[#0F4C3A]"
            >
              View Booking &amp; Payment Policy ($200 Deposit / 48-Hour Refund)
            </button>

            <button
              onClick={() => setShowPolicyModal(true)}
              disabled={submitting || finalCost < 0}
              className={`w-full text-white py-3 sm:py-3.5 rounded-xl text-xs uppercase tracking-widest font-black transition shadow-lg ${
                paymentMethod === "zelle"
                  ? "bg-gradient-to-r from-purple-800 to-indigo-900 hover:from-purple-900 hover:to-indigo-950"
                  : "bg-[#0F4C3A] hover:bg-[#1a5b48]"
              }`}
            >
              {paymentMethod === "zelle"
                ? `Confirm & Pay Zelle Deposit ($${customDeposit.toFixed(2)})`
                : `Confirm & Pay ${customDeposit.toFixed(2)} Deposit`}
            </button>
          </div>
        </div>
      )}

      <BookingPolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onAccept={handleReserve}
        amount={customDeposit}
        totalPrice={finalCost}
        remainingBalance={Math.max(0, finalCost - customDeposit)}
        durationHours={bookingData.durationHours || 5}
        needDj={bookingData.needDj}
        needPhotographer={bookingData.needPhotographer}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {submitting && !clientSecret && (
        <div className="space-y-4 animate-pulse p-6 bg-primary/5 rounded-xl border border-primary/10">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing payment bridge...
          </div>
        </div>
      )}

      {clientSecret && bookingId && (
        <div className="space-y-4">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
            <StripePaymentForm
              bookingId={bookingId}
              onSuccess={handlePaymentSuccess}
              agreedToTerms={bookingData.guestDetails.agreedToTerms}
              agreedToTransactional={bookingData.guestDetails.agreedToTransactional}
            />
          </Elements>
          <button
            type="button"
            onClick={async () => {
              if (bookingId) {
                try {
                  await api.post("/bookings/cancel-unpaid", { bookingId });
                  toast.success("Unpaid booking draft cancelled. Slot released.");
                } catch (err) {
                  console.warn("Cancel unpaid draft error:", err);
                }
              }
              setBookingId(null);
              setClientSecret(null);
              if (onBack) onBack();
            }}
            className="w-full text-center py-2 text-xs text-red-500 hover:text-red-700 font-semibold tracking-wider uppercase transition-colors"
          >
            ← Cancel &amp; Change Booking Details
          </button>
        </div>
      )}
    </div>
  );
}
