"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin, SlotLockItem } from "@/hooks/useAdmin";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { cn } from "@/lib/utils";
import { Lock, Unlock, Calendar, Clock, FileText, Plus, Trash2 } from "lucide-react";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const TIME_SLOTS = ["18:00", "19:00", "20:00", "21:00"];

export default function AdminLocksPage() {
  const { getSlotLocks, setSlotLock, loading } = useAdmin();
  const [locks, setLocks] = useState<SlotLockItem[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  // Lock form state
  const [lockDate, setLockDate] = useState("");
  const [lockTime, setLockTime] = useState(TIME_SLOTS[0]);
  const [lockReason, setLockReason] = useState("Blocked until admin unlocks");

  const load = useCallback(async () => {
    setPageLoading(true);
    try {
      const data = await getSlotLocks();
      setLocks(data);
    } catch {
      setLocks([]);
    } finally {
      setPageLoading(false);
    }
  }, [getSlotLocks]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lockDate) {
      toast.error("Please select a date");
      return;
    }
    try {
      await setSlotLock(lockDate, lockTime, true, lockReason);
      toast.success("Slot locked successfully");
      setLockDate("");
      setLockReason("Blocked until admin unlocks");
      await load();
    } catch {
      toast.error("Failed to lock slot");
    }
  };

  const handleUnlock = async (lock: SlotLockItem) => {
    try {
      const dateStr = new Date(lock.bookingDate).toISOString().slice(0, 10);
      await setSlotLock(dateStr, lock.bookingTime, false);
      toast.success("Slot unlocked");
      await load();
    } catch {
      toast.error("Failed to unlock slot");
    }
  };

  if (pageLoading) return <LoadingSpinner />;

  return (
    <div className="p-6 md:p-10 space-y-10 min-h-screen">

      {/* Page Header */}
      <div className="space-y-2">
        <span className="font-label text-[9px] tracking-[0.3em] uppercase text-primary font-bold block">
          Administration
        </span>
        <h1 className="font-headline text-4xl md:text-5xl italic text-on-surface">
          Slot Lock Management
        </h1>
        <p className="text-sm text-secondary font-body font-light italic">
          Block specific time slots to prevent bookings. When a booking is made, the slot is automatically blocked for that day.
          Only admins can manually lock and unlock slots with a reason note.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Lock Form */}
        <div className="lg:col-span-1">
          <form onSubmit={handleLock} className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-8 space-y-6 shadow-sm sticky top-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Plus className="w-5 h-5 text-primary" strokeWidth={1.5} />
              </div>
              <h2 className="font-headline text-xl italic text-on-surface">Lock a Slot</h2>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline flex items-center gap-1.5">
                  <Calendar className="w-3 h-3" /> Date
                </label>
                <input
                  type="date"
                  value={lockDate}
                  onChange={(e) => setLockDate(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg font-body text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline flex items-center gap-1.5">
                  <Clock className="w-3 h-3" /> Time Slot
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setLockTime(slot)}
                      className={cn(
                        "py-2.5 rounded-lg text-[9px] uppercase tracking-widest font-bold transition-all duration-300 border",
                        lockTime === slot
                          ? "bg-on-surface text-surface border-on-surface"
                          : "bg-surface-container-low text-secondary border-outline-variant/20 hover:border-outline-variant/40"
                      )}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] uppercase tracking-widest font-bold text-outline flex items-center gap-1.5">
                  <FileText className="w-3 h-3" /> Reason / Note
                </label>
                <textarea
                  value={lockReason}
                  onChange={(e) => setLockReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/20 rounded-lg font-body text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-colors resize-none"
                  placeholder="Reason for locking this slot..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gold-gradient py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[9px] font-bold shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" strokeWidth={2} />
              Lock This Slot
            </button>
          </form>
        </div>

        {/* Active Locks List */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-headline text-2xl italic text-on-surface">Active Locks</h2>
            <span className="px-3 py-1 rounded-full bg-surface-container border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-outline">
              {locks.length} active
            </span>
          </div>

          {locks.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-16 text-center">
              <Unlock className="w-12 h-12 text-outline/20 mx-auto mb-4" strokeWidth={1} />
              <p className="font-headline text-xl italic text-outline/40">No active slot locks.</p>
              <p className="text-xs text-outline font-body italic mt-2">All time slots are currently open for booking.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {locks.map((lock) => (
                <div
                  key={lock._id}
                  className="bg-surface-container-lowest rounded-xl border border-outline-variant/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center shrink-0">
                      <Lock className="w-4 h-4 text-red-500" strokeWidth={2} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="font-headline text-lg italic text-on-surface">
                          {formatDate(lock.bookingDate)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-surface-container border border-outline-variant/20 text-[9px] uppercase tracking-widest font-bold text-outline">
                          {lock.bookingTime}
                        </span>
                      </div>
                      {lock.reason && (
                        <p className="text-xs text-secondary font-body italic">
                          "{lock.reason}"
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleUnlock(lock)}
                    disabled={loading}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-emerald-200 text-emerald-600 text-[9px] uppercase tracking-widest font-bold hover:bg-emerald-50 transition-colors disabled:opacity-50 shrink-0"
                  >
                    <Unlock className="w-3 h-3" strokeWidth={2} />
                    Unlock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
