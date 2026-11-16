import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Venue Revenue" };

const VenueRevenuePage = dynamic(() => import("@/components/pages/VenueRevenuePage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <VenueRevenuePage />;
}
