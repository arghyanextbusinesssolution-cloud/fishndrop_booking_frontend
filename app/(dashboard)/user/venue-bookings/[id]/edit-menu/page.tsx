import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tropica | Edit Booking Menu",
  description: "Customize your catering partner restaurant and event menu"
};

const EditBookingMenuPage = dynamic(() => import("@/components/booking/EditBookingMenuPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return <EditBookingMenuPage />;
}
