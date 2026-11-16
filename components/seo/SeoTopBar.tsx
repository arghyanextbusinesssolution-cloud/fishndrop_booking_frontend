"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, LogOut } from "lucide-react";
import { useAuthStore } from "@/store/authStore";

export function SeoTopBar() {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const logout = () => {
    clearAuth();
    router.replace("/seo-login");
  };

  return (
    <header className="sticky top-0 z-30 border-b border-[#C8A96A]/20 bg-[#0d1612]/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Image src="/tropica-logo.png" alt="Tropica" width={36} height={36} className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="truncate font-headline text-lg text-[#E8CB8A]">Blog Manager</p>
            <p className="truncate text-[11px] uppercase tracking-[0.18em] text-white/50">
              SEO{user?.name ? ` · ${user.name}` : ""}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/blog"
            target="_blank"
            className="hidden items-center gap-1.5 rounded-lg border border-white/15 px-3 py-2 text-xs font-semibold text-white/80 hover:bg-white/10 sm:inline-flex"
          >
            <ExternalLink className="h-3.5 w-3.5" /> View blog
          </Link>
          <button
            type="button"
            onClick={logout}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C8A96A] px-3 py-2 text-xs font-bold text-[#0d1612] hover:bg-[#E8CB8A]"
          >
            <LogOut className="h-3.5 w-3.5" /> Log out
          </button>
        </div>
      </div>
    </header>
  );
}
