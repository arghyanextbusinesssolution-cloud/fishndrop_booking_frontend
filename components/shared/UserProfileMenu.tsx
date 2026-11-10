"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ChevronDown, LayoutDashboard, LogOut, Ticket, User as UserIcon } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types";

export const dashboardHref = (role?: User["role"]) =>
  role === "admin" || role === "owner"
    ? "/admin"
    : role === "staff"
    ? "/employee"
    : role === "promoter"
    ? "/promoter"
    : "/user";

const initials = (name?: string) =>
  (name || "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("") || "G";

/**
 * Avatar + name chip for the public top navbar. Shows the signed-in profile with
 * quick links to the dashboard; renders nothing when signed out.
 */
export function UserProfileMenu({ compact = false }: { compact?: boolean }) {
  const { user, isAuthenticated, clearAuth } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!mounted || !isAuthenticated || !user) return null;

  const name = user.name && user.name !== "Guest User" ? user.name : "";
  const home = dashboardHref(user.role);
  const isGuest = !user.role || user.role === "user";

  const signOut = () => {
    clearAuth();
    toast.success("Signed out successfully");
    window.location.replace("/");
  };

  const item =
    "flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-white/80 hover:bg-white/5 hover:text-[#E5C77A] transition-colors";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-[#C8A96A]/40 bg-black/30 pl-1 pr-2.5 py-1 hover:border-[#C8A96A] transition-colors cursor-pointer"
      >
        <span className="w-8 h-8 rounded-full bg-gradient-to-br from-[#C8A96A] to-[#8a6d35] text-[#0d1612] text-[11px] font-black flex items-center justify-center">
          {initials(name)}
        </span>
        {!compact && (
          <span className="hidden sm:block max-w-[120px] truncate text-xs font-semibold text-white">
            {name || "My Account"}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-[#C8A96A] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-xl border border-[#C8A96A]/25 bg-[#0c1612] shadow-2xl p-2 z-[70]"
        >
          <div className="px-3 py-2.5 border-b border-white/10 mb-1.5">
            <p className="text-sm font-bold text-white truncate">{name || "My Account"}</p>
            {user.email && <p className="text-[11px] text-white/50 truncate">{user.email}</p>}
            {user.phone && <p className="text-[11px] text-white/40 font-mono truncate">{user.phone}</p>}
          </div>
          <Link href={home} className={item} role="menuitem" onClick={() => setOpen(false)}>
            <LayoutDashboard className="w-4 h-4 text-[#C8A96A]" /> Dashboard
          </Link>
          {isGuest && (
            <>
              <Link href="/user/tickets" className={item} role="menuitem" onClick={() => setOpen(false)}>
                <Ticket className="w-4 h-4 text-[#C8A96A]" /> My Event Tickets
              </Link>
              <Link href="/user/profile" className={item} role="menuitem" onClick={() => setOpen(false)}>
                <UserIcon className="w-4 h-4 text-[#C8A96A]" /> My Profile
              </Link>
            </>
          )}
          <button type="button" onClick={signOut} className={`${item} w-full text-left hover:text-rose-300 cursor-pointer`} role="menuitem">
            <LogOut className="w-4 h-4 text-rose-400" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
