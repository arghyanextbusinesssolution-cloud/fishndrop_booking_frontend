"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { User } from "lucide-react";
import { useState, useEffect } from "react";

export const NavBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex flex-col md:flex-row justify-center md:justify-between items-center px-6 md:px-12 py-4 md:py-6 shadow-sm shadow-on-surface/5">
      <Link href="/" className="flex items-center mb-0 md:mb-0">
        <img 
          src="https://www.fishndrop.com/wp-content/uploads/2026/01/cropped-logo-1-1.png" 
          alt="Fishndrop" 
          className="h-10 md:h-12 w-auto object-contain"
        />
      </Link>
      
      <div className="hidden md:flex gap-12 items-center">
        {/* Navigation Links omitted/truncated for brevity in TargetContent */}
        <Link href="#" className="font-body tracking-widest uppercase text-[10px] text-secondary hover:text-primary transition-colors duration-500">Le Menu</Link>
        <Link href="#" className="font-body tracking-widest uppercase text-[10px] text-secondary hover:text-primary transition-colors duration-500">The Experience</Link>
        <Link href="#" className="font-body tracking-widest uppercase text-[10px] text-secondary hover:text-primary transition-colors duration-500">Private Dining</Link>
        <Link 
          href="/" 
          className={cn(
            "font-body tracking-widest uppercase text-[10px] transition-colors duration-500",
            pathname === "/" ? "text-primary border-b border-primary-container pb-1" : "text-secondary hover:text-primary"
          )}
        >
          Reservations
        </Link>
      </div>

      <div className="absolute right-6 md:static flex items-center gap-6">
        {!mounted ? (
          <div className="w-24 h-9 rounded-full bg-surface-container-low animate-pulse" />
        ) : isAuthenticated ? (
          <Link 
            href={user?.role === "admin" ? "/admin" : "/user"}
            className="group flex items-center gap-4 bg-surface-container-low px-5 py-2.5 rounded-full border border-primary/10 hover:border-primary/30 transition-all duration-500 hover:ambient-shadow"
          >
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-on-surface">
                {user?.name?.split(' ')[0] || "Guest"}
              </span>
              <span className="text-[7px] uppercase tracking-widest text-primary font-bold opacity-60">
                {user?.role === "admin" ? "Concierge" : "Member"}
              </span>
            </div>
            <div className="w-8 h-8 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform">
              <User className="w-3.5 h-3.5 text-on-primary" />
            </div>
          </Link>
        ) : (
          <Link 
            href="/login"
            className="bg-gold-gradient px-8 py-2.5 rounded-full text-on-primary font-body tracking-[0.25em] uppercase text-[10px] font-bold shadow-xl shadow-primary/20 hover:scale-[1.05] hover:shadow-primary/40 transition-all duration-500 active:scale-95"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};
