import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminDataCenterPage = dynamic(() => import("@/components/pages/AdminDataCenterPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminDataCenterPage />;
}
