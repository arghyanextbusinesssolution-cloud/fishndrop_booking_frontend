import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = {
  title: "Private Dining Reservations in Brooklyn, NYC | Tropica",
  description:
    "Book Private Dining Reservations in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, delicious cuisine, and unforgettable celebrations.",
  alternates: { canonical: "https://www.tropica.nyc/book-table/" },
  openGraph: {
    title: "Private Dining Reservations in Brooklyn, NYC | Tropica",
    description:
      "Book Private Dining Reservations in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, delicious cuisine, and unforgettable celebrations.",
    url: "https://www.tropica.nyc/book-table/",
    siteName: "Tropica",
    images: [{ url: "https://www.tropica.nyc/tropica-logo.png", alt: "Tropica — Brooklyn, NYC" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Dining Reservations in Brooklyn, NYC | Tropica",
    description:
      "Book Private Dining Reservations in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, delicious cuisine, and unforgettable celebrations."
  }
};

export default function BookTablePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 rounded-full border-4 border-primary-container border-t-primary animate-spin" />
      </div>
    }>
      <div className="theme-astral min-h-screen bg-background">
        <BookingWizard />
      </div>
    </Suspense>
  );
}
