"use client";

import { useEffect, useRef, useState } from "react";
import { useAdmin } from "@/hooks/useAdmin";
import { StatsCards } from "@/components/admin/StatsCards";
import { BookingTable } from "@/components/booking/BookingTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { Booking, TableStats } from "@/types";
import api from "@/lib/axios";

export default function AdminDashboardPage() {
  const { getStats } = useAdmin();
  const [stats, setStats] = useState<TableStats | null>(null);
  const [recent, setRecent] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false);

  useEffect(() => {
    if (hasLoadedRef.current) {
      return;
    }
    hasLoadedRef.current = true;

    const load = async () => {
      try {
        const [statsData, bookingsData] = await Promise.all([
          getStats(),
          api.get("/admin/bookings", { params: { limit: 5 } })
        ]);
        setStats(statsData);
        setRecent(bookingsData.data.bookings as Booking[]);
      } catch {
        setStats(null);
        setRecent([]);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, [getStats]);
  if (loading || !stats) return <LoadingSpinner />;
  return <div className="space-y-6"><StatsCards stats={stats} /><BookingTable bookings={recent} /></div>;
}
