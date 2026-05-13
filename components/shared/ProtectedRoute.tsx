"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "./LoadingSpinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;
    
    // Only redirect if we're sure auth check is complete
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }

    // Only apply role redirect when we have full user data
    if (user?.role) {
      if (pathname.startsWith("/admin") && user.role !== "admin") {
        router.replace("/user");
      }
      if (pathname.startsWith("/user") && user.role === "admin") {
        router.replace("/admin");
      }
    }
  }, [isAuthenticated, isLoading, mounted, pathname, router, user?.role]);

  // Show spinner while hydrating or auth is being checked
  if (!mounted || isLoading) return <LoadingSpinner fullPage message="Preparing your session..." />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
