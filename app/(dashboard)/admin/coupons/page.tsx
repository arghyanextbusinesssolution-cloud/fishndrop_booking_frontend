import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminCouponsPage = dynamic(() => import("@/components/pages/AdminCouponsPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
    return <AdminCouponsPage />;
}
