"use client";

import { useMemo, useState } from "react";
import { Booking } from "@/types";
import { Button } from "@/components/ui/button";

interface Props {
  bookings: Booking[];
  onCancel: (id: string) => Promise<void>;
}

export function AllBookingsTable({ bookings, onCancel }: Props) {
  const [query, setQuery] = useState("");
  const rows = useMemo(
    () => bookings.filter((b) => b.user.name.toLowerCase().includes(query.toLowerCase())),
    [bookings, query]
  );
  return (
    <div className="space-y-3">
      <input className="w-full rounded-md border border-[var(--border)] bg-[var(--surface)] p-2" placeholder="Search customer name" value={query} onChange={(e) => setQuery(e.target.value)} />
      <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
        <table className="w-full text-sm">
          <thead className="bg-[var(--surface-2)]"><tr><th className="p-2">#</th><th className="p-2">Customer</th><th className="p-2">Email</th><th className="p-2">Party</th><th className="p-2">Tables</th><th className="p-2">Amount</th><th className="p-2">Drinks</th><th className="p-2">Booking</th><th className="p-2">Payment</th><th className="p-2">Actions</th></tr></thead>
          <tbody>
            {rows.map((b, i) => (
              <tr key={b._id} className="border-t border-[var(--border)]">
                <td className="p-2">{i + 1}</td><td className="p-2">{b.user.name}</td><td className="p-2">{b.user.email}</td><td className="p-2">{b.partySize}</td>
                <td className="p-2">{b.tables.map((t) => `#${t.tableNumber}`).join(", ")}</td><td className="p-2">${b.totalAmount}</td><td className="p-2">{b.complimentaryDrinks}</td><td className="p-2">{b.status}</td>
                <td className={`p-2 font-medium ${b.paymentStatus === "pending_payment" ? "text-amber-700" : "text-[var(--success)]"}`}>{b.paymentStatus === "pending_payment" ? "Unpaid" : "Paid"}</td>
                <td className="p-2">{b.status === "confirmed" && <Button onClick={() => void onCancel(b._id)} className="bg-red-500 hover:bg-red-600">Cancel</Button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
