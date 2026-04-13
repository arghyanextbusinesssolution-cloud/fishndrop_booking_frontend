import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminLocksPage = dynamic(() => import("@/components/pages/AdminLocksPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminLocksPage />;
}
