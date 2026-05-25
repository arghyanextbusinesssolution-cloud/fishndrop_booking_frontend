"use client";

import { useState } from "react";
import { useStripe, useElements, PaymentElement } from "@stripe/react-stripe-js";
import { Loader2, ShieldCheck, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import Link from "next/link";


interface StripePaymentFormProps {
  onSuccess: (bookingId: string) => void;
  bookingId: string;
}

export const StripePaymentForm = ({ onSuccess, bookingId }: StripePaymentFormProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [agreedToTransactional, setAgreedToTransactional] = useState(false);
  const [agreedToMarketing, setAgreedToMarketing] = useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Return URL is required but since we handle success client-side if possible, 
        // we provide a fallback.
        return_url: `${window.location.origin}/user/payment/confirmed?bookingId=${bookingId}`,
      },
      redirect: "if_required",
    });

    if (error) {
      toast.error(error.message || "An unexpected error occurred.");
      setIsProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      toast.success("Payment successful!");
      onSuccess(bookingId);
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

      <div className="space-y-4 px-1">
        <label className="flex gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-[#C8A96A]/30 bg-transparent checked:bg-[#C8A96A] transition-all"
              checked={agreedToTransactional}
              onChange={(e) => setAgreedToTransactional(e.target.checked)}
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current stroke-[4px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] leading-relaxed text-on-surface/60 font-body transition-colors group-hover:text-on-surface/80">
            I consent to receive transactional messages from Tropic.nyc at the phone number provided. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
          </span>
        </label>

        <label className="flex gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-[#C8A96A]/30 bg-transparent checked:bg-[#C8A96A] transition-all"
              checked={agreedToMarketing}
              onChange={(e) => setAgreedToMarketing(e.target.checked)}
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current stroke-[4px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] leading-relaxed text-on-surface/60 font-body transition-colors group-hover:text-on-surface/80">
            I consent to receive marketing and promotional messages from Tropic.nyc at the phone number provided. Message frequency may vary. Message & Data rates may apply. Reply HELP for help or STOP to opt-out.
          </span>
        </label>

        <label className="flex gap-3 cursor-pointer group">
          <div className="relative flex items-center">
            <input
              type="checkbox"
              className="peer h-4 w-4 shrink-0 appearance-none rounded-sm border border-[#C8A96A]/30 bg-transparent checked:bg-[#C8A96A] transition-all"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
            />
            <div className="absolute inset-0 flex items-center justify-center text-primary-foreground opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none">
              <svg viewBox="0 0 24 24" className="h-3 w-3 fill-none stroke-current stroke-[4px]">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>
          <span className="text-[10px] leading-relaxed text-on-surface/60 font-body transition-colors group-hover:text-on-surface/80">
            I agree to the <a href="/terms" className="text-[#C8A96A] underline hover:text-[#C8A96A]/80 transition-colors" target="_blank" rel="noopener noreferrer">Terms & Conditions</a> and <a href="/privacy-policy" className="text-[#C8A96A] underline hover:text-[#C8A96A]/80 transition-colors" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.
          </span>
        </label>
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
