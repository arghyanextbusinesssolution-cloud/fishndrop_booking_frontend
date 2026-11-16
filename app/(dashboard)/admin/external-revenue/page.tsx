import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tropica | External Revenue" };

const ExternalRevenuePage = dynamic(() => import("@/components/pages/ExternalRevenuePage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <ExternalRevenuePage />;
}
