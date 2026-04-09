"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { useAuthStore } from "@/store/authStore";

export default function AdminLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === "admin" ? "/admin" : "/user");
    }
  }, [isAuthenticated, router, user?.role]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="mb-2 text-2xl font-semibold">Admin Login</h1>
        <p className="mb-5 text-sm text-[var(--text-secondary)]">Use your admin credentials to continue.</p>
        <LoginForm />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">
          Need an account?{" "}
          <Link href="/register" className="text-[var(--accent)]">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
