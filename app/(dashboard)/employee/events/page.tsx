import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminPromotersPage = dynamic(
  () => import("@/components/pages/AdminPromotersPage"),
  { loading: () => <LoadingSpinner /> }
);

export default function Page() {
  return <AdminPromotersPage initialTab="events" />;
}
