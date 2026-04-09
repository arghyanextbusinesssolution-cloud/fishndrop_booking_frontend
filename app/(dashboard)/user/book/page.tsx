import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const BookPage = dynamic(() => import("@/components/pages/UserBookPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <BookPage />;
}
