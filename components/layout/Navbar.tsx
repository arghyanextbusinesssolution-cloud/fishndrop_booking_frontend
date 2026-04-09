"use client";

import { Menu } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function Navbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  const { user } = useAuthStore();
  return (
    <header className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--surface)] px-4 py-3">
      <button className="rounded-md p-2 hover:bg-[var(--surface-2)] md:hidden" aria-label="Open sidebar" onClick={onOpenMobile}>
        <Menu size={20} />
      </button>
      <div className="ml-auto flex items-center gap-3">
        <p className="text-sm">{user?.name ?? "Guest"}</p>
        <span className="rounded-full bg-[var(--accent)] px-2 py-1 text-xs text-black">{user?.role === "admin" ? "Admin" : "User"}</span>
      </div>
    </header>
  );
}
