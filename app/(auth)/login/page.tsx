"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated) router.replace(user?.role === "admin" ? "/admin" : "/user");
  }, [isAuthenticated, router, user?.role]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="mb-5 text-2xl font-semibold">Login</h1>
        <LoginForm />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">No account? <Link href="/register" className="text-[var(--accent)]">Register</Link></p>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">Admin? <Link href="/admin-login" className="text-[var(--accent)]">Use admin login</Link></p>
      </div>
    </div>
  );
}
