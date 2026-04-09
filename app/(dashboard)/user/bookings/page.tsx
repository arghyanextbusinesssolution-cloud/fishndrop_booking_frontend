import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const MyBookingsPage = dynamic(() => import("@/components/pages/UserBookingsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <MyBookingsPage />;
}
