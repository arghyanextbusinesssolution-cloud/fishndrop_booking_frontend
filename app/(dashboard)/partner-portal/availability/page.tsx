import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Availability" };

const PartnerAvailabilityPage = dynamic(() => import("@/components/marketplace/partner/PartnerAvailabilityPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerAvailabilityPage />;
}
