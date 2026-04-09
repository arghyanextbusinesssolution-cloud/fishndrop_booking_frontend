"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

export function Sidebar({ closeMobile }: { closeMobile?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();
  const links = user?.role === "admin"
    ? [{ href: "/admin", label: "Dashboard" }, { href: "/admin/bookings", label: "All Bookings" }, { href: "/admin/tables", label: "Tables" }]
    : [{ href: "/user", label: "Dashboard" }, { href: "/user/book", label: "Book a Table" }, { href: "/user/bookings", label: "My Bookings" }];

  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--surface)] p-4">
      <p className="mb-8 font-heading text-2xl text-[var(--accent)]">Fish & Drop</p>
      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            onClick={closeMobile}
            className={`block cursor-pointer rounded-md border px-3 py-2 transition-colors ${
              pathname === link.href
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
          toast.success("Logged out");
          router.push("/login");
        }}
      >
        Logout
      </button>
    </aside>
  );
}
