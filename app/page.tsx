"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
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
    setIsNavigating(true);
    
    // Artificial "Compiling" delay for premium feel
    setTimeout(() => {
      try {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateString = `${year}-${month}-${day}`;
        router.push(`/book-table?date=${dateString}`);
      } catch (e) {
        console.error("Date selection error:", e);
        setIsNavigating(false);
      }
    }, 1500);
  };

  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface selection:bg-primary/30 selection:text-primary font-body">
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

      <div className={cn(
        "min-h-screen flex flex-col transition-opacity duration-1000",
        isLoading ? "opacity-0" : "opacity-100"
      )}>
        <NavBar />

        <main className="flex-grow pt-24 md:pt-32 pb-8 md:pb-12 px-4 md:px-12 flex flex-col items-center">
          {/* Progress Stepper */}
          <div className="w-full max-w-4xl mb-8 md:mb-16">
            <div className="flex items-center justify-between mb-2 md:mb-4 px-2">
              <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">Step 1 of 8: Date Selection</span>
              <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">12.5%</span>
            </div>
            <div className="h-1 w-full bg-[#333534] rounded-full overflow-hidden">
              <div className="h-full bg-[#C8A96A] w-[12.5%] transition-all duration-700 ease-out shadow-[0_0_10px_rgba(200,169,106,0.5)]"></div>
            </div>
          </div>

          {/* Hero Section */}
          <div className="text-center mb-6 md:mb-12">
            <h1 className="font-headline text-3xl md:text-7xl text-on-surface mb-3 md:mb-6 font-semibold tracking-tight">When shall we expect you?</h1>
            <p className="font-body text-on-surface/60 text-xs md:text-base max-w-lg mx-auto leading-relaxed mb-4 md:mb-6">
              Select a preferred date for your private garden experience.
            </p>
            <button
              onClick={() => router.push('/book-venue')}
              className="px-4 py-2.5 md:px-6 md:py-3 border border-[#C8A96A]/30 text-[#C8A96A] font-label text-[8px] md:text-[10px] uppercase tracking-[0.25em] rounded-full hover:bg-[#C8A96A]/10 transition-all font-bold shadow-[0_0_15px_rgba(200,169,106,0.15)]"
            >
              Book Lounge
            </button>
          </div>

          {/* Calendar Container */}
          <div className="w-full max-w-2xl bg-[#1a1c1b] rounded-xl border border-[#C8A96A]/10 p-4 md:p-8 shadow-[0_0_30px_rgba(0,0,0,0.3)] relative overflow-hidden group">
            {/* Decorative leaf like in Stitch */}
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity">
               <span className="material-symbols-outlined text-[60px] md:text-[120px]">spa</span>
            </div>
            
            <Calendar selectedDate={selectedDate} onSelect={handleDateSelect} />

            {/* Calendar Legend */}
            <div className="mt-4 md:mt-8 pt-4 md:pt-6 border-t border-[#C8A96A]/10 flex justify-between items-center">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#C8A96A]" />
                <span className="font-label text-[8px] md:text-[10px] uppercase tracking-widest text-on-surface/40 font-bold">Available</span>
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-[#333534] border border-[#C8A96A]/10" />
                <span className="font-label text-[8px] md:text-[10px] uppercase tracking-widest text-on-surface/40 font-bold">Full</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 md:mt-16 w-full max-w-2xl flex justify-between items-center gap-4">
            <button 
              onClick={() => router.push('/')}
              className="flex-1 md:flex-none px-6 md:px-10 py-3 md:py-4 font-label text-[8px] md:text-[10px] uppercase tracking-[0.25em] text-[#C8A96A] border border-[#C8A96A]/30 rounded-lg hover:bg-[#C8A96A]/5 transition-all font-bold"
            >
              Cancel
            </button>
            <button 
              disabled={!selectedDate}
              onClick={() => selectedDate && handleDateSelect(selectedDate)}
              className="flex-[2] md:flex-none bg-[#C8A96A] px-6 md:px-12 py-3 md:py-4 font-label text-[8px] md:text-[10px] uppercase tracking-[0.25em] text-[#0F3D2E] rounded-lg shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 md:gap-3 font-bold"
            >
              Next: Choose Time
              <span className="material-symbols-outlined text-[14px] md:text-[18px]">arrow_forward</span>
            </button>
          </div>

          {/* Context Images */}
          <div className="mt-20 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="aspect-square overflow-hidden rounded-xl border border-[#C8A96A]/10 group">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSXkv1bUTfT0-n4B887NnK9lcdaAiQyHPUtwpI2g6sJ0UQBso7OcEN2Dg3borLpRXTCX2tJ-QL503TjPzXaaN4Z6fFCSUQ-Dr3HOAJsaVPtXr4cT5ZEfkq-P4ymleX1dq06oIwT4y_m3FyXZJrO8OfUo3fYpHWFs-NeCormJTzH7wip230wKeAzC5uLw5oIT9-3tMWHffcAe8evlWkHjo1MRqSZZHcn695Ha5hmSI21seRVrl4KiuT-H_og6c0QrVR_ssiG2g3Oxo" alt="Garden" />
            </div>
            <div className="aspect-square overflow-hidden rounded-xl border border-[#C8A96A]/10 group">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4qH16qwWZ8umR_Zj--U_ihIIxlL9L707YZ20Ml3SkjLt2Mx8WTmhxAfeL7KFjr71UBXr0FH84TXwsJBLFoDS1PNpA8WNWQ7Fdhld9S301PZJkyr4II6cTTQ-dmFO6l-3UY33Yf4SdWGqBosz6VwKzL5pxlAhJTbpCyWb6mnLR4iTlozoV-Jxz-aDytNZk2w_PH4x30nwPIcUubQzcHd2bysEM8-E36G4O4ILDEcvOCOvmXErwS1xDk5vyOeXJGgYe1RxwyNSsMN0" alt="Lounge" />
            </div>
            <div className="aspect-square overflow-hidden rounded-xl border border-[#C8A96A]/10 group">
              <img className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBjhoXkdcSxBZno7ebjD6pTJlR3s9468JNQ6RpbyA1y6pRFyJD_3VcYuX0BWRqDM98Jy0K5PFQu0N50e5ZtF1cgyLnjIEoURPFKGnUXfwH5E9whxQggqABdbFy3fw6qcHF3CfHIxJeRAxYx5c6v5KjlfJbps6cHen7vbeV0Izvbtu_6aoWTYDjeHqz7jG6me4l7nu70UD6xIFv6i7hfLe3Cu0pR56oEGIK_pZeQ9tgbIVSmSwOnpWYFG4tGWnwwbYHbcznMaQV0dl4" alt="Table" />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

