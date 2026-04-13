"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Calendar } from "@/components/booking/Calendar";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { ChevronRight, Users, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    // Artificial delay to show the beautiful loading experience 
    // and check backend health
    const checkBackend = async () => {
      try {
        const startTime = Date.now();
        // Use port 5002 where our verified backend is running
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
        await fetch(`${apiBase}/health`);
        const elapsed = Date.now() - startTime;
        const minTime = 3000; // 3 seconds min to show animation

        setTimeout(() => {
          setIsLoading(false);
        }, Math.max(0, minTime - elapsed));
      } catch (error) {
        console.error("Backend health check failed:", error);
        // Fallback: stop loading after 4s anyway
        setTimeout(() => setIsLoading(false), 4000);
      }
    };

    void checkBackend();
  }, []);


  const MIN_GUESTS = 2;
  const MAX_GUESTS = 8;

  const getTableNote = (guests: number): string => {
    if (guests === 2) return "One intimate 2-seater table";
    if (guests === 3 || guests === 4) return "One 4-seater table";
    if (guests === 5 || guests === 6) return "One 4-seater + one 2-seater";
    if (guests === 7 || guests === 8) return "Two premium 4-seater tables";
    return "";
  };

  const handleDateSelect = (date: Date) => {
    try {
      setIsNavigating(true);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;
      router.push(`/book-table?date=${dateString}`);
    } catch (e) {
      console.error("Date selection error:", e);
      setIsNavigating(false);
    }
  };

  return (
    <>
      <LoadingScreen isLoading={isLoading} />

      <div className={cn(
        "min-h-screen flex flex-col transition-opacity duration-1000",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        <NavBar />

        <main className="flex-grow pt-32 pb-20 px-6 md:px-12 flex flex-col items-center">
          {/* Editorial Header */}
          <header className="max-w-4xl w-full text-center mb-16 space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-headline italic tracking-tighter text-on-surface">
                01. <span className="text-gold-gradient">Fishndrop Arrivals</span>
              </h1>
              <p className="text-secondary font-body tracking-[0.15em] uppercase text-xs">
                A curated journey begins with a moment in time.
              </p>
            </div>
          </header>

          {/* Wall Frame Layout */}
          <section className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Context Side */}
            <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
              {/* Ambiance Card */}
              <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/20 relative overflow-hidden group">
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:scale-105 transition-transform duration-1000"
                  alt="Luxury dining ambiance"
                  src="https://images.unsplash.com/photo-1414235077428-338988692286?auto=format&fit=crop&q=80&w=800"
                />
                <div className="relative z-10">
                  <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-4 block">
                    Availability Notes
                  </span>
                  <h3 className="font-headline text-2xl italic mb-4">Limited Seating</h3>
                  <p className="text-sm text-secondary leading-relaxed font-light font-body">
                    Our tables are arranged to provide intimate seclusion. For parties
                    larger than four, please contact our concierge directly.
                  </p>
                </div>
              </div>

              {/* Legend */}
              <div className="space-y-4 px-2">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 ring-2 ring-primary/30 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium font-body">
                    Today
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary-container shadow-md ring-4 ring-primary-container/10" />
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium font-body">
                    Selected Date
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full border border-outline-variant/20 flex items-center justify-center">
                    <span className="text-outline/20 text-xs italic">00</span>
                  </div>
                  <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium font-body">
                    Past / Unavailable
                  </span>
                </div>
              </div>
            </div>

            {/* Main Calendar Canvas */}
            <div className="lg:col-span-8 bg-surface-container-lowest p-8 md:p-12 rounded-xl ambient-shadow border border-outline-variant/10 order-1 lg:order-2 relative min-h-[500px]">
              {isNavigating ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm z-20 transition-all duration-500 animate-in fade-in">
                  <div className="w-16 h-16 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                  <p className="mt-6 font-headline text-2xl italic text-on-surface animate-pulse">
                    Preparing your journey...
                  </p>
                </div>
              ) : (
                <Calendar selectedDate={selectedDate} onSelect={handleDateSelect} />
              ) }
            </div>
          </section>
        </main>

        <Footer />
      </div>
    </>
  );
}

