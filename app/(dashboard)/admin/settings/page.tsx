import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminSettingsPage = dynamic(() => import("@/components/pages/AdminSettingsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminSettingsPage />;
}
