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

  useEffect(() => {
    const init = async () => {
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
      }
    };

    init();
  }, []);

  const handlePaymentSuccess = () => {
    if (bookingId) {
      router.push(`/user/payment/confirmed?bookingId=${bookingId}`);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pt-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#f7f6f2] rounded-xl p-6 flex justify-between items-center shadow-lg">
        <p className="font-label text-[10px] tracking-[0.3em] uppercase text-[#1a1c1b]/60 font-bold max-w-[80px] leading-tight">Total Amount</p>
        <p className="font-headline text-5xl text-[#C8A96A] font-bold tracking-tighter">${bookingData.totalPrice?.toFixed(2) || bookingData.totalPrice}</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
          {error}
        </div>
      )}

      {clientSecret && bookingId ? (
        <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: 'stripe' } }}>
          <StripePaymentForm
            bookingId={bookingId}
            onSuccess={handlePaymentSuccess}
            agreedToTerms={bookingData.guestDetails.agreedToTerms}
            agreedToTransactional={bookingData.guestDetails.agreedToTransactional}
          />
        </Elements>
      ) : !error ? (
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
      ) : null}
    </div>
  );
}
