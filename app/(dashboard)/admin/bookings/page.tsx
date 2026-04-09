import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminBookingsPage = dynamic(() => import("@/components/pages/AdminBookingsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminBookingsPage />;
}
