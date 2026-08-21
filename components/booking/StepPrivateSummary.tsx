"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2, Ticket, Check, X } from "lucide-react";
import toast from "react-hot-toast";

interface StepPrivateSummaryProps {
  bookingData: any;
  onBack: () => void;
}

const stripePromise = getStripe();

export default function StepPrivateSummary({ bookingData, onBack }: StepPrivateSummaryProps) {
  const router = useRouter();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();

  const baseCost = bookingData.durationHours * 125;
  const [submitting, setSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discountAmount: number } | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const finalCost = appliedCoupon ? Math.max(0, baseCost - appliedCoupon.discountAmount) : baseCost;
  const [customDeposit, setCustomDeposit] = useState<number>(Math.min(finalCost, 200));

  // Sync custom deposit correctly if finalCost changes
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

  const handleReserve = async () => {
    setSubmitting(true);
    setError(null);
    try {
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
        customDepositAmount: customDeposit,
        couponCode: appliedCoupon?.code || undefined,
      };

      const res = await api.post("/bookings/reserve-private", payload);

      if (res.data.success) {
        if (res.data.token && res.data.user) {
          setAuth(res.data.user, res.data.token);
        }
        setBookingId(res.data.booking._id);

        const { data: piData } = await api.post("/payments/create-payment-intent", {
          bookingId: res.data.booking._id
        });

        if (piData.success && piData.clientSecret) {
          setClientSecret(piData.clientSecret);
        } else {
          setError("Failed to initialize payment. Please try again.");
        }
      } else {
        setError(res.data.message || "Failed to create booking.");
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
      // Send private booking data to Lead Connector (GHL) only after successful Stripe payment
      try {
        fetch(
          "https://services.leadconnectorhq.com/hooks/3HmJCw40C6xzJYaLg6cK/webhook-trigger/a5543d0c-c081-4aed-b0f4-c0a0333de4de",
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
              notes: bookingData.notes || "",
              depositAmount: customDeposit,
              totalAmount: finalCost,
              bookingId: bookingId,
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
          // Non-blocking — log but don't interrupt the booking flow
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

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {!clientSecret && !bookingId && !submitting && (
        <div className="bg-[#f7f6f2] rounded-xl p-6 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
            <div className="flex justify-between items-center w-full">
              <p className="font-label text-[10px] tracking-[0.3em] uppercase text-[#1a1c1b]/60 font-bold max-w-[80px] leading-tight">Deposit Limit</p>
              <p className="font-headline text-5xl text-[#C8A96A] font-bold tracking-tighter">
                ${customDeposit.toFixed(2)}
              </p>
            </div>
            <div className="w-full sm:w-auto text-left sm:text-right sm:border-l border-black/10 sm:pl-4">
              <p className="text-[10px] uppercase tracking-widest text-[#1a1c1b]/60">Total Cost</p>
              <p className="font-semibold text-[#1a1c1b]">${finalCost.toFixed(2)}</p>
              {appliedCoupon && (
                <p className="text-[10px] text-gray-500 line-through">Orig: ${baseCost.toFixed(2)}</p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-black/10">
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
                    <p className="text-[10px] text-emerald-600">-${appliedCoupon.discountAmount.toFixed(2)} applied</p>
                  </div>
                </div>
                <button onClick={handleRemoveCoupon} className="p-1 hover:bg-emerald-100 rounded text-emerald-700 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <label className="text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Adjust your initial payment amount (Min: ${Math.min(finalCost, 200)})
            </label>
            <input
              type="range"
              min={Math.min(finalCost, 200)}
              max={finalCost}
              step="25"
              value={customDeposit}
              onChange={(e) => setCustomDeposit(Number(e.target.value))}
              className="w-full accent-[#C8A96A] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>${Math.min(finalCost, 200)}</span>
              <span>${finalCost}</span>
            </div>
          </div>

          <button
            onClick={handleReserve}
            disabled={submitting || finalCost < 0}
            className="w-full bg-[#0F4C3A] text-white py-3 rounded text-[10px] uppercase tracking-widest font-bold transition hover:bg-[#1a5b48] disabled:opacity-50"
          >
            Confirm & Pay ${customDeposit.toFixed(2)}
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
          <div className="flex items-center justify-center gap-2 text-sm text-gray-400 pt-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            Preparing payment bridge...
          </div>
        </div>
      )}

      {clientSecret && bookingId && (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
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
