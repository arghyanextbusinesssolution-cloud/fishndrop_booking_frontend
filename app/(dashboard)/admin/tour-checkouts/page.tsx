import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminTourCheckoutsPage = dynamic(
  () => import("@/components/pages/AdminTourCheckoutsPage").then((m) => m.AdminTourCheckoutsPage),
  { loading: () => <LoadingSpinner /> }
);

export default function Page() {
  return <AdminTourCheckoutsPage />;
}

