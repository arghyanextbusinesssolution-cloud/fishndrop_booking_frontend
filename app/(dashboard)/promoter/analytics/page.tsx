import dynamic from "next/dynamic";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const EventAnalyticsPage = dynamic(() => import("@/components/events/EventAnalyticsPage"), {
  loading: () => <LoadingSpinner />
});

export default function Page() {
  return <EventAnalyticsPage mode="promoter" />;
}
