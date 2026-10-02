"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2, Ticket, Check, X } from "lucide-react";
import toast from "react-hot-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import { BookingPolicyModal } from "./BookingPolicyModal";

interface StepSummaryPaymentProps {
  bookingData: any;
  onBack: () => void;
  goToStep: (step: number) => void;
}

const stripePromise = getStripe();

export const StepSummaryPayment = ({ bookingData, onBack, goToStep }: StepSummaryPaymentProps) => {
  const { totalPrice } = bookingData;
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const finalPrice = appliedCoupon ? Math.max(0, totalPrice - appliedCoupon.discountAmount) : totalPrice;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidating(true);
    try {
      const { data } = await api.post("/bookings/validate-coupon", { couponCode, totalAmount: totalPrice });
      if (data.success) {
        const discountAmount = data.discountType === "percentage"
          ? (totalPrice * data.discount) / 100
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
    navigator.clipboard.writeText("bookings@tropica.nyc");
    setCopiedZelle(true);
    toast.success("Zelle email copied!");
    setTimeout(() => setCopiedZelle(false), 2000);
  };

  const handleReserve = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const cleanPhone = (bookingData.guestDetails?.phone || "").replace(/\D/g, "");
      const customerName = bookingData.guestDetails?.name?.trim() || "Guest User";
      const customerEmail =
        bookingData.guestDetails?.email?.trim() ||
        (cleanPhone ? `guest_${cleanPhone}@tropica.com` : `guest_${Date.now()}@tropica.com`);
      const customerPhone = bookingData.guestDetails?.phone || "";

      let zelleProofUrl = "";
      if (paymentMethod === "zelle" && screenshotPreview) {
        // First upload screenshot proof
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
        partySize: bookingData.guests,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        customerName,
        customerEmail,
        customerPhone,
        password: bookingData.guestDetails?.password || undefined,
        occasion: bookingData.occasion || "other",
        notes: "",
        cakeDetails: bookingData.addons?.includes("cake") ? "Signature Birthday Cake" : "",
        customCakeDetails: bookingData.addons?.includes("custom_cake") ? bookingData.customCakeDetails : undefined,
        cakePrice: bookingData.addons?.includes("custom_cake") && bookingData.customCakeDetails
          ? bookingData.customCakeDetails.retailPrice
          : bookingData.addons?.includes("cake") ? 50 : 0,
        couponCode: appliedCoupon?.code || undefined,
        paymentMethod,
        zelleProofUrl: zelleProofUrl || undefined
      };

      const { data } = await api.post("/bookings/reserve", payload);

      if (data.success) {
        if (data.token && data.user) {
          setAuth(data.user, data.token);
        }
        setBookingId(data.booking._id);

        if (paymentMethod === "zelle") {
          // If Zelle, upload proof if not already uploaded or attach booking ID
          if (screenshotPreview && !zelleProofUrl) {
            try {
              await api.post("/payments/upload-zelle-proof", {
                bookingId: data.booking._id,
                imageBase64: screenshotPreview
              });
            } catch (proofErr) {
              console.warn("Direct Zelle proof upload error:", proofErr);
            }
          }
          toast.success("Zelle booking submitted! Redirecting to verification status...");
          router.push(`/user/payment/zelle-pending?bookingId=${data.booking._id}`);
          return;
        }

        // Stripe card payment flow
        const { data: piData } = await api.post(
          "/payments/create-payment-intent",
          { bookingId: data.booking._id },
          data.token ? { headers: { Authorization: `Bearer ${data.token}` } } : undefined
        );

        if (piData.success && piData.clientSecret) {
          setClientSecret(piData.clientSecret);
        } else {
          setError(piData.message || "Failed to initialize payment. Please try again.");
        }
      } else {
        setError(data.message || "Failed to create booking.");
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
      let url = `/user/payment/confirmed?bookingId=${bookingId}`;
      if (paymentIntentId) url += `&payment_intent=${paymentIntentId}`;
      router.push(url);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-3 pt-1 sm:pt-3 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {!clientSecret && !bookingId && !submitting && (
        <div className="space-y-4 bg-[#f7f6f2] rounded-xl p-4 sm:p-6 shadow-lg">
          <div className="flex justify-between items-center gap-3 border-b border-black/10 pb-3">
            <div>
              <p className="font-label text-[9px] sm:text-[10px] tracking-[0.2em] uppercase text-[#1a1c1b]/60 font-bold leading-tight">Total Amount</p>
              <p className="font-headline text-3xl sm:text-5xl text-[#C8A96A] font-bold tracking-tighter">${finalPrice.toFixed(2)}</p>
            </div>
            {appliedCoupon && (
              <div className="text-right">
                <p className="text-[9px] tracking-widest uppercase text-emerald-600 font-bold">Discount Applied</p>
                <p className="font-semibold text-xs sm:text-sm text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 line-through">Orig: ${totalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2 pt-1">
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
                <span className="text-[9px] opacity-80">Instant Card Checkout</span>
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

          {/* Zelle Instructions & Screenshot Box */}
          {paymentMethod === "zelle" && (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-purple-700 font-bold">Zelle Recipient</p>
                  <p className="text-sm font-extrabold text-purple-950 font-mono">bookings@tropica.nyc</p>
                  <p className="text-[11px] font-bold text-purple-800">Tag: <span className="font-mono text-purple-950">tropica-nyc</span></p>
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
                <p className="font-bold text-[11px] text-purple-950">📋 Instructions:</p>
                <ol className="list-decimal pl-4 space-y-1 text-[11px] text-gray-700">
                  <li>Send exact amount <strong className="text-purple-950">${finalPrice.toFixed(2)}</strong> via Zelle to <span className="font-mono font-bold">bookings@tropica.nyc</span> (Tag: <span className="font-mono font-bold">tropica-nyc</span>)</li>
                  <li>Paste your generated <strong className="text-purple-950">Booking ID</strong> in your Zelle payment memo/notes.</li>
                  <li>Upload payment screenshot proof below.</li>
                  <li>Booking stays <span className="font-bold text-amber-600">Pending</span> until the backend team verifies your payment email, Booking ID &amp; amount, and confirms your slot!</li>
                </ol>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-widest text-purple-900 font-bold block">
                  📷 Upload Zelle Screenshot (Required for faster verification)
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
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">{appliedCoupon.code}</p>
                  <p className="text-[10px] text-emerald-600">Coupon successfully applied</p>
                </div>
              </div>
              <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowPolicyModal(true)}
            className="text-[11px] text-[#C8A96A] underline font-semibold flex items-center justify-center gap-1.5 w-full mb-3 hover:text-white"
          >
            View Booking &amp; Payment Policy (${finalPrice.toFixed(2)} Hold)
          </button>

          <button
            onClick={() => setShowPolicyModal(true)}
            disabled={submitting}
            className={`w-full text-on-primary py-4 rounded-xl text-xs uppercase tracking-widest font-black shadow-lg transition-all ${
              paymentMethod === "zelle"
                ? "bg-gradient-to-r from-purple-800 to-indigo-900 shadow-purple-900/30 hover:scale-[1.02]"
                : "bg-gold-gradient shadow-primary/20 hover:scale-[1.02]"
            }`}
          >
            {paymentMethod === "zelle"
              ? `Confirm & Pay with Zelle ($${finalPrice.toFixed(2)})`
              : `Confirm & Reserve ($${finalPrice.toFixed(2)})`}
          </button>
        </div>
      )}

      <BookingPolicyModal
        isOpen={showPolicyModal}
        onClose={() => setShowPolicyModal(false)}
        onAccept={handleReserve}
        amount={finalPrice}
      />

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {submitting && !clientSecret && (
        <LoadingSpinner fullPage message={paymentMethod === "zelle" ? "Submitting Zelle booking & sending to GHL..." : "Connecting to Stripe secure checkout..."} />
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
};
