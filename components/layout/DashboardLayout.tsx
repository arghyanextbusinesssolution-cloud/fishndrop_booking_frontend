"use client";

import { usePathname, useRouter } from "next/navigation";
import { LogOut, LayoutDashboard, CalendarDays, User, Settings, UserCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";

const SidebarItem = ({ icon: Icon, label, href, active, onClick }: { icon: any, label: string, href: string, active: boolean, onClick?: () => void }) => (
  <Link 
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-4 px-8 py-4 w-full transition-all duration-500 group relative",
      active ? "bg-surface-container-low text-primary" : "text-secondary hover:text-on-surface hover:bg-surface-container-lowest/50"
    )}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-gradient" />
    )}
    <Icon 
      className={cn("w-4 h-4 transition-colors duration-500", active ? "text-primary" : "text-secondary group-hover:text-primary")} 
      strokeWidth={1.5}
    />
    <span className={cn("text-[9px] uppercase tracking-[0.2em] font-bold", active ? "text-primary" : "text-secondary")}>
      {label}
    </span>
  </Link>
);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    router.push("/");
  };

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/user" },
    { icon: CalendarDays, label: "Reservations", href: "/user/bookings" },
    { icon: User, label: "Dining Profile", href: "/user/profile" },
    { icon: Settings, label: "Preferences", href: "/user/preferences" },
  ];

  return (
    <div className="flex min-h-screen bg-background relative overflow-x-hidden">
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-surface-container-low border-b border-outline-variant/10 z-40 flex items-center justify-between px-6 backdrop-blur-md bg-opacity-80">
        <Link href="/" className="text-xl font-headline italic text-on-surface tracking-tight">
          Fishndrop
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-secondary hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Backdrop (Mobile) */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 lg:hidden",
          isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside className={cn(
        "w-64 bg-surface-container-low flex flex-col py-12 fixed h-screen overflow-y-auto border-r border-outline-variant/5 z-50 transition-transform duration-500 lg:translate-x-0 tracking-tight",
        isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="px-8 mb-16 hidden lg:block">
          <Link href="/" className="text-2xl font-headline italic text-on-surface tracking-tight block">
            Fishndrop
          </Link>
        </div>

        <div className="px-8 mt-4 lg:mt-0 mb-12 flex items-center gap-4 group cursor-pointer text-left">
          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden ambient-shadow">
             <UserCircle className="w-7 h-7 text-on-surface-variant" strokeWidth={1} />
          </div>
          <div className="space-y-0.5">
            <p className="font-headline text-lg italic leading-none truncate max-w-[120px]">The Concierge</p>
            <p className="text-[8px] uppercase tracking-widest text-primary font-bold truncate max-w-[120px]">{user?.name || "Fishndrop Guest"}</p>
          </div>
        </div>

        <nav className="flex-grow space-y-1">
          {navItems.map((item) => (
            <SidebarItem 
              key={item.href}
              {...item}
              active={pathname === item.href}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}
          
          <div className="px-8 pt-8">
            <Link 
              href="/book-table"
              className="bg-gold-gradient w-full py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-[9px] font-bold text-center block shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95"
            >
              Book a Journey
            </Link>
          </div>
        </nav>

        <div className="px-8 mt-auto pt-12 border-t border-outline-variant/10">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-4 text-secondary hover:text-error group transition-colors duration-500 w-full"
          >
            <LogOut className="w-4 h-4" strokeWidth={1.5} />
            <span className="text-[9px] uppercase tracking-widest font-bold">Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
