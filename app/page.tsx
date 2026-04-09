"use client";

import { useRouter } from "next/navigation";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Calendar } from "@/components/booking/Calendar";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const router = useRouter();

  const handleDateSelect = (date: Date) => {
    try {
      const dateString = date.toISOString().split('T')[0];
      router.push(`/book-table?date=${dateString}`);
    } catch (e) {
      console.error("Date selection error:", e);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
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
          
          <div className="pt-4 flex justify-center">
            <button 
              onClick={() => {
                const calendar = document.querySelector('section');
                calendar?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-gold-gradient px-12 py-5 rounded-full text-on-primary font-label tracking-[0.3em] uppercase text-[11px] font-bold shadow-2xl shadow-primary/30 hover:scale-[1.05] hover:shadow-primary/40 transition-all active:scale-95 group"
            >
              Book a Reservation
              <ChevronRight className="inline-block ml-3 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </header>

        {/* Wall Frame Layout */}
        <section className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Context Side (Asymmetric Element) */}
          <div className="lg:col-span-4 space-y-12 order-2 lg:order-1">
            <div className="p-8 bg-surface-container-low rounded-xl border border-outline-variant/20 relative overflow-hidden group">
              <img 
                className="absolute inset-0 w-full h-full object-cover opacity-20 grayscale group-hover:scale-105 transition-transform duration-1000" 
                alt="Luxury dining ambiance"
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800"
              />
              <div className="relative z-10">
                <span className="text-[10px] uppercase tracking-widest font-bold text-primary mb-4 block">Availability Notes</span>
                <h3 className="font-headline text-2xl italic mb-4">Limited Seating</h3>
                <p className="text-sm text-secondary leading-relaxed font-light font-body">
                  Our tables are arranged to provide intimate seclusion. For parties larger than four, please contact our concierge directly.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-primary-container"></span>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium font-body">Selected Date</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                <span className="text-xs uppercase tracking-widest text-on-surface-variant font-medium font-body">Current Date</span>
              </div>
            </div>
          </div>

          {/* Main Calendar Canvas */}
          <div className="lg:col-span-8 bg-surface-container-lowest p-8 md:p-12 rounded-xl ambient-shadow border border-outline-variant/10 order-1 lg:order-2">
            <Calendar 
              selectedDate={null}
              onSelect={handleDateSelect}
            />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
