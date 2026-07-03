"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { StripePaymentForm } from "./StripePaymentForm";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";
import { Loader2 } from "lucide-react";

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
  const totalCost = bookingData.durationHours * 250;
  const [customDeposit, setCustomDeposit] = useState<number>(Math.min(totalCost, 200));
  const [submitting, setSubmitting] = useState(false);

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
            <div className="w-full sm:w-auto text-right sm:border-l border-black/10 sm:pl-4">
              <p className="text-[10px] uppercase tracking-widest text-[#1a1c1b]/60">Total Cost</p>
              <p className="font-semibold text-[#1a1c1b]">${totalCost.toFixed(2)}</p>
            </div>
          </div>
          <div className="space-y-4 pt-4 border-t border-black/10">
            <label className="text-[10px] uppercase tracking-widest text-[#1a1c1b]/60 font-bold block">
              Adjust your initial payment amount (Min: ${Math.min(totalCost, 200)})
            </label>
            <input
              type="range"
              min={Math.min(totalCost, 200)}
              max={totalCost}
              step="50"
              value={customDeposit}
              onChange={(e) => setCustomDeposit(Number(e.target.value))}
              className="w-full accent-[#C8A96A] h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs font-semibold text-gray-500">
              <span>${Math.min(totalCost, 200)}</span>
              <span>${totalCost}</span>
            </div>
          </div>
          <button
            onClick={handleReserve}
            className="w-full bg-[#0F4C3A] text-white py-3 rounded text-[10px] uppercase tracking-widest font-bold transition hover:bg-[#1a5b48]"
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
