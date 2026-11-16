import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const VenueOwnersPage = dynamic(() => import("@/components/pages/VenueOwnersPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <VenueOwnersPage />;
}
