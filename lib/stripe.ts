import { loadStripe } from "@stripe/stripe-js";

export const getStripe = () => {
  const publicKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!publicKey) {
    console.error("Stripe public key missing from environment variables");
    return null;
  }

  if (process.env.NODE_ENV !== "production" || true) { // temporary true to debug
    console.log("Stripe Initialized with prefix:", publicKey.substring(0, 10) + "...");
  }

  return loadStripe(publicKey);
};
