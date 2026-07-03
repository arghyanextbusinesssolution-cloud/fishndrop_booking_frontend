"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";


interface StripePaymentFormProps {
  onSuccess: (bookingId: string, paymentIntentId?: string) => void;
  bookingId: string;
  agreedToTerms?: boolean;
  agreedToTransactional?: boolean;
}

export const StripePaymentForm = ({
  onSuccess,
  bookingId,
  agreedToTerms = true,
  agreedToTransactional = true
}: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/user/payment/confirmed?bookingId=${bookingId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "An unexpected error occurred.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast.success("Payment successful!");
      onSuccess(bookingId, paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fade-in">
      <div className="p-6 bg-primary/5 rounded-xl border border-primary/10 space-y-6">
        <div className="flex items-center gap-4 text-primary mb-4">
          <ShieldCheck className="w-6 h-6" />
          <span className="font-headline italic text-xl">Official Stripe Payment</span>
        </div>

        <PaymentElement />

        <div className="flex items-center gap-2 text-[9px] uppercase tracking-widest text-on-surface/40 font-bold pt-2">
          <Lock size={10} />
          PCI-DSS Level 1 Secure
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || isProcessing || !agreedToTerms || !agreedToTransactional}
        className={cn(
          "w-full bg-gold-gradient text-on-primary font-label text-[10px] tracking-[0.3em] uppercase py-6 rounded-lg shadow-2xl shadow-primary/30 active:scale-95 transition-all duration-500 font-bold flex justify-center items-center gap-2",
          (!stripe || isProcessing || !agreedToTerms || !agreedToTransactional) ? "opacity-30 grayscale cursor-not-allowed" : "hover:scale-[1.05]"
        )}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing Payment...
          </>
        ) : (
          "Complete Payment & Book"
        )}
      </button>
    </form>
  );
};
