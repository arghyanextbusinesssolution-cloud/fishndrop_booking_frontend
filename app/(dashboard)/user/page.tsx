import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const UserDashboardPage = dynamic(() => import("@/components/pages/UserDashboardPage"), {
  loading: () => <LoadingSpinner />,
});

export default function Page() {
  return <UserDashboardPage />;
}
