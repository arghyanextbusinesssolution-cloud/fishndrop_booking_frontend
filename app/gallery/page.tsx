import type { Metadata } from "next";
import GalleryPageClient from "@/components/pages/GalleryPageClient";

const title = "Private Party Venue in Brooklyn, NYC | Tropica";
const description =
  "Discover the perfect Private Party Venue in Brooklyn, NYC at Tropica. Enjoy elegant garden spaces, private dining, and unforgettable celebrations.";

// SEO for /gallery — the page itself is a client component, so metadata lives here
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://www.tropica.nyc/gallery/" },
  openGraph: {
    title,
    description,
    url: "https://www.tropica.nyc/gallery/",
    siteName: "Tropica",
    images: [{ url: "https://www.tropica.nyc/tropica-logo.png", alt: "Tropica — private party venue in Brooklyn, NYC" }],
    locale: "en_US",
    type: "website"
  },
  twitter: { card: "summary_large_image", title, description }
};

export default function GalleryPage() {
  return <GalleryPageClient />;
}
