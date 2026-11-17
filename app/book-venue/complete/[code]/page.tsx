import AiBookingCheckout from "@/components/booking/AiBookingCheckout";
import { NavBar } from "@/components/shared/NavBar";

export const metadata = {
  title: "Complete Your Booking | Tropica",
  description: "Verify your phone and pay the deposit to secure your Tropica venue booking.",
  robots: { index: false, follow: false }
};

/** Checkout link the Tropica AI sends in a DM: /book-venue/complete/TRP-XXXXXX */
export default function CompleteAiBookingPage() {
  return (
    <div className="theme-astral min-h-screen bg-brand-bg transition-colors duration-500">
      <NavBar />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AiBookingCheckout />
        </div>
      </main>
    </div>
  );
}
