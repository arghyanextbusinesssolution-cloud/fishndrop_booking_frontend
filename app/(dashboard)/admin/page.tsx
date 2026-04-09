import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminDashboardPage = dynamic(() => import("@/components/pages/AdminDashboardPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminDashboardPage />;
}
