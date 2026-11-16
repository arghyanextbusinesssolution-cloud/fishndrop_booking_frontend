import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Brand & Theme" };

const PartnerBrandPage = dynamic(() => import("@/components/marketplace/partner/PartnerBrandPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerBrandPage />;
}
