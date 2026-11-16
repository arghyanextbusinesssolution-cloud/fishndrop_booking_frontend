import type { Metadata } from "next";
import HomePageClient from "@/components/home/HomePageClient";

// Homepage SEO — the page itself is a client component, so its metadata lives in this server wrapper
export const metadata: Metadata = {
  title: "Private Venue Booking in Brooklyn, NYC | Tropica",
  description:
    "Discover Private Venue Booking in Brooklyn, NYC with Tropica. Enjoy an elegant garden setting, private dining, catering, and unforgettable celebrations.",
  alternates: { canonical: "https://www.tropica.nyc/" },
  openGraph: {
    title: "Private Venue Booking in Brooklyn, NYC | Tropica",
    description:
      "Discover Private Venue Booking in Brooklyn, NYC with Tropica. Enjoy an elegant garden setting, private dining, catering, and unforgettable celebrations.",
    url: "https://www.tropica.nyc/",
    siteName: "Tropica",
    images: [{ url: "https://www.tropica.nyc/tropica-logo.png", alt: "Tropica — private venue in Brooklyn, NYC" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Venue Booking in Brooklyn, NYC | Tropica",
    description:
      "Discover Private Venue Booking in Brooklyn, NYC with Tropica. Enjoy an elegant garden setting, private dining, catering, and unforgettable celebrations."
  }
};

export default function Home() {
  return <HomePageClient />;
}
