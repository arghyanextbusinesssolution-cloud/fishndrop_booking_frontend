import dynamic from "next/dynamic";
import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tropica | Partner Venue Bookings",
  description: "Track your booking requests at Tropica partner venues"
};

const UserMarketplaceBookingsPage = dynamic(() => import("@/components/pages/UserMarketplaceBookingsPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserMarketplaceBookingsPage />
    </Suspense>
  );
}
