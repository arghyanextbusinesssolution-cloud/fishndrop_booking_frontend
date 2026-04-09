"use client";

import { Booking } from "@/types";

export function BookingTable({ bookings }: { bookings: Booking[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
      <table className="w-full text-left text-sm">
        <thead className="bg-[var(--surface-2)]">
          <tr><th className="p-3">Customer</th><th className="p-3">Party</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking._id} className="border-t border-[var(--border)]">
              <td className="p-3">{booking.user.name}</td>
              <td className="p-3">{booking.partySize}</td>
              <td className="p-3">${booking.totalAmount}</td>
              <td className="p-3">{booking.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
