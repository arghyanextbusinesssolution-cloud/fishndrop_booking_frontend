import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminFinancialsPage = dynamic(
  () => import("@/components/pages/AdminFinancialsPage"),
  { loading: () => <LoadingSpinner /> }
);

export const metadata = {
  title: "Owner Financial Dashboard | Tropica Admin",
  description: "Executive financial tracking, revenue, vendor payables and event profitability"
};

export default function Page() {
  return <AdminFinancialsPage />;
}
