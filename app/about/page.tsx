import type { Metadata } from "next";
import AboutPageClient from "@/components/pages/AboutPageClient";

const title = "Private Dining Experience in Brooklyn, NYC | Tropica";
const description =
  "Discover a Private Dining Experience in Brooklyn, NYC at Tropica. Enjoy elegant garden dining, delicious cuisine, and memorable celebrations.";

// SEO for /about — the page itself is a client component, so metadata lives here
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "https://www.tropica.nyc/about/" },
  openGraph: {
    title,
    description,
    url: "https://www.tropica.nyc/about/",
    siteName: "Tropica",
    images: [{ url: "https://www.tropica.nyc/tropica-logo.png", alt: "Tropica — Brooklyn, NYC" }],
    locale: "en_US",
    type: "website"
  },
  twitter: { card: "summary_large_image", title, description }
};

export default function AboutPage() {
  return <AboutPageClient />;
}
