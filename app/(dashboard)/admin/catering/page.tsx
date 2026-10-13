import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminCateringPage = dynamic(() => import("@/components/pages/AdminCateringPage"), {
  loading: () => <LoadingSpinner />
});

export const metadata = {
  title: "Restaurants & Catering | Admin Dashboard",
  description: "Manage private venue buyout catering requests, partner restaurant selections, and quote proposals."
};

export default function Page() {
  return <AdminCateringPage />;
}
