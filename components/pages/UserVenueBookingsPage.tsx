"use client";

import { useCallback, useEffect, useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { CalendarDays, Loader2, Info, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const VENUE_IMAGE = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=1200";

export default function UserVenueBookingsPage() {
  const { getMyBookings } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Pass 'private_event' as the type
      const data = await getMyBookings(page, status, "private_event");
      setBookings(data.bookings);
      setTotalPages(data.totalPages);
    } catch {
      setBookings([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [getMyBookings, page, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 space-y-16 md:space-y-24">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center gap-3">
          <Star className="w-4 h-4 text-primary" fill="currentColor" />
          <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Elite Experiences</span>
        </div>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter text-on-surface leading-[0.9] lg:leading-[0.85]">
          Your Private <br className="hidden md:block" /> Sanctuary.
        </h2>
        <p className="text-base md:text-lg text-secondary leading-relaxed font-body font-light max-w-sm italic pt-2 md:pt-4">
          A history of your exclusive venue buyouts. Revisit the moments when Tropica was yours alone.
        </p>
      </header>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-8 border-b border-outline-variant/10 pb-8">
        {["all", "confirmed", "cancelled"].map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1); }}
            className={cn(
              "text-[9px] uppercase tracking-[0.3em] font-bold transition-all duration-500 relative py-2",
              status === s ? "text-primary" : "text-outline hover:text-on-surface"
            )}
          >
            {s}
            {status === s && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gold-gradient" />
            )}
          </button>
        ))}
      </div>

      {bookings.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-8 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/20">
          <CalendarDays className="w-12 h-12 text-outline/20" strokeWidth={1} />
          <div className="text-center space-y-2">
            <p className="font-headline text-3xl italic text-secondary">No exclusive events yet.</p>
            <p className="text-sm text-outline font-body font-light italic">Your journey towards an exclusive buyout starts here.</p>
          </div>
          <Link href="/book-venue" className="bg-gold-gradient px-8 py-3 rounded-lg text-on-primary font-label tracking-widest uppercase text-[10px] font-bold">
            Reserve the Venue
          </Link>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant/10 bg-surface-container-lowest ambient-shadow">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/10">
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-outline">Date & Time</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-outline">Occasion</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-outline">Details</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-outline">Payment Status</th>
                  <th className="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-outline text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {bookings.map((booking) => {
                  const remainingAmt = booking.remainingAmount ?? 0;
                  const isUnpaid = remainingAmt > 0 && booking.remainingPaymentStatus !== "paid";

                  return (
                    <tr key={booking._id} className="hover:bg-surface-container-low/20 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-headline text-lg italic text-on-surface">
                          {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </p>
                        <p className="text-xs text-outline">{booking.bookingTime}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-on-surface capitalize">{booking.occasion}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-xs text-outline">{booking.partySize} Guests</p>
                        <p className="text-xs text-outline">{booking.durationHours} Hours</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <p className="text-xs text-on-surface"><span className="text-outline">Total:</span> ${booking.totalAmount?.toFixed(2)}</p>
                          <p className="text-xs text-primary"><span className="text-outline">Deposit Paid:</span> ${booking.depositAmount?.toFixed(2)}</p>
                          {remainingAmt > 0 && (
                            <p className={cn("text-xs font-semibold", isUnpaid ? "text-error" : "text-emerald-500")}>
                              <span className="text-outline">Remaining:</span> ${remainingAmt.toFixed(2)} ({booking.remainingPaymentStatus})
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        {isUnpaid ? (
                          <Link
                            href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                            className="inline-block bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-4 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-colors"
                          >
                            Pay Balance
                          </Link>
                        ) : (
                          <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">
                            {booking.status === 'cancelled' ? 'Cancelled' : 'Fully Paid'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {bookings.map((booking) => {
              const remainingAmt = booking.remainingAmount ?? 0;
              const isUnpaid = remainingAmt > 0 && booking.remainingPaymentStatus !== "paid";

              return (
                <div key={booking._id} className="p-5 rounded-xl border border-outline-variant/10 bg-surface-container-lowest ambient-shadow space-y-4">
                  <div className="flex justify-between items-start border-b border-outline-variant/5 pb-4">
                    <div>
                      <p className="font-headline text-xl italic text-on-surface">
                        {new Date(booking.bookingDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                      <p className="text-xs text-outline">{booking.bookingTime}</p>
                    </div>
                    {isUnpaid ? (
                      <Link
                        href={`/user/payment?is_balance=true&bookingId=${booking._id}`}
                        className="inline-block bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 px-3 py-2 rounded text-[10px] font-bold tracking-widest uppercase transition-colors text-center"
                      >
                        Pay Balance
                      </Link>
                    ) : (
                      <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500">
                        {booking.status === 'cancelled' ? 'Cancelled' : 'Fully Paid'}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Occasion</p>
                      <p className="text-on-surface capitalize">{booking.occasion}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-1">Details</p>
                      <p className="text-on-surface text-xs">{booking.partySize} Guests</p>
                      <p className="text-on-surface text-xs">{booking.durationHours} Hours</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-outline-variant/5 space-y-1">
                    <p className="text-[10px] uppercase tracking-widest font-bold text-outline mb-2">Payment</p>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-outline">Total:</span>
                      <span className="text-on-surface font-semibold">${booking.totalAmount?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-outline">Deposit Paid:</span>
                      <span className="text-primary font-semibold">${booking.depositAmount?.toFixed(2)}</span>
                    </div>
                    {remainingAmt > 0 && (
                      <div className="flex justify-between items-center text-xs mt-1">
                        <span className="text-outline">Remaining ({booking.remainingPaymentStatus}):</span>
                        <span className={cn("font-bold", isUnpaid ? "text-error" : "text-emerald-500")}>
                          ${remainingAmt.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-12 pt-24 border-t border-outline-variant/10">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline hover:text-primary disabled:opacity-20 transition-all group"
          >
            PREV
          </button>

          <div className="flex items-center gap-4">
            <span className="w-10 h-px bg-outline-variant" />
            <span className="font-headline text-2xl italic text-primary">{page} <span className="text-outline text-lg">/ {totalPages}</span></span>
            <span className="w-10 h-px bg-outline-variant" />
          </div>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline hover:text-primary disabled:opacity-20 transition-all group"
          >
            NEXT
          </button>
        </div>
      )}
    </div>
  );
}
