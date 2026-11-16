import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Stripe & Payouts" };

const PartnerPayoutsPage = dynamic(() => import("@/components/marketplace/partner/PartnerPayoutsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PartnerPayoutsPage />
    </Suspense>
  );
}
