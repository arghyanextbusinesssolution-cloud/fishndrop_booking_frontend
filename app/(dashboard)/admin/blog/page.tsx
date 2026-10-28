import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminBlogPage = dynamic(() => import("@/components/pages/AdminBlogPage"), { loading: () => <LoadingSpinner /> });

export default function Page() {
  return <AdminBlogPage />;
}
