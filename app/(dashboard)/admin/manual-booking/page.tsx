import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminManualBookingWizard = dynamic(
  () =>
    import("@/components/admin/AdminManualBookingWizard").then(
      (mod) => mod.AdminManualBookingWizard
    ),
  { loading: () => <LoadingSpinner /> }
);

export default function Page() {
  return <AdminManualBookingWizard />;
}
