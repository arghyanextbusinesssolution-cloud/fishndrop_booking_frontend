"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export function Sidebar({ closeMobile }: { closeMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const isOwnerOrAdmin =
    (user?.role === "admin" || user?.role === "owner") &&
    !user?.name?.toLowerCase().includes("sarah") &&
    !user?.email?.toLowerCase().includes("sarah");

  let links = [
    { href: "/user", label: "Dashboard" },
    { href: "/user/book", label: "Book a Table" },
    { href: "/user/bookings", label: "My Bookings" },
    { href: "/user/tickets", label: "Event Tickets" },
    { href: "/user/celebrations", label: "Celebrations" },
    { href: "/user/invites", label: "Invitations" },
    { href: "/user/venue-bookings", label: "Venue Bookings" }
  ];

  if (user?.role === "admin" || user?.role === "owner") {
    links = [
      { href: "/admin", label: "Dashboard" },
      { href: "/admin/check-in", label: "Door QR Check-In" },
      ...(isOwnerOrAdmin ? [{ href: "/admin/financials", label: "Financials" }] : []),
      { href: "/admin/bookings", label: "Bookings" },
      { href: "/admin/promoters", label: "Verify Promoters" },
      { href: "/admin/events-overview", label: "Events" },
      { href: "/admin/commission", label: "Commission" },
      { href: "/admin/events", label: "Verify Events" },
      { href: "/admin/employees", label: "Employees" },
      { href: "/admin/users", label: "Users" },
      { href: "/admin/data-center", label: "Data Center" },
      { href: "/admin/manual-booking", label: "Venue Booking" },
      { href: "/admin/tour-checkouts", label: "Venue Booking Checkout" },
      { href: "/admin/catering", label: "Restaurants & Catering" },
      { href: "/admin/tables", label: "Tables" },
      { href: "/admin/coupons", label: "Coupons" },
      { href: "/admin/blog", label: "Blog & Stories" },
      { href: "/admin/settings", label: "Pricing & Fees" }
    ];
  } else if (user?.role === "staff") {
    links = [
      { href: "/employee", label: "Dashboard" },
      { href: "/employee/promoters", label: "Verify Promoters" },
      { href: "/employee/events-overview", label: "Events" },
      { href: "/employee/events", label: "Verify Events" },
      { href: "/employee/payments", label: "Payments & Payouts" },
      { href: "/employee/check-in", label: "Door QR Check-In" },
      { href: "/employee/bookings", label: "Bookings" },
      { href: "/employee/tables", label: "Tables" },
      { href: "/employee/catering", label: "Restaurants & Catering" }
    ];
  } else if (user?.role === "promoter") {
    if (user?.promoterStatus === "approved") {
      links = [
        { href: "/promoter", label: "Promoter Dashboard" },
        { href: "/promoter/analytics", label: "Events" },
        { href: "/promoter/events", label: "My Events" },
        { href: "/promoter/events/new", label: "Create Event" },
        { href: "/promoter/bookings", label: "Sales History" },
        { href: "/promoter/check-in", label: "Door QR Check-In" },
        { href: "/promoter/payouts", label: "Stripe & Payouts" }
      ];
    } else {
      links = [
        { href: "/promoter", label: "Application Status" }
      ];
    }
  }

  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--surface)] p-4">
      <div className="mb-8">
        <p className="font-heading text-2xl text-[var(--accent)]">Tropica</p>
        {user?.role === "promoter" && (
          <span className="text-[10px] uppercase font-bold tracking-widest text-gold-gradient">
            Promoter Portal
          </span>
        )}
      </div>
      <nav className="space-y-2 overflow-y-auto pr-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMobile}
            className={`block cursor-pointer rounded-md border px-3 py-2 text-sm transition-colors ${
              pathname === link.href
                ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)] font-medium"
                : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-white"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        className="mt-auto cursor-pointer rounded-md bg-red-500/80 hover:bg-red-500 text-white px-3 py-2 text-sm transition-colors"
        aria-label="Logout"
        onClick={() => {
          clearAuth();
          toast.success("Signed out successfully");
          if (typeof window !== "undefined") {
            window.location.replace("/");
          }
        }}
      >
        Logout
      </button>
    </aside>
  );
}
