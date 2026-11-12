import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdmittedGuestPage = dynamic(() => import("@/components/pages/AdmittedGuestPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdmittedGuestPage />;
}
