"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { NavSpinnerLink } from "@/components/shared/NavSpinnerLink";

export const NavBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 w-full z-50 flex justify-between items-center px-2 md:px-4 py-2 md:py-4 transition-all duration-500",
      isScrolled
        ? "bg-[#0F3D2E]/95 backdrop-blur-md border-b border-[#C8A96A]/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]"
        : "bg-transparent"
    )}>
      <NavSpinnerLink href="/" className="flex items-center">
        <div className="relative w-72 h-24 md:w-[28rem] md:h-40 hover:brightness-110 transition-all -ml-2 md:-ml-4">
          <Image
            src="/tropica-logo.png"
            alt="Tropica Sanctuary"
            fill
            className="object-contain object-left"
            priority
          />
        </div>
      </NavSpinnerLink>

      <div className="flex items-center gap-2 md:gap-8">
        <div className="hidden lg:flex items-center gap-10">
          <NavSpinnerLink href="/" className="text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold">
            Reservations
          </NavSpinnerLink>
        </div>

        {/* Book a Private Space Button */}
        <NavSpinnerLink
          href="/book-venue"
          className="hidden sm:flex text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] border border-[#C8A96A]/30 px-4 py-2 rounded-full hover:bg-[#C8A96A]/10 transition-all font-bold"
        >
          Book Private Space
        </NavSpinnerLink>

        <NavSpinnerLink
          href="https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"
          external
          className="hidden sm:flex text-[9px] md:text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] border border-[#C8A96A]/30 px-4 py-2 rounded-full hover:bg-[#C8A96A]/10 transition-all font-bold"
        >
          Book Tour
        </NavSpinnerLink>

        <div className="flex items-center gap-3 md:gap-6">
          <button className="hidden sm:flex text-[#C8A96A]/60 hover:text-[#C8A96A] transition-all items-center justify-center">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}>notifications</span>
          </button>

          {mounted && (
            isAuthenticated ? (
              <NavSpinnerLink
                href={user?.role === "admin" ? "/admin" : "/user"}
                className="bg-gold-gradient px-4 md:px-8 py-2 md:py-2.5 rounded-full text-on-primary font-body tracking-[0.2em] uppercase text-[9px] md:text-[10px] font-bold shadow-lg shadow-[#C8A96A]/20 hover:scale-105 transition-all active:scale-95"
              >
                Dashboard
              </NavSpinnerLink>
            ) : (
              <NavSpinnerLink
                href="/login"
                className="bg-gold-gradient px-4 md:px-8 py-2 md:py-2.5 rounded-full text-on-primary font-body tracking-[0.2em] uppercase text-[9px] md:text-[10px] font-bold shadow-lg shadow-[#C8A96A]/20 hover:scale-105 transition-all active:scale-95"
              >
                Sign In
              </NavSpinnerLink>
            )
          )}
        </div>
      </div>
    </header>
  );
};
