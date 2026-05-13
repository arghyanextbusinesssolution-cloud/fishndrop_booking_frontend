import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const UserVenueBookingsPage = dynamic(() => import("@/components/pages/UserVenueBookingsPage"), { 
  loading: () => <LoadingSpinner /> 
});

export default function Page() {
  return <UserVenueBookingsPage />;
}
