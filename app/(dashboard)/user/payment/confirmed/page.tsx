import { Suspense } from "react";
import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const UserPaymentConfirmedPage = dynamic(() => import("@/components/pages/UserPaymentConfirmedPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <UserPaymentConfirmedPage />
    </Suspense>
  );
}
