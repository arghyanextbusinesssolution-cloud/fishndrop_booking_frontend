"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Calendar } from "@/components/booking/Calendar";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Hero } from "@/components/home/Hero";
import { Experience } from "@/components/home/Experience";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [hasAcceptedDisclaimer, setHasAcceptedDisclaimer] = useState(false);
  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const startTime = Date.now();
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
        await fetch(`${apiBase}/health`);
        const elapsed = Date.now() - startTime;
        const minTime = 3000;

        setTimeout(() => {
          setIsLoading(false);
        }, Math.max(0, minTime - elapsed));
      } catch (error) {
        console.error("Backend health check failed:", error);
        setTimeout(() => setIsLoading(false), 4000);
      }
    };

    void checkBackend();
  }, []);

  const handleInitialDateSelect = (date: Date) => {
    setSelectedDate(date);
    setPendingDate(date);
    setShowDisclaimer(true);
  };

  const proceedWithDate = () => {
    setShowDisclaimer(false);
    if (!pendingDate) return;

    setIsNavigating(true);

    setTimeout(() => {
      try {
        const year = pendingDate.getFullYear();
        const month = String(pendingDate.getMonth() + 1).padStart(2, '0');
        const day = String(pendingDate.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        router.push(`/book-table?date=${dateString}`);
      } catch (e) {
        console.error("Date selection error:", e);
        setIsNavigating(false);
      }
    }, 1500);
  };

  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface selection:bg-primary/30 selection:text-primary font-body overflow-x-hidden">
      <LoadingScreen isLoading={isLoading} />

      {/* Navigation Loader */}
      {isNavigating && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#0F3D2E]/80 backdrop-blur-md transition-all duration-500">
          <div className="flex flex-col items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full border-2 border-[#C8A96A]/10 border-t-[#C8A96A] animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#C8A96A] animate-pulse">sync_saved_locally</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <h2 className="font-headline text-3xl italic text-[#C8A96A] animate-pulse">Compiling Reservation...</h2>
              <p className="font-label text-[10px] uppercase tracking-[0.3em] text-[#C8A96A]/60">Checking seasonal availability</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0F3D2E]/90 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c1b] border border-[#C8A96A]/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in relative">
            <h3 className="font-headline italic text-2xl md:text-3xl text-[#C8A96A] mb-4">Terms & Conditions</h3>

            <div className="text-on-surface/80 font-body text-sm space-y-4 mb-6 h-64 overflow-y-auto pr-2 custom-scrollbar text-left">
              <p><strong>Allergen Disclaimer – Tropica Private Dining Private Space</strong></p>
              <p>At Tropica, we are committed to providing a safe dining experience. Our menu items—whether for dine-in or online orders—may contain or come into contact with allergens including, but not limited to: dairy, eggs, wheat, soy, nuts, peanuts, fish, and shellfish.</p>
              <p>If you have any allergies, please inform our staff prior to dining or note them when placing an online order. While we take great care, we cannot guarantee that any dish will be completely allergen-free, due to potential cross-contact.</p>
              <p>For online orders, please use the &ldquo;special instructions&rdquo; field to note allergies, or contact us directly before ordering.</p>
              <p>Guests with severe allergies should exercise their own discretion. We are always happy to answer questions about ingredients—just ask!</p>
              <p>Thank you for dining with Tropica and for your understanding.</p>
            </div>

            <label className="flex items-start gap-3 cursor-pointer group mb-8">
              <div className="relative flex items-center justify-center mt-1">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={hasAcceptedDisclaimer}
                  onChange={(e) => setHasAcceptedDisclaimer(e.target.checked)}
                />
                <div className="w-5 h-5 border-2 border-[#C8A96A]/50 rounded peer-checked:bg-[#C8A96A] peer-checked:border-[#C8A96A] transition-all flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-[#0F3D2E] opacity-0 peer-checked:opacity-100 transition-opacity">check</span>
                </div>
              </div>
              <span className="font-label text-xs uppercase tracking-widest text-[#C8A96A]/80 group-hover:text-[#C8A96A] transition-colors leading-relaxed text-left">
                I have read and agree to the allergen disclaimer and terms of condition
              </span>
            </label>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowDisclaimer(false);
                  setHasAcceptedDisclaimer(false);
                }}
                className="flex-1 py-3 font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] border border-[#C8A96A]/30 rounded-lg hover:bg-[#C8A96A]/10 transition-all font-bold"
              >
                Cancel
              </button>
              <button
                disabled={!hasAcceptedDisclaimer}
                onClick={proceedWithDate}
                className="flex-[2] py-3 font-label text-[10px] uppercase tracking-[0.2em] bg-[#C8A96A] text-[#0F3D2E] rounded-lg hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 disabled:cursor-not-allowed transition-all font-bold"
              >
                Accept & Continue
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={cn(
        "min-h-screen flex flex-col transition-opacity duration-1000",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        <NavBar />

        <main className="flex-grow pt-0">
          {/* Hero Section */}
          <Hero />

          {/* Experience Section */}
          <Experience />

          {/* Reservations Section */}
          <section id="reservations" className="py-16 md:py-24 px-4 md:px-12 bg-[#0F2D24]">
            <div className="max-w-4xl mx-auto flex flex-col items-center">
              <div className="text-center mb-12 md:mb-16">
                <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#C8A96A] font-bold">Reservation</span>
                <h2 className="font-headline text-3xl md:text-7xl text-on-surface mt-4 mb-6 tracking-tight italic leading-tight">When shall we expect you?</h2>
                <p className="font-body text-on-surface/60 text-[10px] md:text-base max-w-lg mx-auto leading-relaxed mb-8 md:mb-12 px-4">
                  Select a preferred date for your private garden experience.
                </p>
              </div>

              {/* Calendar Container */}
              <div className="w-full bg-[#1a1c1b] rounded-2xl border border-[#C8A96A]/10 p-4 md:p-12 shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
                  <span className="material-symbols-outlined text-[80px] md:text-[120px]">spa</span>
                </div>

                <Calendar selectedDate={selectedDate} onSelect={handleInitialDateSelect} />

                {/* Calendar Legend */}
                <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-[#C8A96A]/10 flex justify-center gap-6 md:gap-12 items-center">
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#C8A96A]" />
                    <span className="font-label text-[8px] md:text-[10px] uppercase tracking-widest text-[#C8A96A]/40 font-bold">Available</span>
                  </div>
                  <div className="flex items-center gap-2 md:gap-3">
                    <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#333534] border border-[#C8A96A]/10" />
                    <span className="font-label text-[8px] md:text-[10px] uppercase tracking-widest text-[#C8A96A]/40 font-bold">Full</span>
                  </div>
                </div>
              </div>

              {/* Gallery Section Preview */}
              <div className="mt-20 md:mt-32 w-full">
                <div className="text-center mb-12 md:mb-16">
                  <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#C8A96A] font-bold">Gallery</span>
                  <h2 className="font-headline text-3xl md:text-6xl text-[#C8A96A] mt-4 mb-12 md:mb-16">Captured Moments</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:grid-cols-3 md:gap-8">
                  {[
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBSXkv1bUTfT0-n4B887NnK9lcdaAiQyHPUtwpI2g6sJ0UQBso7OcEN2Dg3borLpRXTCX2tJ-QL503TjPzXaaN4Z6fFCSUQ-Dr3HOAJsaVPtXr4cT5ZEfkq-P4ymleX1dq06oIwT4y_m3FyXZJrO8OfUo3fYpHWFs-NeCormJTzH7wip230wKeAzC5uLw5oIT9-3tMWHffcAe8evlWkHjo1MRqSZZHcn695Ha5hmSI21seRVrl4KiuT-H_og6c0QrVR_ssiG2g3Oxo",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuD4qH16qwWZ8umR_Zj--U_ihIIxlL9L707YZ20Ml3SkjLt2Mx8WTmhxAfeL7KFjr71UBXr0FH84TXwsJBLFoDS1PNpA8WNWQ7Fdhld9S301PZJkyr4II6cTTQ-dmFO6l-3UY33Yf4SdWGqBosz6VwKzL5pxlAhJTbpCyWb6mnLR4iTlozoV-Jxz-aDytNZk2w_PH4x30nwPIcUubQzcHd2bysEM8-E36G4O4ILDEcvOCOvmXErwS1xDk5vyOeXJGgYe1RxwyNSsMN0",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBjhoXkdcSxBZno7ebjD6pTJlR3s9468JNQ6RpbyA1y6pRFyJD_3VcYuX0BWRqDM98Jy0K5PFQu0N50e5ZtF1cgyLnjIEoURPFKGnUXfwH5E9whxQggqABdbFy3fw6qcHF3CfHIxJeRAxYx5c6v5KjlfJbps6cHen7vbeV0Izvbtu_6aoWTYDjeHqz7jG6me4l7nu70UD6xIFv6i7hfLe3Cu0pR56oEGIK_pZeQ9tgbIVSmSwOnpWYFG4tGWnwwbYHbcznMaQV0dl4"
                  ].map((url, i) => (
                    <div key={i} className="aspect-[3/4] overflow-hidden rounded-2xl border border-[#C8A96A]/10 group relative cursor-pointer shadow-xl">
                      <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000 brightness-[0.8] group-hover:brightness-100" src={url} alt={`Gallery ${i + 1}`} />
                      <div className="absolute inset-0 bg-[#0F3D2E]/20 group-hover:bg-transparent transition-all duration-500" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </div>
  );
}
