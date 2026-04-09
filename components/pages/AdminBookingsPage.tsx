"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAdmin } from "@/hooks/useAdmin";
import { Booking } from "@/types";
import { AllBookingsTable } from "@/components/admin/AllBookingsTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function AdminBookingsPage() {
  const { getAllBookings, adminCancelBooking } = useAdmin();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllBookings(page, status);
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getAllBookings, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingSpinner />;
  return (
    <div className="space-y-4">
      <div className="flex gap-2">{["all", "confirmed", "cancelled"].map((s) => <button key={s} onClick={() => { setStatus(s); setPage(1); }} className={`rounded-md px-3 py-2 ${status === s ? "bg-[var(--accent)] text-black" : "bg-[var(--surface)]"}`}>{s}</button>)}</div>
      <AllBookingsTable bookings={bookings} onCancel={async (id) => { if (!window.confirm("Cancel booking?")) return; await adminCancelBooking(id); toast.success("Booking cancelled"); await load(); }} />
      <div className="flex items-center justify-center gap-2"><button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="rounded bg-[var(--surface)] px-3 py-1">Prev</button><span>{page}/{totalPages}</span><button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="rounded bg-[var(--surface)] px-3 py-1">Next</button></div>
    </div>
  );
}
