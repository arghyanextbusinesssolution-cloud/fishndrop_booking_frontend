import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const BookingDetailPage = dynamic(() => import("@/components/pages/BookingDetailPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <BookingDetailPage />;
}
