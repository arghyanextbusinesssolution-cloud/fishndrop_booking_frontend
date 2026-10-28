"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAttributionTracking, trackMetaConversion } from "@/lib/tracking";

export const AttributionInitializer = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const attribution = initAttributionTracking();
    if (pathname === "/book-venue" || pathname === "/book-table") {
      trackMetaConversion("ViewContent", {
        content_name: pathname === "/book-venue" ? "Private Sanctuary Booking" : "Table Reservation",
        source: attribution.utm_source || "direct"
      });
    }
  }, [pathname, searchParams]);

  return null;
};
