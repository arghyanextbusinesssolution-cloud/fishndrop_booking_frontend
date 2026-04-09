"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Table } from "@/types";
import { TablesGrid } from "@/components/admin/TablesGrid";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AdminTablesPage() {
  const { getAllTables, seedTables, updateTableConfig, setTableAvailability, setSlotLock, loading } = useAdmin();
  const [tables, setTables] = useState<Table[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const load = useCallback(async () => {
    setPageLoading(true);
    try {
      setTables(await getAllTables());
    } catch {
      setTables([]);
    } finally {
      setPageLoading(false);
    }
  }, [getAllTables]);

  useEffect(() => {
    void load();
  }, [load]);
  if (pageLoading) return <LoadingSpinner />;
  return (
    <TablesGrid
      tables={tables}
      seeding={loading}
      onSeed={async () => {
        await seedTables();
        toast.success("Tables seeded successfully");
        await load();
      }}
      onUpdateConfig={async (twoSeaters, fourSeaters) => {
        await updateTableConfig(twoSeaters, fourSeaters);
        toast.success("Table configuration updated");
        await load();
      }}
      onToggleAvailability={async (tableId, isAvailable) => {
        await setTableAvailability(tableId, isAvailable);
        toast.success(isAvailable ? "Table unlocked" : "Table blocked");
        await load();
      }}
      onSlotLock={async (bookingDate, bookingTime, isLocked, reason) => {
        await setSlotLock(bookingDate, bookingTime, isLocked, reason);
        toast.success(isLocked ? "Slot locked by admin" : "Slot unlocked");
      }}
    />
  );
}
