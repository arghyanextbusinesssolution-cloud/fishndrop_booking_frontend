"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import { TropicaAuthShell } from "@/components/auth/TropicaAuthShell";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin" || user?.role === "owner") router.replace("/admin");
      else if (user?.role === "staff") router.replace("/employee");
      else if (user?.role === "promoter") router.replace("/promoter");
      else router.replace("/user");
    }
  }, [isAuthenticated, router, user?.role]);

  return (
    <TropicaAuthShell
      eyebrow="Members Lounge"
      title="Welcome back"
      subtitle="Sign in to manage your reservations, parties and guest passes."
      footer={
        <div className="space-y-4 text-center">
          <p>
            No account?{" "}
            <Link href="/register" className="text-[#E0C68E] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
              Become a member
            </Link>
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 text-[10px] uppercase font-bold tracking-widest">
            <Link href="/partner?tab=login" className="text-[#C8A96A] hover:text-white transition-colors">
              Promoter Login
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/partner?tab=signup" className="text-[#C8A96A] hover:text-white transition-colors">
              Promoter Sign Up
            </Link>
            <span className="text-white/20">•</span>
            <Link href="/employee-login" className="text-[#C8A96A] hover:text-white transition-colors">
              Employee Login
            </Link>
          </div>
        </div>
      }
    >
      <LoginForm />
    </TropicaAuthShell>
  );
}
