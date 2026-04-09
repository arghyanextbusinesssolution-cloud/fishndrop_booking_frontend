import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const UserPaymentFailedPage = dynamic(() => import("@/components/pages/UserPaymentFailedPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserPaymentFailedPage />
    </Suspense>
  );
}
