import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Bookings" };

const PartnerBookingsPage = dynamic(() => import("@/components/marketplace/partner/PartnerBookingsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerBookingsPage />;
}
