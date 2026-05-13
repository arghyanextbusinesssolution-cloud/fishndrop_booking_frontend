import { loadStripe } from "@stripe/stripe-js";

export const getStripe = () => {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publicKey) {
    console.error("Stripe public key missing from environment variables");
    return null;
  }
  return loadStripe(publicKey);
};
