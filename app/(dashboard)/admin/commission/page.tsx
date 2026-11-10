import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminCommissionPage = dynamic(() => import("@/components/pages/AdminCommissionPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return <AdminCommissionPage />;
}
