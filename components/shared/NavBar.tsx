"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { User } from "lucide-react";

export const NavBar = () => {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuthStore();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-xl flex justify-between items-center px-6 md:px-12 py-6 shadow-sm shadow-on-surface/5">
      <Link href="/" className="text-2xl font-headline italic text-on-surface">
        Fishndrop
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

      <Link 
        href={isAuthenticated ? "/user" : "/login"}
        className="group flex items-center gap-4 bg-gold-gradient pl-6 pr-4 py-2.5 rounded-lg text-on-primary font-body tracking-widest uppercase text-[10px] font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all duration-500"
      >
        <span>{isAuthenticated ? (user?.name?.split(' ')[0] || "Profile") : "Login"}</span>
        <div className="w-6 h-6 rounded-full bg-on-primary/10 flex items-center justify-center group-hover:bg-on-primary/20 transition-colors">
          <User className="w-3 h-3 text-on-primary" />
        </div>
      </Link>
    </nav>
  );
};
