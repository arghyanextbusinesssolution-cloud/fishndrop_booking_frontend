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
    const handleScroll = (e?: Event) => {
      const scrollPos =
        window.scrollY ||
        (e?.target instanceof HTMLElement ? e.target.scrollTop : 0) ||
        document.documentElement.scrollTop;
      setIsScrolled(scrollPos > 20);
    };
    window.addEventListener("scroll", handleScroll, true);
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, []);

  const isHomePage = pathname === "/";
  const useTransparentNav = isHomePage && !isScrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-out",
        useTransparentNav
          ? "bg-gradient-to-b from-black/85 via-black/40 to-transparent py-4 md:py-5"
          : "bg-[#071912]/98 backdrop-blur-2xl border-b border-[#C8A96A]/25 shadow-[0_10px_35px_-5px_rgba(0,0,0,0.65)] py-3 md:py-3.5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-10 lg:px-12 flex items-center justify-between">
        {/* Brand Logo */}
        <NavSpinnerLink href="/" className="flex items-center group">
          <div className="relative h-12 w-32 sm:h-14 sm:w-40 md:h-16 md:w-48 transition-transform duration-300 group-hover:scale-105">
            <Image
              src="/tropica-logo.png"
              alt="Tropica Sanctuary"
              fill
              className="object-contain object-left drop-shadow-[0_2px_12px_rgba(0,0,0,0.4)]"
              priority
            />
          </div>
        </NavSpinnerLink>

        {/* Right Navigation & Actions */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
          {/* Book a Private Space Button */}
          <NavSpinnerLink
            href="/book-venue"
            className="hidden sm:inline-flex items-center text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#E5C77A] border border-[#C8A96A]/35 px-4 md:px-5 py-2.5 rounded-full hover:bg-[#C8A96A]/15 hover:border-[#C8A96A] hover:shadow-[0_0_20px_rgba(200,169,106,0.25)] transition-all duration-300 font-bold backdrop-blur-sm"
          >
            Book Private Space
          </NavSpinnerLink>

          {/* Book Tour */}
          <NavSpinnerLink
            href="https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"
            external
            className="hidden md:inline-flex items-center text-[10px] md:text-[11px] uppercase tracking-[0.2em] text-[#E5E7EB]/80 hover:text-white border border-white/15 hover:border-[#C8A96A]/50 px-4 md:px-5 py-2.5 rounded-full hover:bg-white/5 transition-all duration-300 font-bold backdrop-blur-sm"
          >
            Book Tour
          </NavSpinnerLink>

          {/* Notification Icon */}
          <button
            type="button"
            aria-label="Notifications"
            className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center border border-white/10 text-[#C8A96A]/70 hover:text-[#C8A96A] hover:border-[#C8A96A]/40 hover:bg-[#C8A96A]/10 transition-all duration-300"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              style={{ fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24" }}
            >
              notifications
            </span>
          </button>

          {/* Primary CTA (Sign In / Dashboard) */}
          {mounted && (
            isAuthenticated ? (
              <NavSpinnerLink
                href={user?.role === "admin" ? "/admin" : "/user"}
                className="bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] px-5 sm:px-7 py-2.5 rounded-full text-[#0d1612] font-body tracking-[0.2em] uppercase text-[10px] md:text-[11px] font-black shadow-lg shadow-[#C8A96A]/25 hover:shadow-[0_0_25px_rgba(200,169,106,0.45)] hover:scale-[1.03] active:scale-95 transition-all duration-300"
              >
                Dashboard
              </NavSpinnerLink>
            ) : (
              <NavSpinnerLink
                href="/login"
                className="bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] px-5 sm:px-7 py-2.5 rounded-full text-[#0d1612] font-body tracking-[0.2em] uppercase text-[10px] md:text-[11px] font-black shadow-lg shadow-[#C8A96A]/25 hover:shadow-[0_0_25px_rgba(200,169,106,0.45)] hover:scale-[1.03] active:scale-95 transition-all duration-300"
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

