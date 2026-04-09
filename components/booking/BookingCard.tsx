"use client";

import { format } from "date-fns";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Booking } from "@/types";
import { useBookings } from "@/hooks/useBookings";
import { Button } from "@/components/ui/button";

export function BookingCard({ booking, onUpdated }: { booking: Booking; onUpdated: () => void }) {
  const router = useRouter();
  const { cancelBooking, loading } = useBookings();
  const unpaid = booking.paymentStatus === "pending_payment";
  const payHref =
    booking.status === "confirmed" && unpaid
      ? `/user/payment?${new URLSearchParams({
          bookingId: booking._id,
          totalAmount: String(booking.totalAmount),
          partySize: String(booking.partySize),
          bookingDate: typeof booking.bookingDate === "string" ? booking.bookingDate.split("T")[0] : format(new Date(booking.bookingDate), "yyyy-MM-dd"),
          bookingTime: booking.bookingTime,
          customerName: booking.customerName,
          occasion: booking.occasion,
          cakePrice: String(booking.cakePrice ?? 0)
        }).toString()}`
      : null;
  const handleCancel = async () => {
    const confirmed = window.confirm("Cancel this booking?");
    if (!confirmed) return;
    try {
      await cancelBooking(booking._id);
      toast.success("Booking cancelled");
      onUpdated();
    } catch {}
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
      <div className="flex items-start justify-between">
        <h3 className="font-semibold">{format(new Date(booking.bookingDate), "PPP")}</h3>
        <div className="flex flex-col items-end gap-1">
          <span className={`rounded-full px-3 py-1 text-xs ${booking.status === "confirmed" ? "bg-green-500/20 text-[var(--success)]" : "bg-red-500/20 text-[var(--error)]"}`}>{booking.status}</span>
          <span className={`rounded-full px-3 py-1 text-xs ${unpaid ? "bg-amber-500/20 text-amber-800" : "bg-slate-500/15 text-[var(--text-secondary)]"}`}>
            {unpaid ? "Payment: due" : "Payment: paid"}
          </span>
        </div>
      </div>
      <p className="mt-3 text-sm text-[var(--text-secondary)]">Party Size: {booking.partySize}</p>
      <p className="text-sm text-[var(--text-secondary)]">Tables: {booking.tables.map((t) => `#${t.tableNumber} (${t.capacity})`).join(", ")}</p>
      <p className="text-sm text-[var(--text-secondary)]">Amount: ${booking.totalAmount} | Drinks: {booking.complimentaryDrinks}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {payHref ? (
          <Button type="button" className="bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]" onClick={() => router.push(payHref)}>
            Pay now
          </Button>
        ) : null}
        {booking.status === "confirmed" ? (
          <Button disabled={loading} onClick={handleCancel} variant="outline" className="border-red-400 text-red-600 hover:bg-red-500/10">
            Cancel
          </Button>
        ) : null}
      </div>
    </div>
  );
}
