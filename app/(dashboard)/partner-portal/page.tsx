import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tropica | Partner Portal",
  description: "Manage your venue on Tropica NYC"
};

const PartnerPortalPage = dynamic(() => import("@/components/pages/PartnerPortalPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <PartnerPortalPage />;
}
