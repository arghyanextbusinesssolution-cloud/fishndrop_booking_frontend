"use client";

import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  History,
  PlusCircle,
  LogOut,
  LayoutDashboard,
  CalendarDays,
  User,
  Settings,
  UserCircle,
  Menu,
  X,
  TableProperties,
  CreditCard,
  Lock,
  Wrench,
  Ticket,
  UtensilsCrossed,
  DollarSign,
  Users,
  BookOpen,
  Camera,
  MapPin,
  ShieldCheck,
  UserPlus,
  QrCode,
  Clock,
  BarChart3,
  Percent,
  PartyPopper,
  MailOpen,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuthStore } from "@/store/authStore";
import { useState, useEffect } from "react";
import { useUpcomingParties, relativeDay } from "@/hooks/useUpcomingParties";
import { formatTimeTo12Hour } from "@/lib/utils";

const SidebarItem = ({
  icon: Icon,
  label,
  href,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  href: string;
  active: boolean;
  onClick?: () => void;
}) => (
  <Link
    href={href}
    onClick={onClick}
    className={cn(
      "flex items-center gap-3.5 px-7 py-3.5 w-full transition-all duration-500 group relative",
      active
        ? "bg-[#0a2e21] text-[#C8A96A]"
        : "text-[#C8A96A]/50 hover:text-[#C8A96A] hover:bg-[#0a2e21]/60"
    )}
  >
    {active && (
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gold-gradient" />
    )}
    <Icon
      className={cn(
        "w-5 h-5 shrink-0 transition-colors duration-500",
        active ? "text-[#C8A96A]" : "text-[#C8A96A]/40 group-hover:text-[#C8A96A]"
      )}
      strokeWidth={1.5}
    />
    <span
      className={cn(
        "text-[13px] uppercase tracking-[0.1em] font-bold leading-snug",
        active ? "text-[#C8A96A]" : "text-[#C8A96A]/50"
      )}
    >
      {label}
    </span>
  </Link>
);

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth, fetchMe } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync latest user profile & verification status from DB on mount
  useEffect(() => {
    if (user) {
      void fetchMe();
    }
  }, []);

  const isAdmin = user?.role === "admin" || user?.role === "owner";
  const isOwnerOrAdmin =
    isAdmin &&
    !user?.name?.toLowerCase().includes("sarah") &&
    !user?.email?.toLowerCase().includes("sarah");

  // Close mobile menu on path change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    clearAuth();
    // Hard redirect — clears Next.js router cache + Zustand in-memory state
    if (typeof window !== "undefined") {
      window.location.replace("/");
    }
  };

  const isStaff = user?.role === "staff";
  const isPromoter = user?.role === "promoter";
  const isApprovedPromoter = isPromoter && user?.promoterStatus === "approved";
  const isGuestUser = !!user && !isAdmin && !isStaff && !isPromoter;
  const upcoming = useUpcomingParties(isGuestUser);
  const nextUp = upcoming?.[0];

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
    ...(isOwnerOrAdmin
      ? [{ icon: DollarSign, label: "Financials", href: "/admin/financials" }]
      : []),
    { icon: CalendarDays, label: "Bookings", href: "/admin/bookings" },
    { icon: Users, label: "Users", href: "/admin/users" },
    { icon: Database, label: "Data Center", href: "/admin/data-center" },
    { icon: ShieldCheck, label: "Verify Promoters", href: "/admin/promoters" },
    { icon: BarChart3, label: "Events", href: "/admin/events-overview" },
    { icon: Percent, label: "Commission", href: "/admin/commission" },
    { icon: Ticket, label: "Verify Events", href: "/admin/events" },
    { icon: UserPlus, label: "Employees", href: "/admin/employees" },
    { icon: QrCode, label: "Door QR Check-In", href: "/admin/check-in" },
    { icon: UtensilsCrossed, label: "Restaurants & Catering", href: "/admin/catering" },
    { icon: TableProperties, label: "Tables", href: "/admin/tables" },
    { icon: CreditCard, label: "Payments", href: "/admin/payments" },
    { icon: Lock, label: "Slot Locks", href: "/admin/locks" },
    { icon: Ticket, label: "Coupons", href: "/admin/coupons" },
    { icon: BookOpen, label: "Blog", href: "/admin/blog" },
    { icon: Camera, label: "Gallery & Photos", href: "/admin/gallery" },
    { icon: Wrench, label: "Settings", href: "/admin/settings" },
    { icon: MapPin, label: "Venue Booking Checkout", href: "/admin/tour-checkouts" },
  ];

  const staffNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/employee" },
    { icon: ShieldCheck, label: "Verify Promoters", href: "/employee/promoters" },
    { icon: BarChart3, label: "Events", href: "/employee/events-overview" },
    { icon: Ticket, label: "Verify Events", href: "/employee/events" },
    { icon: CreditCard, label: "Payments & Payouts", href: "/employee/payments" },
    { icon: QrCode, label: "Door QR Check-In", href: "/employee/check-in" },
    { icon: CalendarDays, label: "Bookings", href: "/employee/bookings" },
    { icon: TableProperties, label: "Tables", href: "/employee/tables" },
    { icon: UtensilsCrossed, label: "Restaurants & Catering", href: "/employee/catering" },
  ];

  const promoterNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/promoter" },
    { icon: BarChart3, label: "Events", href: "/promoter/analytics" },
    { icon: CalendarDays, label: "My Events", href: "/promoter/events" },
    { icon: PlusCircle, label: "Create Event", href: "/promoter/events/new" },
    { icon: History, label: "Sales History", href: "/promoter/bookings" },
    { icon: QrCode, label: "Door QR Check-In", href: "/promoter/check-in" },
    { icon: DollarSign, label: "Stripe & Payouts", href: "/promoter/payouts" },
  ];

  const pendingPromoterNavItems = [
    { icon: Clock, label: "Application Status", href: "/promoter" },
  ];

  const userNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/user" },
    { icon: CalendarDays, label: "Reservations", href: "/user/bookings" },
    { icon: Ticket, label: "Event Tickets", href: "/user/tickets" },
    { icon: PartyPopper, label: "Celebrations", href: "/user/celebrations" },
    { icon: MailOpen, label: "Invitations", href: "/user/invites" },
    { icon: UtensilsCrossed, label: "Venue Bookings", href: "/user/venue-bookings" },
    { icon: User, label: "Dining Profile", href: "/user/profile" },
  ];

  const navItems = isAdmin
    ? adminNavItems
    : isStaff
    ? staffNavItems
    : isApprovedPromoter
    ? promoterNavItems
    : isPromoter
    ? pendingPromoterNavItems
    : userNavItems;

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/user" || href === "/promoter" || href === "/employee") {
      return pathname === href;
    }
    if (!(pathname === href || pathname.startsWith(`${href}/`))) return false;
    // A more specific menu item wins (e.g. "/promoter/events/new" over "/promoter/events")
    return !navItems.some(
      (item) => item.href.length > href.length && (pathname === item.href || pathname.startsWith(`${item.href}/`))
    );
  };

  return (
    <div className="flex min-h-screen relative" style={{ backgroundColor: '#0F3D2E' }}>
      {/* Mobile Top Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 border-b border-[#C8A96A]/15 z-40 flex items-center justify-between px-4 sm:px-6 backdrop-blur-md" style={{ backgroundColor: '#0a2e21' }}>
        <Link
          href="/"
          className="flex items-center focus:outline-none"
        >
          <div className="relative h-11 w-36 sm:h-12 sm:w-40">
            <Image
              src="/tropica-logo.png"
              alt="Tropica"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-secondary hover:text-primary transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Sidebar Backdrop (Mobile) */}
      <div
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-500 lg:hidden",
          isMobileMenuOpen
            ? "opacity-100"
            : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={cn(
          "w-72 flex flex-col py-12 fixed h-screen overflow-y-auto z-50 transition-transform duration-500 lg:translate-x-0 tracking-tight border-r border-[#C8A96A]/10",
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: '#0a2e21' }}
      >
        <div className="px-8 mb-16 hidden lg:block">
          <Link
            href="/"
            className="flex items-center"
          >
            <div className="relative w-72 h-24 hover:brightness-110 transition-all">
              <Image
                src="/tropica-logo.png"
                alt="Tropica"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        <div className="px-8 mt-4 lg:mt-0 mb-12 flex items-center gap-4 group cursor-pointer text-left">
          <div className="w-12 h-12 rounded-lg bg-surface-container-highest flex items-center justify-center overflow-hidden ambient-shadow">
            <UserCircle
              className="w-7 h-7 text-on-surface-variant"
              strokeWidth={1}
            />
          </div>
          <div className="space-y-0.5">
            <p className="font-headline text-xl italic leading-none truncate max-w-[160px] text-[#C8A96A]">
              {isAdmin ? "The Concierge" : isStaff ? (user?.name || "Staff Member") : isPromoter ? (user?.companyName || user?.name || "Promoter") : (user?.name || "Guest")}
            </p>
            <p className="text-[11px] uppercase tracking-widest text-[#C8A96A]/60 font-bold truncate max-w-[160px]">
              {isAdmin ? "System Admin" : isStaff ? "Employee" : isApprovedPromoter ? "Event Organizer" : isPromoter ? "Pending Approval" : "Tropica Guest"}
            </p>
          </div>
        </div>

        <nav className="flex-grow space-y-1">
          {navItems.map((item) => (
            <SidebarItem
              key={item.href}
              {...item}
              active={isActive(item.href)}
              onClick={() => setIsMobileMenuOpen(false)}
            />
          ))}

          {isGuestUser && nextUp && (
            <div className="px-6 pt-6">
              <Link
                href={nextUp.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-xl border border-[#C8A96A]/30 bg-[#C8A96A]/10 hover:bg-[#C8A96A]/15 p-4 transition-colors"
              >
                <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#C8A96A]">
                  Up next · {relativeDay(nextUp.dayKey)}
                </p>
                <p className="mt-1 text-base font-semibold text-white leading-snug line-clamp-2">{nextUp.title}</p>
                <p className="text-xs text-white/60 mt-0.5">
                  {formatTimeTo12Hour(nextUp.startTime)} · {nextUp.badge}
                </p>
                {upcoming && upcoming.length > 1 && (
                  <p className="text-[11px] text-white/45 mt-1.5">+{upcoming.length - 1} more coming up</p>
                )}
              </Link>
            </div>
          )}

          {!isAdmin && !isStaff && !isPromoter && (
            <div className="px-8 pt-8">
              <Link
                href="/"
                className="bg-gold-gradient w-full py-4 rounded-lg text-on-primary font-label tracking-[0.2em] uppercase text-xs font-bold text-center block shadow-lg shadow-primary/10 hover:scale-[1.02] transition-all active:scale-95"
              >
                Book a Journey
              </Link>
            </div>
          )}
        </nav>

        <div className="px-8 mt-auto pt-12 border-t border-outline-variant/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-4 text-[#C8A96A]/40 hover:text-error group transition-colors duration-500 w-full"
          >
            <LogOut className="w-5 h-5" strokeWidth={1.5} />
            <span className="text-[13px] uppercase tracking-widest font-bold">
              Sign Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-grow lg:ml-72 min-h-screen pt-16 lg:pt-0 overflow-x-auto">
        {children}
      </main>
    </div>
  );
}
