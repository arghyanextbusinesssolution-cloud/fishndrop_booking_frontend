"use client";

import { useCallback, useState } from "react";
import api from "@/lib/axios";
import { BookingResponse, Table, TableStats, Booking } from "@/types";

interface StatsResponse {
  success: boolean;
  stats: TableStats;
}

interface TablesResponse {
  success: boolean;
  tables: Table[];
  counts: { twoSeaters: number; fourSeaters: number };
}

export interface SlotLockItem {
  _id: string;
  bookingDate: string;
  bookingTime: string;
  isLocked: boolean;
  reason?: string;
}

export interface PaymentSummary {
  totalRevenue: number;
  pendingRevenue: number;
  totalBookings: number;
  paidCount: number;
  unpaidCount: number;
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

  const getAllBookings = useCallback(async (page = 1, status = "all", date?: string, limit = 10) => {
    setLoading(true);
    setError(null);
    try {
      const params = { 
        page, 
        limit, 
        status: status === "all" ? undefined : status,
        date: date || undefined
      };
      console.log("[useAdmin] getAllBookings request params:", params);
      const { data } = await api.get<BookingResponse>("/admin/bookings", {
        params,
      });
      return data;
    } catch {
      setError("Failed to load bookings");
      throw new Error("Failed to load bookings");
    } finally {
      setLoading(false);
    }
  }, []);

  const getAllTables = useCallback(async (date?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<TablesResponse>("/admin/tables", {
        params: { date }
      });
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

  const setTableAvailability = useCallback(async (tableId: string, isAvailable: boolean, date?: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.patch(`/admin/tables/${tableId}/availability`, { isAvailable, date });
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

  const getSlotLocks = useCallback(async (): Promise<SlotLockItem[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; locks: SlotLockItem[] }>("/admin/slot-locks");
      return data.locks;
    } catch {
      setError("Failed to load slot locks");
      throw new Error("Failed to load slot locks");
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentSummary = useCallback(async (): Promise<{ summary: PaymentSummary; recentBookings: Booking[] }> => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get<{ success: boolean; summary: PaymentSummary; recentBookings: Booking[] }>("/admin/payments/summary");
      return { summary: data.summary, recentBookings: data.recentBookings };
    } catch {
      setError("Failed to load payment summary");
      throw new Error("Failed to load payment summary");
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTable = useCallback(async (tableId: string) => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/admin/tables/${tableId}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to delete table";
      setError(msg);
      throw new Error(msg);
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
    getSlotLocks,
    getPaymentSummary,
    deleteTable,
    loading,
    error
  };
}
