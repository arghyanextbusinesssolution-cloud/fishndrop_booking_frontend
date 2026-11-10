"use client";

import { useState } from "react";
import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

interface Props {
  orderId: string;
  totalAmount: number;
  disabled?: boolean;
  onPaid: (paymentIntentId: string) => void;
  onProcessing: () => void;
}

/**
 * Embedded Stripe card form (same PaymentIntent + PaymentElement flow as venue booking).
 * Must be rendered inside <Elements options={{ clientSecret }}>.
 */
export function TicketPaymentForm({ orderId, totalAmount, disabled, onPaid, onProcessing }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const [ready, setReady] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || paying) return;
    setError(null);
    setPaying(true);

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Only used by payment methods that need a redirect (e.g. 3-D Secure on some banks)
        return_url: `${window.location.origin}/tickets/success?order_id=${orderId}`
      },
      redirect: "if_required"
    });

    if (stripeError) {
      setError(stripeError.message || "Payment failed. Please check your card and try again.");
      setPaying(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      onPaid(paymentIntent.id);
      return; // keep spinner while navigating
    }
    if (paymentIntent?.status === "processing") {
      onProcessing();
      return;
    }
    setError("Payment was not completed. Please try again.");
    setPaying(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 mb-3 text-[#E0C68E]">
          <ShieldCheck className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Card payment</span>
        </div>
        {!ready && (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#C8A96A]" />
          </div>
        )}
        <PaymentElement
          onReady={() => setReady(true)}
          options={{ layout: "tabs", wallets: { applePay: "auto", googlePay: "auto" } }}
        />
      </div>

      {error && (
        <p className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={!stripe || !ready || paying || disabled}
        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#C8A96A] via-[#E0C68E] to-[#C8A96A] text-[#0a120e] text-xs font-black uppercase tracking-[0.15em] shadow-lg shadow-[#C8A96A]/20 flex items-center justify-center gap-2 transition-all disabled:opacity-40 cursor-pointer"
      >
        {paying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
        {paying ? "Processing payment…" : `Pay $${totalAmount.toFixed(2)}`}
      </button>

      <p className="text-[10px] text-center text-white/40 flex items-center justify-center gap-1.5">
        <Lock className="w-3 h-3" /> Secured by Stripe · PCI-DSS Level 1
      </p>
    </form>
  );
}
