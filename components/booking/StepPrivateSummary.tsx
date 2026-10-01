"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2, Ticket, Check, X, Music, UtensilsCrossed } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

import { BookingPolicyModal } from "./BookingPolicyModal";

interface StepPrivateSummaryProps {
  bookingData: any;
  onBack: () => void;
}

const stripePromise = getStripe();

const CATERING_LABEL_MAP: Record<string, string> = {
  seafood_buffet: "🦞 Seafood Extravaganza Buffet",
  tropica_signature: "🍽️ Tropica Signature Experience",
  cocktail_canapes: "🥂 Cocktail and Canapes Reception",
  bbq_grill: "🔥 Tropical BBQ and Grill",
  vegan_garden: "🌿 Garden and Vegan Feast",
  kids_friendly: "🎉 Family and Kids Celebration Menu",
  custom: "✍️ Custom Menu — Discuss With Us",
};

export default function StepPrivateSummary({ bookingData, onBack }: StepPrivateSummaryProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { setAuth } = useAuthStore();

  const djCost = bookingData.needDj ? 300 : 0;
  const baseCost = (bookingData.durationHours || 1) * 125 + djCost;
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
    navigator.clipboard.writeText("payments@fishndrop.com");
    setCopiedZelle(true);
    toast.success("Zelle email copied!");
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
        notes: bookingData.notes || "",
        needDj: bookingData.needDj ?? false,
        cateringMenu: bookingData.cateringMenu || "seafood_buffet",
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
          "https://services.leadconnectorhq.com/hooks/3HmJCw40C6xzJYaLg6cK/webhook-trigger/68dcac67-ddc2-4765-87d7-9034ebe33001",
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
          <div className="flex justify-between items-center gap-3">
            <div>
              <p className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#1a1c1b]/60 font-bold leading-tight">Deposit Limit</p>
              <p className="font-headline text-3xl sm:text-5xl text-[#C8A96A] font-bold tracking-tighter">
                ${customDeposit.toFixed(2)}
              </p>
            </div>
            <div className="text-right border-l border-black/10 pl-3">
              <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60">Total Cost</p>
              <p className="font-semibold text-sm sm:text-base text-[#1a1c1b]">${finalCost.toFixed(2)}</p>
              {appliedCoupon && (
                <p className="text-[10px] text-gray-500 line-through">Orig: ${baseCost.toFixed(2)}</p>
              )}
            </div>
          </div>

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
                <span className="text-[9px] opacity-80">GHL Instant Verification</span>
              </button>
            </div>
          </div>

          {/* Zelle Instructions & Screenshot Upload */}
          {paymentMethod === "zelle" && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Recipient</p>
                  <p className="text-sm font-extrabold text-purple-950 font-mono">payments@fishndrop.com</p>
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
                  <li>Send deposit of <strong className="text-purple-950">${customDeposit.toFixed(2)}</strong> via Zelle to <span className="font-mono font-bold">payments@fishndrop.com</span></li>
                  <li>Paste your generated <strong className="text-purple-950">Booking ID</strong> in your Zelle payment memo/notes.</li>
                  <li>Upload payment screenshot proof below.</li>
                  <li>Booking stays <span className="font-bold text-amber-600">Pending</span> until GoHighLevel (GHL) reads your Zelle payment email, verifies your Booking ID &amp; deposit amount, and confirms your venue slot!</li>
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

          {/* Preferences Summary — read-only from Step 4 */}
          <div className="pt-3 border-t border-black/10 space-y-2.5">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold">Event Preferences (from step 4)</p>

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

            <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-[#1a1c1b]/10">
              <UtensilsCrossed className="w-4 h-4 text-[#C8A96A] flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[9px] uppercase tracking-widest text-[#1a1c1b]/50 font-bold">Catering Menu</p>
                <p className="text-xs sm:text-sm font-bold text-[#1a1c1b] mt-0.5">{cateringLabel}</p>
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
              View Booking &amp; Payment Policy ($200 Deposit / 48-Hour Hold)
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
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
          <StripePaymentForm
            bookingId={bookingId}
            onSuccess={handlePaymentSuccess}
            agreedToTerms={bookingData.guestDetails.agreedToTerms}
            agreedToTransactional={bookingData.guestDetails.agreedToTransactional}
          />
        </Elements>
      )}
    </div>
  );
}
