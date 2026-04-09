import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const UserPaymentPage = dynamic(() => import("@/components/pages/UserPaymentPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return <UserPaymentPage />;
}
