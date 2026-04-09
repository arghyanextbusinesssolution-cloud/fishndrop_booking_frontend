"use client";

import { useCallback, useEffect, useState } from "react";
import { useBookings } from "@/hooks/useBookings";
import { Booking } from "@/types";
import { CalendarDays, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

const OCCASION_IMAGES = {
  birthday: "https://images.unsplash.com/photo-1530103578275-2d12f3bcad51?auto=format&fit=crop&q=80&w=600",
  anniversary: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
  graduation: "https://images.unsplash.com/photo-1523050853063-bd8012fec046?auto=format&fit=crop&q=80&w=600",
  other: "https://images.unsplash.com/photo-1550966841-3bc2ad03d04c?auto=format&fit=crop&q=80&w=600"
};

export default function UserBookingsPage() {
  const { getMyBookings } = useBookings();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getMyBookings(page, status);
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
        <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block">Your Chronicle</span>
        <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter text-on-surface leading-[0.9] lg:leading-[0.85]">
          A record of <br className="hidden md:block" /> shared moments.
        </h2>
        <p className="text-base md:text-lg text-secondary leading-relaxed font-body font-light max-w-sm italic pt-2 md:pt-4">
          Fishndrop remembers every detail. Your past journeys and upcoming arrivals, curated in one archive.
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

      {/* Bookings Grid */}
      {bookings.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-8 bg-surface-container-low/30 rounded-2xl border border-dashed border-outline-variant/20">
            <CalendarDays className="w-12 h-12 text-outline/20" strokeWidth={1} />
            <div className="text-center space-y-2">
                <p className="font-headline text-3xl italic text-secondary">The archive is silent.</p>
                <p className="text-sm text-outline font-body font-light italic">No reservations match your current selection.</p>
            </div>
            <Link href="/book-table" className="bg-gold-gradient px-8 py-3 rounded-lg text-on-primary font-label tracking-widest uppercase text-[10px] font-bold">
               Secure a new journey
            </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {bookings.map((booking) => (
            <div key={booking._id} className="group space-y-8 relative">
              <div className="bg-surface-container-lowest p-2 rounded-xl ambient-shadow ring-1 ring-outline-variant/10 transition-transform duration-700 group-hover:scale-[1.02]">
                <div className="aspect-[16/10] rounded-lg overflow-hidden relative">
                  <img 
                    src={OCCASION_IMAGES[booking.occasion as keyof typeof OCCASION_IMAGES] || OCCASION_IMAGES.other} 
                    alt={booking.occasion} 
                    className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" 
                  />
                  <div className={cn(
                    "absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] uppercase tracking-widest font-bold border backdrop-blur-md",
                    booking.status === 'confirmed' ? "bg-primary/20 border-primary/30 text-primary" : "bg-error/10 border-error/20 text-error"
                  )}>
                    {booking.status}
                  </div>
                </div>
              </div>
              <div className="space-y-4 px-2">
                <div className="flex justify-between items-start">
                   <div className="space-y-1">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-primary opacity-60 uppercase">{booking.occasion}</p>
                      <h4 className="font-headline text-3xl italic text-on-surface leading-tight transition-colors group-hover:text-primary">
                        {new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </h4>
                   </div>
                   <div className="text-right">
                      <p className="text-[9px] uppercase tracking-widest font-bold text-outline">Sanctuary</p>
                      <p className="font-headline text-2xl italic text-on-surface">Table {booking.tables?.[0]?.tableNumber || "Salon"}</p>
                   </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-outline-variant/10">
                   <div>
                      <p className="text-[8px] uppercase tracking-widest text-outline font-bold">Ensemble</p>
                      <p className="text-sm font-body font-light text-on-surface italic">{booking.partySize} Guests</p>
                   </div>
                   <div>
                      <p className="text-[8px] uppercase tracking-widest text-outline font-bold">Moment</p>
                      <p className="text-sm font-body font-light text-on-surface italic">{booking.bookingTime}</p>
                   </div>
                </div>

                {/* Additional Details */}
                {(booking.complimentaryDrinks > 0 || booking.cakeDetails) && (
                   <div className="pt-4 flex items-center justify-between border-t border-outline-variant/10">
                      <div className="flex gap-2">
                         {booking.complimentaryDrinks > 0 && (
                            <span className="text-[8px] px-2 py-0.5 rounded bg-primary/5 text-primary font-bold uppercase tracking-widest border border-primary/10 transition-all hover:bg-primary hover:text-white pointer-events-none">
                               +{booking.complimentaryDrinks} Drinks
                            </span>
                         )}
                         {booking.cakeDetails && (
                            <span className="text-[8px] px-2 py-0.5 rounded bg-gold-gradient/10 text-primary font-bold uppercase tracking-widest border border-primary/10">
                               Cake Incl.
                            </span>
                         )}
                      </div>
                      <Info className="w-3 h-3 text-outline/30" />
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-12 pt-24 border-t border-outline-variant/10">
          <button 
            disabled={page === 1} 
            onClick={() => setPage((p) => p - 1)} 
            className="text-[10px] uppercase tracking-[0.4em] font-bold text-outline hover:text-primary disabled:opacity-20 transition-all group"
          >
             <span className="hidden md:inline">Précédent</span>
             <span className="md:hidden">PREV</span>
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
             <span className="hidden md:inline">Suivant</span>
             <span className="md:hidden">NEXT</span>
          </button>
        </div>
      )}
    </div>
  );
}
