"use client";

import { motion } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Calendar, Clock, Users, Utensils, Info, ArrowRight, CalendarDays } from "lucide-react";
import Link from "next/link";

export default function ConfirmedPage() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <NavBar />
      
      <main className="flex-grow pt-32 pb-24 px-6 md:px-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <header className="text-center mb-20 max-w-3xl mx-auto space-y-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-headline tracking-tight text-on-surface"
          >
            A <span className="font-headline italic">Curated</span> Evening Awaits
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-lg md:text-xl font-body text-secondary leading-relaxed font-light"
          >
            Your table at the heart of Fishndrop is prepared. A confirmation email with your concierge details has been sent.
          </motion.p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Reservation Summary */}
          <section className="lg:col-span-5 space-y-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="bg-surface-container-low p-8 md:p-12 border border-outline-variant/20 rounded-xl shadow-sm relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 p-4">
                <div className="w-12 h-12 bg-primary/5 rounded-full flex items-center justify-center">
                  <span className="text-primary text-2xl">✓</span>
                </div>
              </div>
              <h2 className="text-[10px] uppercase tracking-[0.2em] text-secondary font-bold mb-10">Reservation Summary</h2>
              
              <div className="space-y-10">
                <div className="flex items-start space-x-6">
                  <Calendar className="text-primary-container w-6 h-6 mt-1" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Date</p>
                    <p className="text-2xl font-headline italic">Saturday, December 14th</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <Clock className="text-primary-container w-6 h-6 mt-1" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Time</p>
                    <p className="text-2xl font-headline italic">19:30</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <Users className="text-primary-container w-6 h-6 mt-1" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Party</p>
                    <p className="text-2xl font-headline italic">4 Guests</p>
                  </div>
                </div>
                <div className="flex items-start space-x-6">
                  <Utensils className="text-primary-container w-6 h-6 mt-1" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mb-1">Table</p>
                    <p className="text-2xl font-headline italic">The Garden Alcove</p>
                  </div>
                </div>
              </div>

              <div className="mt-16 pt-8 border-t border-outline-variant/30 flex flex-col sm:flex-row gap-4">
                <button className="bg-gold-gradient text-on-primary px-8 py-4 rounded-lg text-[10px] uppercase tracking-[0.15em] font-bold shadow-lg shadow-primary/10 hover:scale-[0.98] transition-transform duration-500 flex items-center justify-center space-x-2">
                  <CalendarDays className="w-4 h-4" />
                  <span>Add to Calendar</span>
                </button>
                <button className="bg-transparent border border-outline-variant/40 hover:border-outline-variant text-on-surface px-8 py-4 rounded-lg text-[10px] uppercase tracking-[0.15em] font-bold transition-colors">
                  Manage Booking
                </button>
              </div>
            </motion.div>

            <div className="p-8 border border-outline-variant/10 rounded-xl flex items-center space-x-4 bg-surface-container-lowest">
              <Info className="text-primary w-5 h-5 flex-shrink-0" />
              <p className="text-xs text-secondary leading-relaxed font-light italic">
                Arriving late? Please contact our concierge at <span className="text-on-surface font-semibold underline underline-offset-4 font-normal">+33 1 45 67 89 00</span>. We hold tables for 20 minutes.
              </p>
            </div>
          </section>

          {/* Experience Section */}
          <section className="lg:col-span-7 space-y-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8, duration: 1 }}
              className="relative aspect-[4/5] md:aspect-[16/11] rounded-xl overflow-hidden shadow-2xl border-[12px] border-surface-container-lowest"
            >
              <img 
                className="w-full h-full object-cover grayscale-[30%]" 
                alt="Ambiance" 
                src="https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=1200"
              />
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="absolute bottom-8 left-8 right-8 text-white">
                <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-2 drop-shadow-md">Fishndrop</p>
                <h3 className="text-3xl font-headline italic drop-shadow-lg">A sanctuary of taste</h3>
              </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-surface-container-low p-8 rounded-xl space-y-4">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                  <Utensils className="text-primary w-5 h-5" />
                </div>
                <h4 className="font-headline text-xl">The Tasting Menu</h4>
                <p className="text-sm text-secondary leading-relaxed font-light italic">
                  Prepare for a twelve-course journey curated by Chef Julien. Each dish celebrates seasonal harvest through a lens of avant-garde French technique.
                </p>
              </div>
              <div className="bg-surface-container-low p-8 rounded-xl space-y-4">
                <div className="w-10 h-10 bg-primary/5 rounded-full flex items-center justify-center">
                  <Info className="text-primary w-5 h-5" />
                </div>
                <h4 className="font-headline text-xl">Vintage Krug Pairings</h4>
                <p className="text-sm text-secondary leading-relaxed font-light italic">
                  Your reservation includes a consultation with our Head Sommelier to explore rare vintages of Krug and bespoke vineyard selections.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <Link 
                href="/user" 
                className="group flex items-center space-x-4 text-on-surface hover:text-primary transition-colors font-bold"
              >
                <span className="text-[10px] uppercase tracking-[0.2em]">Return to Dashboard</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform duration-300" />
              </Link>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
