import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Booking Requests" };

const PartnerRequestsPage = dynamic(() => import("@/components/marketplace/partner/PartnerRequestsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerRequestsPage />;
}
