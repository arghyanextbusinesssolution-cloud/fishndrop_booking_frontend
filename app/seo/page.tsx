import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

// Same blog module the admin uses (create / edit / publish / delete posts shown on tropica.nyc/blog)
const AdminBlogPage = dynamic(() => import("@/components/pages/AdminBlogPage"), { loading: () => <LoadingSpinner /> });

export default function SeoBlogPage() {
  return <AdminBlogPage />;
}
