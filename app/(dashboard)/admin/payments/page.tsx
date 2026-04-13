import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminPaymentsPage = dynamic(() => import("@/components/pages/AdminPaymentsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminPaymentsPage />;
}
