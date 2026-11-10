import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminCateringPage = dynamic(() => import("@/components/pages/AdminCateringPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminCateringPage />;
}

