import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminUsersPage = dynamic(
  () => import("@/components/pages/AdminUsersPage"),
  { loading: () => <LoadingSpinner /> }
);

export const metadata = {
  title: "User Directory | Admin Concierge",
  description: "View and manage all customer accounts, phone verification, and reservations."
};

export default function Page() {
  return <AdminUsersPage />;
}
