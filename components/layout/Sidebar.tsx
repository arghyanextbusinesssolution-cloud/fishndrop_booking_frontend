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

  const links = (user?.role === "admin" || user?.role === "owner")
    ? [
        { href: "/admin", label: "Dashboard" },
        ...(isOwnerOrAdmin ? [{ href: "/admin/financials", label: "Financials" }] : []),
        { href: "/admin/bookings", label: "All Bookings" },
        { href: "/admin/catering", label: "Restaurants & Catering" },
        { href: "/admin/tables", label: "Tables" },
        { href: "/admin/coupons", label: "Coupons" }
      ]
    : [{ href: "/user", label: "Dashboard" }, { href: "/user/book", label: "Book a Table" }, { href: "/user/bookings", label: "My Bookings" }, { href: "/user/venue-bookings", label: "Venue Bookings" }];

  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--surface)] p-4">
      <p className="mb-8 font-heading text-2xl text-[var(--accent)]">Tropica</p>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMobile}
            className={`block cursor-pointer rounded-md border px-3 py-2 transition-colors ${pathname === link.href
              ? "border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]"
              : "border-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-white"
              }`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <button
        className="mt-auto cursor-pointer rounded-md bg-red-500 px-3 py-2 text-sm"
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
