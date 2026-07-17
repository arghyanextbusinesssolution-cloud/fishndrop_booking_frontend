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

  const handleReserve = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        partySize: bookingData.guests,
        bookingDate: bookingData.date,
        bookingTime: bookingData.time,
        customerName: bookingData.guestDetails.name,
        customerEmail: bookingData.guestDetails.email,
        customerPhone: bookingData.guestDetails.phone,
        password: bookingData.guestDetails.password || undefined,
        occasion: bookingData.occasion || "other",
        notes: "",
        cakeDetails: bookingData.addons.includes("cake") ? "Signature Birthday Cake" : "",
        customCakeDetails: bookingData.addons.includes("custom_cake") ? bookingData.customCakeDetails : undefined,
        cakePrice: bookingData.addons.includes("custom_cake") && bookingData.customCakeDetails
          ? bookingData.customCakeDetails.retailPrice
          : bookingData.addons.includes("cake") ? 50 : 0,
        couponCode: appliedCoupon?.code || undefined,
      };

      const { data } = await api.post("/bookings/reserve", payload);

      if (data.success) {
        if (data.token && data.user) {
          setAuth(data.user, data.token);
        }
        setBookingId(data.booking._id);

        const { data: piData } = await api.post("/payments/create-payment-intent", {
          bookingId: data.booking._id,
        });

        if (piData.success && piData.clientSecret) {
          setClientSecret(piData.clientSecret);
        } else {
          setError("Failed to initialize payment. Please try again.");
        }
      } else {
        setError(data.message || "Failed to create booking.");
      }
    } catch (err) {
      console.error("Payment init failed:", err);
      setError("An error occurred. Please go back and try again.");
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
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {!clientSecret && !bookingId && !submitting && (
        <div className="space-y-6 bg-[#f7f6f2] rounded-xl p-6 shadow-lg">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-black/10 pb-4">
            <div>
              <p className="font-label text-[10px] tracking-[0.3em] uppercase text-[#1a1c1b]/60 font-bold max-w-[80px] leading-tight">Total Amount</p>
              <p className="font-headline text-5xl text-[#C8A96A] font-bold tracking-tighter">${finalPrice.toFixed(2)}</p>
            </div>
            {appliedCoupon && (
              <div className="text-left sm:text-right">
                <p className="text-[10px] tracking-widest uppercase text-emerald-600 font-bold">Discount Applied</p>
                <p className="font-semibold text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)}</p>
                <p className="text-[10px] text-gray-500 line-through">Orig: ${totalPrice.toFixed(2)}</p>
              </div>
            )}
          </div>

          {!appliedCoupon ? (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold flex items-center gap-2">
                <Ticket className="w-3 h-3" /> Referral Code
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 bg-white border border-[#C8A96A]/30 rounded-lg px-4 py-2 text-sm text-[#1a1c1b] focus:outline-none focus:border-[#C8A96A]"
                />
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  disabled={isValidating || !couponCode}
                  className="bg-[#C8A96A] text-white px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider disabled:opacity-50 min-w-[80px] flex justify-center items-center"
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
            onClick={handleReserve}
            disabled={submitting}
            className="w-full bg-gold-gradient text-on-primary py-4 rounded-lg text-[10px] uppercase tracking-widest font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
          >
            Confirm & Reserve
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {submitting && !clientSecret && (
        <div className="space-y-4 animate-pulse p-6 bg-primary/5 rounded-xl border border-primary/10">
          <div className="h-6 w-40 bg-gray-200 rounded mb-6" />
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-12 bg-gray-200 rounded-lg" />
            <div className="h-12 bg-gray-200 rounded-lg" />
          </div>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Connecting to Stripe...
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
};
