import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const AdminGalleryPage = dynamic(() => import("@/components/pages/AdminGalleryPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return <AdminGalleryPage />;
}
