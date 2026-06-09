import { PrivateBookingWizard } from "@/components/booking/PrivateBookingWizard";
import { NavBar } from "@/components/shared/NavBar";

export const metadata = {
  title: "Book The Venue | Tropica",
  description: "Reserve our entire sanctuary for your private event."
};

export default function BookVenuePage() {
  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E]">
      <NavBar />
      <main className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <PrivateBookingWizard />
        </div>
      </main>
    </div>
  );
}
