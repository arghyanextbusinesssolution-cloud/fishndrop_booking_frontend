"use client";

import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, UserCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import api from "@/lib/axios";

const OCCASION_IMAGES = {
  birthday: "https://images.unsplash.com/photo-1530103578275-2d12f3bcad51?auto=format&fit=crop&q=80&w=600",
  anniversary: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=600",
  graduation: "https://images.unsplash.com/photo-1523050853063-bd8012fec046?auto=format&fit=crop&q=80&w=600",
  other: "https://images.unsplash.com/photo-1550966841-3bc2ad03d04c?auto=format&fit=crop&q=80&w=600"
};

export default function UserDashboardPage() {
  const { user } = useAuthStore();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const { data } = await api.get("/bookings/my");
        if (data.success) {
          setBookings(data.bookings);
        }
      } catch (error) {
        console.error("Failed to fetch bookings", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  // Logic to determine "Upcoming" vs "Archive"
  const now = new Date();
  const sortedBookings = [...bookings].sort((a, b) => new Date(a.bookingDate).getTime() - new Date(b.bookingDate).getTime());
  
  const upcomingBooking = sortedBookings.find(b => 
    new Date(b.bookingDate) >= new Date(now.setHours(0,0,0,0)) && b.status === "confirmed"
  );
  
  const pastBookings = bookings.filter(b => b._id !== upcomingBooking?._id).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-12 lg:p-24 space-y-16 md:space-y-32">
      
      {/* Hero Greeting Section */}
      <header className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-7 space-y-8 lg:space-y-10">
          <div className="space-y-4">
            <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-primary block transition-all">Welcome back, {user?.name?.split(' ')[0] || "Guest"}</span>
            <h2 className="text-5xl md:text-6xl lg:text-8xl font-headline italic tracking-tighter text-on-surface leading-[0.9] lg:leading-[0.85]">
              A curated <br className="hidden md:block" /> evening <br className="hidden md:block" /> awaits you.
            </h2>
          </div>
          <p className="text-base md:text-lg text-secondary leading-relaxed font-body font-light max-w-md italic">
            {upcomingBooking 
              ? "Your table at the heart of Fishndrop is prepared. We have noted your preferences and special occasion."
              : "Every journey begins with a single selection. We look forward to your next visit to Fishndrop."}
          </p>
          <div className="flex flex-wrap items-center gap-8 md:gap-12 pt-4">
             <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-outline font-bold">Next Visit</p>
                <p className="font-headline text-2xl italic text-on-surface">
                  {upcomingBooking 
                    ? new Date(upcomingBooking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) 
                    : "None Scheduled"}
                </p>
             </div>
             <div className="space-y-1">
                <p className="text-[8px] uppercase tracking-widest text-outline font-bold">Concierge Status</p>
                <p className="font-headline text-2xl italic text-primary">Priority Gold</p>
             </div>
             <div className="pt-2">
                <Link href="/book-table" className="text-[9px] uppercase tracking-[0.3em] font-bold text-primary border border-primary/20 px-6 py-3 rounded-full hover:bg-primary hover:text-white transition-all">
                   Book a journey
                </Link>
             </div>
          </div>
        </div>

        {/* Hero Image with Wall Frame Motif */}
        <div className="lg:col-span-5 relative group">
          <div className="bg-surface-container-lowest p-3 rounded-xl ambient-shadow">
            <div className="aspect-[4/5] overflow-hidden rounded-lg relative">
              <img 
                src={upcomingBooking ? (OCCASION_IMAGES[upcomingBooking.occasion as keyof typeof OCCASION_IMAGES] || OCCASION_IMAGES.other) : OCCASION_IMAGES.other} 
                alt="Dining interior" 
                className="w-full h-full object-cover grayscale opacity-80 transition-all duration-1000 group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-on-surface/40 to-transparent" />
              <div className="absolute bottom-6 left-6">
                <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-white/60 mb-1">Current Ambience</p>
                <p className="font-headline text-2xl italic text-white leading-none">The Salon Vert</p>
              </div>
            </div>
          </div>
          {/* Decorative Frame Elements */}
          <div className="absolute -top-6 -right-6 w-32 h-32 border-t border-r border-primary/20 pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-32 h-32 border-b border-l border-primary/20 pointer-events-none" />
        </div>
      </header>

      {/* Cards Grid */}
      <section className="grid grid-cols-1 xl:grid-cols-12 gap-12">
        {/* Upcoming Reservation Card */}
        <div className="xl:col-span-8 bg-surface-container-lowest p-10 md:p-16 rounded-xl ambient-shadow flex flex-col justify-between min-h-[480px]">
          <div className="flex justify-between items-start mb-16">
            <div className="space-y-2">
              <h3 className="font-headline text-4xl italic text-on-surface">
                {upcomingBooking ? "Upcoming Journey" : "Begin a New Journey"}
              </h3>
              <p className="text-[10px] uppercase tracking-[0.3em] text-secondary font-bold">FISHNDROP SANCTUARY</p>
            </div>
            {upcomingBooking && (
              <div className="flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-full border border-primary/10">
                 <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                 <span className="text-[9px] uppercase tracking-widest font-bold text-primary uppercase">{upcomingBooking.status}</span>
              </div>
            )}
          </div>

          {upcomingBooking ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
              {[
                { label: "Arrival Date", value: new Date(upcomingBooking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
                { label: "The Moment", value: upcomingBooking.bookingTime },
                { label: "The Ensemble", value: `${upcomingBooking.partySize.toString().padStart(2, '0')} Persons` },
                { label: "The Sanctuary", value: upcomingBooking.tables?.[0]?.tableNumber ? `Table ${upcomingBooking.tables[0].tableNumber}` : "Salon" }
              ].map(item => (
                <div key={item.label} className="space-y-4">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-outline">{item.label}</p>
                  <p className="font-headline text-3xl italic text-on-surface leading-tight">{item.value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-outline-variant/20 rounded-xl space-y-8">
              <CalendarDays className="w-12 h-12 text-outline/20" strokeWidth={1} />
              <div className="space-y-2 text-center">
                 <p className="font-headline text-2xl italic text-secondary">No reservations currently scheduled.</p>
                 <p className="text-xs text-outline font-body font-light italic">Fishndrop awaits your presence.</p>
              </div>
              <Link href="/book-table" className="bg-gold-gradient px-10 py-3 rounded-lg text-on-primary font-label tracking-widest uppercase text-[10px] font-bold shadow-xl shadow-primary/10 hover:scale-[1.05] transition-all">
                Secure your table
              </Link>
            </div>
          )}

          <div className="mt-20 pt-12 border-t border-outline-variant/10 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <div className="w-10 h-10 rounded-full border-4 border-surface-container-lowest bg-surface-container-high overflow-hidden">
                  <UserCircle className="w-full h-full text-outline-variant" strokeWidth={1} />
                </div>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-bold text-secondary">
                {upcomingBooking ? upcomingBooking.customerName : user?.name}
              </span>
            </div>
            <Link href="/user/bookings" className="bg-gold-gradient px-12 py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[10px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all">
              Manage Details
            </Link>
          </div>
        </div>

        {/* Dining Profile Side Card */}
        <div className="xl:col-span-4 bg-surface-container-low p-10 rounded-xl flex flex-col h-full">
          <div className="mb-12">
            <h3 className="font-headline text-3xl italic mb-4 text-on-surface">Dining Profile</h3>
            <p className="text-sm text-secondary leading-relaxed font-body font-light italic">
              Your preferences are the blueprint of your experience.
            </p>
          </div>
          
          <div className="space-y-6 flex-grow">
            {[
              { label: "Private Preferences", href: "/user/preferences" },
              { label: "Dietary Sensitivities", href: "/user/preferences" },
              { label: "The Wine Cellar", href: "/user/preferences" }
            ].map(item => (
              <Link key={item.label} href={item.href} className="p-6 bg-surface-container-lowest rounded-lg group cursor-pointer hover:ambient-shadow transition-all duration-500 flex justify-between items-center">
                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface group-hover:text-primary transition-colors">{item.label}</span>
                <ChevronRight className="w-4 h-4 text-outline/30 group-hover:text-primary transition-colors" strokeWidth={1} />
              </Link>
            ))}
          </div>

          <div className="pt-12">
             <div className="p-6 bg-primary/5 rounded-lg border border-primary/10">
                <p className="text-[9px] uppercase tracking-widest text-primary font-bold mb-2">Concierge Tip</p>
                <p className="text-xs text-secondary italic font-light">"The 1995 Bordeaux has been decanted in anticipation of your arrival."</p>
             </div>
          </div>
        </div>
      </section>

      {/* Past Journeys Section */}
      <section className="space-y-16">
        <div className="flex justify-between items-end border-b border-outline-variant/10 pb-8">
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary">The Archive</span>
            <h2 className="font-headline text-5xl italic text-on-surface">Past Journeys</h2>
          </div>
          <Link href="/user/bookings" className="flex items-center gap-3 text-[10px] uppercase tracking-[0.3em] font-bold text-outline hover:text-on-surface transition-colors group">
            View Archive <div className="w-10 h-px bg-outline group-hover:w-14 group-hover:bg-primary transition-all" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {pastBookings.length > 0 ? (
            pastBookings.map(journey => (
              <div key={journey._id} className="group cursor-pointer space-y-8">
                <div className="bg-surface-container-lowest p-2 rounded-xl ambient-shadow ring-1 ring-outline-variant/10">
                  <div className="aspect-[16/10] rounded-lg overflow-hidden relative">
                    <img 
                      src={OCCASION_IMAGES[journey.occasion as keyof typeof OCCASION_IMAGES] || OCCASION_IMAGES.other} 
                      alt={journey.occasion} 
                      className="w-full h-full object-cover grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[9px] uppercase tracking-widest font-bold text-primary opacity-60 uppercase">{journey.occasion}</p>
                  <h4 className="font-headline text-3xl italic text-on-surface leading-tight transition-colors group-hover:text-primary">
                    Journey of {new Date(journey.bookingDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  </h4>
                  <p className="text-[10px] uppercase tracking-widest text-outline font-bold">
                    {new Date(journey.bookingDate).toLocaleDateString()} • Table {journey.tables?.[0]?.tableNumber || "Salon"}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-3 py-20 text-center">
              <p className="font-headline text-xl italic text-outline/40">The archive is currently empty.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
