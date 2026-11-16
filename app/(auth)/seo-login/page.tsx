"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { TropicaAuthShell } from "@/components/auth/TropicaAuthShell";
import { useAuthStore } from "@/store/authStore";

/** /seo-login — sign-in for the SEO team. After login they land in /seo (blog manager only). */
export default function SeoLoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(user?.role === "seo" || user?.role === "admin" || user?.role === "owner" ? "/seo" : "/user");
    }
  }, [isAuthenticated, router, user?.role]);

  return (
    <TropicaAuthShell eyebrow="SEO Team" title="SEO sign in" subtitle="Sign in to write and publish Tropica blog posts.">
      <LoginForm />
    </TropicaAuthShell>
  );
}
