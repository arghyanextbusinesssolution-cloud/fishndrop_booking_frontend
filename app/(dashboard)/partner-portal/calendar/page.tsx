import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | Calendar" };

const PartnerCalendarPage = dynamic(() => import("@/components/marketplace/partner/PartnerCalendarPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerCalendarPage />;
}
