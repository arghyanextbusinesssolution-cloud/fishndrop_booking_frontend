import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminCelebrationsPage = dynamic(() => import("@/components/pages/AdminCelebrationsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminCelebrationsPage />;
}
