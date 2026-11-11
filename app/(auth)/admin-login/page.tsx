"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { TropicaAuthShell } from "@/components/auth/TropicaAuthShell";
import { useAuthStore } from "@/store/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === "admin" || user?.role === "owner" || user?.role === "staff" ? "/admin" : user?.role === "promoter" ? "/promoter" : "/user");
    }
  }, [isAuthenticated, router, user?.role]);

  return (
    <TropicaAuthShell
      eyebrow="Management"
      title="Admin sign in"
      subtitle="Use your admin credentials to continue."
      footer={
        <p className="text-center">
          Need an account?{" "}
          <Link href="/register" className="text-[#E0C68E] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
            Register
          </Link>
        </p>
      }
    >
      <LoginForm />
    </TropicaAuthShell>
  );
}
