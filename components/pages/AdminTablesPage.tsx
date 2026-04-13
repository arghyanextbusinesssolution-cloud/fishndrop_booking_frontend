"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Table } from "@/types";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { Plus, Minus, Lock, Unlock, Users, Armchair, LayoutGrid, Trash2, ShieldAlert } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Booking } from "@/types";

export default function AdminTablesPage() {
  const { getAllTables, seedTables, updateTableConfig, setTableAvailability, getAllBookings, adminCancelBooking, deleteTable, loading } = useAdmin();
  const [tables, setTables] = useState<Table[]>([]);
  const [allBookingsForDate, setAllBookingsForDate] = useState<Booking[]>([]);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [tableToUnlock, setTableToUnlock] = useState<Table | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [twoCount, setTwoCount] = useState(0);
  const [fourCount, setFourCount] = useState(0);
  const [isFetchingBookings, setIsFetchingBookings] = useState(false);

  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [bookedTableIds, setBookedTableIds] = useState<Set<string>>(new Set());

  const load = useCallback(async (date?: string) => {
    setPageLoading(true);
    try {
      const loaded = await getAllTables(date);
      setTables(loaded);
      setTwoCount(loaded.filter((t) => t.capacity === 2).length);
      setFourCount(loaded.filter((t) => t.capacity === 4).length);
    } catch {
      setTables([]);
    } finally {
      setPageLoading(false);
    }
  }, [getAllTables]);

  const fetchBookingsForDate = useCallback(async (dateStr: string) => {
    console.log("[FloorPlan] Refreshing for date:", dateStr);
    setIsFetchingBookings(true);
    try {
      const data = await getAllBookings(1, "all", dateStr, 100);
      console.log("[FloorPlan] Backend response received:", data.bookings.length, "bookings found");
      const bookedTabs = new Set<string>();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data.bookings.forEach((b: any) => {
        if (b.status === "cancelled") {
          console.log("[FloorPlan] Skipping cancelled booking:", b._id);
          return;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        b.tables?.forEach((t: any) => {
           const tid = typeof t === "string" ? t : t._id;
           bookedTabs.add(tid);
        });
      });
      console.log("[FloorPlan] Calculated bookedTableIds:", Array.from(bookedTabs));
      setBookedTableIds(bookedTabs);
      setAllBookingsForDate(data.bookings);
    } catch (err) {
      console.error("Failed to fetch daily bookings", err);
      toast.error("Failed to refresh floor plan");
    } finally {
      setIsFetchingBookings(false);
    }
  }, [getAllBookings]);

  const handleToggleTable = async (table: Table, isBooked: boolean) => {
    if (isBooked && table.isAvailable) {
      setTableToUnlock(table);
      setUnlockDialogOpen(true);
      return;
    }
    
    await setTableAvailability(table._id, !table.isAvailable, selectedDate);
    toast.success(table.isAvailable ? "Table locked" : "Table unlocked");
    await load(selectedDate);
  };

  const performUnlockBookedTable = async () => {
    if (!tableToUnlock) return;
    
    setUnlockDialogOpen(false);
    const loadingToast = toast.loading("Unlocking table and cancelling bookings...");
    
    try {
      // Find all bookings for this table on this date
      const bookingsToCancel = allBookingsForDate.filter(b => 
        b.tables.some(t => t._id === tableToUnlock._id)
      );
      
      if (bookingsToCancel.length === 0) {
        toast.error("No active bookings found for this table");
        return;
      }

      await Promise.all(bookingsToCancel.map(b => adminCancelBooking(b._id)));
      
      toast.success(`Successfully unlocked Table ${tableToUnlock.tableNumber} and cancelled ${bookingsToCancel.length} booking(s)`, { id: loadingToast });
      
      await load(selectedDate);
      await fetchBookingsForDate(selectedDate);
    } catch (err: any) {
      toast.error(err.message || "Failed to unlock table", { id: loadingToast });
    } finally {
      setTableToUnlock(null);
    }
  };

  useEffect(() => {
    void load(selectedDate);
  }, [load]);

  useEffect(() => {
    void fetchBookingsForDate(selectedDate);
    // Only run on initial mount to set default state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchBookingsForDate]);

  if (pageLoading) return <LoadingSpinner />;

  const totalTables = tables.length;
  const bookedCount = tables.filter((t) => bookedTableIds.has(t._id)).length;
  const globallyLockedCount = tables.filter((t) => !t.isAvailable).length;
  const availableToday = tables.filter((t) => t.isAvailable && !bookedTableIds.has(t._id)).length;
  
  const totalCapacity = tables.reduce((acc, t) => acc + t.capacity, 0);
  const availableCapacity = tables.filter((t) => t.isAvailable && !bookedTableIds.has(t._id))
                                  .reduce((acc, t) => acc + t.capacity, 0);

  const twoSeaters = tables.filter((t) => t.capacity === 2);
  const fourSeaters = tables.filter((t) => t.capacity === 4);

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen">

      {/* Page Header */}
      <div className="space-y-2">
        <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
          Administration
        </span>
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
          Table Management
        </h1>
        <p className="text-sm text-secondary font-body font-light italic">
          Configure your dining room layout, add or remove tables, and control availability.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { 
            label: "Total Tables", 
            value: totalTables, 
            icon: LayoutGrid, 
            sub: `${twoSeaters.length} two-seaters · ${fourSeaters.length} four-seaters` 
          },
          { 
            label: "Available Today", 
            value: availableToday, 
            icon: Unlock, 
            sub: "Ready for guest seating" 
          },
          { 
            label: "Occupied/Locked", 
            value: bookedCount + globallyLockedCount, 
            icon: Lock, 
            sub: `${bookedCount} booked · ${globallyLockedCount} locked` 
          },
          { 
            label: "Total Capacity", 
            value: totalCapacity, 
            icon: Users, 
            sub: `${availableCapacity} seats available today` 
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-xl p-6 flex flex-col justify-between h-36 border border-outline-variant/20 bg-surface-container-lowest shadow-sm transition-all duration-300 hover:shadow-md">
              <div className="flex items-start justify-between">
                <p className="text-[9px] uppercase tracking-widest font-bold text-outline">{card.label}</p>
                <Icon className="w-4 h-4 text-outline/40" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-headline text-4xl italic text-on-surface">{card.value}</p>
                <span className="text-[9px] font-body italic text-outline">{card.sub}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Table Configuration Card */}
      <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 space-y-8 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h2 className="font-headline text-2xl italic text-on-surface">Configure Table Counts</h2>
            <p className="text-xs text-secondary font-body italic">Adjust the number of 2-seater and 4-seater tables in your restaurant.</p>
          </div>
          {totalTables === 0 && (
            <button
              onClick={async () => {
                await seedTables();
                toast.success("Tables seeded successfully");
                await load(selectedDate);
              }}
              disabled={loading}
              className="bg-gold-gradient px-6 py-3 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[9px] font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              Seed Default Tables
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 2-Seater Control */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Armchair className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-outline">2-Seater Tables</p>
                <p className="font-headline text-2xl italic text-on-surface">{twoCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setTwoCount(Math.max(0, twoCount - 1))}
                className="w-10 h-10 rounded-lg border border-outline-variant/20 flex items-center justify-center text-secondary hover:text-on-surface hover:border-outline-variant/40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={0}
                value={twoCount}
                onChange={(e) => setTwoCount(Math.max(0, Number(e.target.value)))}
                className="flex-1 text-center py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg font-headline text-xl italic text-on-surface focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={() => setTwoCount(twoCount + 1)}
                className="w-10 h-10 rounded-lg border border-outline-variant/20 flex items-center justify-center text-secondary hover:text-on-surface hover:border-outline-variant/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 4-Seater Control */}
          <div className="bg-surface-container-low rounded-xl p-6 border border-outline-variant/10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <div>
                <p className="text-[9px] uppercase tracking-widest font-bold text-outline">4-Seater Tables</p>
                <p className="font-headline text-2xl italic text-on-surface">{fourCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setFourCount(Math.max(0, fourCount - 1))}
                className="w-10 h-10 rounded-lg border border-outline-variant/20 flex items-center justify-center text-secondary hover:text-on-surface hover:border-outline-variant/40 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                min={0}
                value={fourCount}
                onChange={(e) => setFourCount(Math.max(0, Number(e.target.value)))}
                className="flex-1 text-center py-2.5 bg-surface-container-lowest border border-outline-variant/20 rounded-lg font-headline text-xl italic text-on-surface focus:outline-none focus:border-primary/40"
              />
              <button
                onClick={() => setFourCount(fourCount + 1)}
                className="w-10 h-10 rounded-lg border border-outline-variant/20 flex items-center justify-center text-secondary hover:text-on-surface hover:border-outline-variant/40 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Apply Button */}
          <div className="flex items-end">
            <button
              onClick={async () => {
                try {
                  await updateTableConfig(twoCount, fourCount);
                  toast.success("Table configuration updated");
                  await load(selectedDate);
                } catch (err: any) {
                  toast.error(err?.message || "Failed to update");
                }
              }}
              disabled={loading}
              className="w-full bg-gold-gradient py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[9px] font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50"
            >
              Apply Configuration
            </button>
          </div>
        </div>
      </div>

      {/* Table Grid */}
      <div className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="font-headline text-2xl italic text-on-surface">Table Floor Plan</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <input 
                 type="date"
                 value={selectedDate}
                 onChange={(e) => setSelectedDate(e.target.value)}
                 className="bg-surface-container-lowest border border-outline-variant/40 rounded-lg px-4 py-2 font-body text-sm text-on-surface outline-none focus:border-primary transition-colors cursor-pointer"
              />
              <button
                onClick={async () => {
                  await load(selectedDate);
                  await fetchBookingsForDate(selectedDate);
                }}
                disabled={isFetchingBookings}
                className="bg-gold-gradient px-4 py-2 rounded-lg text-on-primary font-label tracking-[0.1em] uppercase text-[9px] font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2"
              >
                {isFetchingBookings ? (
                  <Armchair className="w-3 h-3 animate-spin" />
                ) : (
                  "Show Results"
                )}
              </button>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                <span className="font-label text-[9px] uppercase tracking-widest text-outline font-bold">Locked</span>
              </div>
            </div>
          </div>
        </div>

        {tables.length === 0 ? (
          <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-16 text-center">
            <p className="font-headline text-xl italic text-outline/40">No tables configured yet.</p>
            <p className="text-xs text-outline font-body italic mt-2">Use "Seed Default Tables" or configure counts above.</p>
          </div>
        ) : (
          <>
            {/* 2-Seaters Section */}
            {twoSeaters.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-widest font-bold text-outline">2-Seater Tables</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {twoSeaters.map((table) => (
                    <TableCard
                      key={table._id}
                      table={table}
                      isBooked={bookedTableIds.has(table._id)}
                      onToggle={() => handleToggleTable(table, bookedTableIds.has(table._id))}
                      onDelete={async () => {
                        if (confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) {
                          try {
                            await deleteTable(table._id);
                            toast.success("Table deleted");
                            await load(selectedDate);
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }
                      }}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* 4-Seaters Section */}
            {fourSeaters.length > 0 && (
              <div className="space-y-3">
                <p className="text-[9px] uppercase tracking-widest font-bold text-outline">4-Seater Tables</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {fourSeaters.map((table) => (
                    <TableCard
                      key={table._id}
                      table={table}
                      isBooked={bookedTableIds.has(table._id)}
                      onToggle={() => handleToggleTable(table, bookedTableIds.has(table._id))}
                      onDelete={async () => {
                        if (confirm(`Are you sure you want to delete Table ${table.tableNumber}?`)) {
                          try {
                            await deleteTable(table._id);
                            toast.success("Table deleted");
                            await load(selectedDate);
                          } catch (err: any) {
                            toast.error(err.message);
                          }
                        }
                      }}
                      disabled={loading}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Unlock Confirmation Dialog */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <AlertDialogContent className="sm:max-w-[420px] bg-surface-container-lowest border-outline-variant/20">
          <AlertDialogHeader className="flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-primary" strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
              <AlertDialogTitle className="font-headline text-2xl italic text-on-surface text-center">
                Table {tableToUnlock?.tableNumber} is Currently Booked
              </AlertDialogTitle>
              <AlertDialogDescription className="font-body text-sm text-secondary italic leading-relaxed text-center">
                Please the table is booked, if you are doing unlock then there must be two condition 
                either the duration end and either you want to unlock that table own your concersn 
                and then I acceptthat is that
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center gap-3 mt-4">
            <AlertDialogCancel className="px-6 py-2.5 rounded-lg border border-outline-variant text-[9px] uppercase tracking-widest font-bold text-outline hover:bg-surface-container-low transition-colors">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={performUnlockBookedTable}
              className="px-6 py-2.5 rounded-lg bg-gold-gradient text-on-primary text-[9px] uppercase tracking-widest font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all"
            >
              I Accept & Unlock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TableCard({ table, isBooked, onToggle, onDelete, disabled }: { table: Table; isBooked?: boolean; onToggle: () => void; onDelete: () => void; disabled: boolean }) {
  const statusColors = !table.isAvailable 
    ? "bg-red-50/50 border-red-200/50" 
    : isBooked 
      ? "bg-primary/5 border-primary/20" 
      : "bg-surface-container-lowest border-emerald-200/50";
      
  const barColor = !table.isAvailable ? "bg-red-400" : isBooked ? "bg-primary" : "bg-emerald-400";
  const iconBg = !table.isAvailable ? "bg-red-100" : isBooked ? "bg-primary/20" : "bg-emerald-100";
  const labelColor = !table.isAvailable ? "text-red-500" : isBooked ? "text-primary" : "text-emerald-600";
  const labelText = !table.isAvailable ? "Locked" : isBooked ? "Booked" : "Available";

  return (
    <div
      className={cn(
        "rounded-xl p-5 border transition-all duration-300 hover:shadow-md group relative overflow-hidden",
        statusColors
      )}
    >
      {/* Delete Button - hidden by default, visible on hover */}
      <button
        onClick={onDelete}
        disabled={disabled}
        className="absolute top-3 right-3 p-2 text-outline-variant hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all duration-300 z-10"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Status indicator */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-1",
        barColor
      )} />

      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between pr-8">
          <span className="font-headline text-2xl italic text-on-surface">T-{table.tableNumber}</span>
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center",
            iconBg
          )}>
            {!table.isAvailable ? (
              <Lock className="w-3.5 h-3.5 text-red-500" strokeWidth={2} />
            ) : isBooked ? (
              <Users className="w-3.5 h-3.5 text-primary" strokeWidth={2} />
            ) : (
              <Unlock className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-[9px] uppercase tracking-widest font-bold text-outline">
            {table.capacity}-Seater
          </p>
          <p className={cn(
            "text-[9px] uppercase tracking-widest font-bold",
            labelColor
          )}>
            {labelText}
          </p>
        </div>

        <button
          onClick={onToggle}
          disabled={disabled}
          className={cn(
            "w-full py-2 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border disabled:opacity-50 disabled:cursor-not-allowed",
            !table.isAvailable
              ? "border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 bg-transparent"
              : isBooked
                ? "border-primary/40 text-primary hover:bg-primary/5 hover:border-primary/60 bg-transparent"
                : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300 bg-transparent"
          )}
        >
          {!table.isAvailable ? "Unlock Table" : isBooked ? "Unlock (Booked)" : "Lock Table"}
        </button>
      </div>
    </div>
  );
}
