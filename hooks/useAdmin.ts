"use client";

import { useCallback, useState } from "react";
import api from "@/lib/axios";
import { BookingResponse, Table, TableStats } from "@/types";

interface StatsResponse {
  success: boolean;
  stats: TableStats;
}

interface TablesResponse {
  success: boolean;
  tables: Table[];
  counts: { twoSeaters: number; fourSeaters: number };
}

export function useAdmin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<StatsResponse>("/admin/stats");
      return data.stats;
    } catch {
      setError("Failed to load stats");
      throw new Error("Failed to load stats");
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllBookings = useCallback(async (page = 1, status = "all") => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<BookingResponse>("/admin/bookings", {
        params: { page, limit: 10, status: status === "all" ? undefined : status },
      });
      return data;
    } catch {
      setError("Failed to load bookings");
      throw new Error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TablesResponse>("/admin/tables");
      return data.tables;
    } catch {
      setError("Failed to load tables");
      throw new Error("Failed to load tables");
    } finally {
      setLoading(false);
    }
  }, []);

  const seedTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post("/admin/seed-tables");
    } catch {
      setError("Failed to seed tables");
      throw new Error("Failed to seed tables");
    } finally {
      setLoading(false);
    }
  }, []);

  const adminCancelBooking = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/bookings/cancel/${id}`);
    } catch {
      setError("Failed to cancel booking");
      throw new Error("Failed to cancel booking");
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTableConfig = useCallback(async (twoSeaters: number, fourSeaters: number) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.patch<TablesResponse>("/admin/tables/config", { twoSeaters, fourSeaters });
      return data.tables;
    } catch {
      setError("Failed to update table configuration");
      throw new Error("Failed to update table configuration");
    } finally {
      setLoading(false);
    }
  }, []);

  const setTableAvailability = useCallback(async (tableId: string, isAvailable: boolean) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/admin/tables/${tableId}/availability`, { isAvailable });
    } catch {
      setError("Failed to update table availability");
      throw new Error("Failed to update table availability");
    } finally {
      setLoading(false);
    }
  }, []);

  const setSlotLock = useCallback(async (bookingDate: string, bookingTime: string, isLocked: boolean, reason?: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch("/admin/slots/lock", { bookingDate, bookingTime, isLocked, reason });
    } catch {
      setError("Failed to update slot lock");
      throw new Error("Failed to update slot lock");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getStats,
    getAllBookings,
    getAllTables,
    seedTables,
    updateTableConfig,
    setTableAvailability,
    setSlotLock,
    adminCancelBooking,
    loading,
    error
  };
}
