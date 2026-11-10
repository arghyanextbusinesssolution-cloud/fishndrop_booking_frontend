"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { LoadingScreen } from "@/components/shared/LoadingScreen";
import { Hero } from "@/components/home/Hero";
import { NavSpinnerLink } from "@/components/shared/NavSpinnerLink";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showDisclaimer && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    } else if (showDisclaimer && countdown === 0) {
      setShowDisclaimer(false);
      router.push('/book-venue');
    }
    return () => clearInterval(timer);
  }, [showDisclaimer, countdown, router]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const apiBase = process.env.NEXT_PUBLIC_API_URL || "/api";
        await fetch(`${apiBase}/health`);
        setIsLoading(false);
      } catch (error) {
        console.error("Backend health check failed:", error);
        setIsLoading(false);
      }
    };

    void checkBackend();
  }, []);

  return (
    <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface selection:bg-primary/30 selection:text-primary font-body overflow-x-hidden">
      <LoadingScreen isLoading={isLoading} />

      {/* Booking Notice Modal */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-[#0F3D2E]/90 backdrop-blur-sm p-4">
          <div className="bg-[#1a1c1b] border border-[#C8A96A]/30 rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-fade-in relative text-center">
            <div className="w-16 h-16 rounded-full bg-[#C8A96A]/10 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-[#C8A96A] text-3xl">info</span>
            </div>
            <h3 className="font-headline italic text-2xl md:text-3xl text-[#C8A96A] mb-4">Notice</h3>
            <p className="font-body text-on-surface/80 text-sm md:text-base mb-8 leading-relaxed">
              We are currently not taking general restaurant reservations. To experience Tropica, please explore our Private Dining Space opportunities.
            </p>
            <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] mb-8 animate-pulse">
              Redirecting to Private Space in {countdown}s...
            </p>

            <div className="flex flex-col gap-3">
              <NavSpinnerLink
                href="/book-venue"
                className="w-full py-4 font-label text-[10px] uppercase tracking-[0.2em] bg-[#C8A96A] text-[#0F3D2E] rounded-lg hover:brightness-110 transition-all font-bold flex items-center justify-center"
              >
                Explore Private Space
              </NavSpinnerLink>
              <button
                onClick={() => {
                  setShowDisclaimer(false);
                }}
                className="w-full py-3 font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/60 hover:text-[#C8A96A] transition-all font-bold"
              >
                Close
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
          <Hero onTableReservationClick={() => {
            setCountdown(5);
            setShowDisclaimer(true);
          }} />

        </main>
        <Footer showCta={false} />
      </div>
    </div>
  );
}
