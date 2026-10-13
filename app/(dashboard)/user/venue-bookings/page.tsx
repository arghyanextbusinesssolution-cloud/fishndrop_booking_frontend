import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tropica | Venue Bookings",
  description: "View and manage your private venue buyouts and dining menus"
};

const UserVenueBookingsPage = dynamic(() => import("@/components/pages/UserVenueBookingsPage"), { 
  loading: () => <LoadingSpinner /> 
});

export default function Page() {
  return <UserVenueBookingsPage />;
}
