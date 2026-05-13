import { PrivateBookingWizard } from "@/components/booking/PrivateBookingWizard";

export const metadata = {
  title: "Book The Venue | Tropica",
  description: "Reserve our entire sanctuary for your private event."
};

export default function BookVenuePage() {
  return (
    <main className="min-h-screen bg-background pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PrivateBookingWizard />
      </div>
    </main>
  );
}
