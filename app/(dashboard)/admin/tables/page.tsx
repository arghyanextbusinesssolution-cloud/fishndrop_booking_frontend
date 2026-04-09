import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminTablesPage = dynamic(() => import("@/components/pages/AdminTablesPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminTablesPage />;
}
