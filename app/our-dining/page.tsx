import type { Metadata } from "next";
import OurDiningPageClient from "@/components/pages/OurDiningPageClient";

// SEO for /our-dining — the page itself is a client component (animations), so metadata lives here
export const metadata: Metadata = {
  title: "Private Event Venue in Brooklyn, NYC | Tropica",
  description:
    "Explore Private Event Venue in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, personalized events, and unforgettable celebrations.",
  alternates: { canonical: "https://www.tropica.nyc/our-dining/" },
  openGraph: {
    title: "Private Event Venue in Brooklyn, NYC | Tropica",
    description:
      "Explore Private Event Venue in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, personalized events, and unforgettable celebrations.",
    url: "https://www.tropica.nyc/our-dining/",
    siteName: "Tropica",
    images: [{ url: "https://www.tropica.nyc/tropica-logo.png", alt: "Tropica — private event venue in Brooklyn, NYC" }],
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "Private Event Venue in Brooklyn, NYC | Tropica",
    description:
      "Explore Private Event Venue in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, personalized events, and unforgettable celebrations."
  }
};

export default function OurDiningPage() {
  return <OurDiningPageClient />;
}
