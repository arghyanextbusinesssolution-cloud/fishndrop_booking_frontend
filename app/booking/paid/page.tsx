import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AiBookingPaidPage = dynamic(() => import("@/components/pages/AiBookingPaidPage"), {
  loading: () => <LoadingSpinner />
});

export const metadata = {
  title: "Booking Payment | Tropica",
  robots: { index: false }
};

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AiBookingPaidPage />
    </Suspense>
  );
}
