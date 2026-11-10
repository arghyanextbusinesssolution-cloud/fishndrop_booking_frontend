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

    // Role-based route protection
    if (user?.role) {
      const role = user.role;

      // Admin routes: only admin/owner
      if (pathname.startsWith("/admin") && role !== "admin" && role !== "owner") {
        if (role === "staff") {
          router.replace("/employee");
        } else if (role === "promoter") {
          router.replace("/promoter");
        } else {
          router.replace("/user");
        }
      }

      // Employee routes: only staff
      if (pathname.startsWith("/employee") && role !== "staff") {
        if (role === "admin" || role === "owner") {
          router.replace("/admin");
        } else if (role === "promoter") {
          router.replace("/promoter");
        } else {
          router.replace("/user");
        }
      }

      // User routes: redirect admin/owner/staff to their dashboards
      if (pathname.startsWith("/user")) {
        if (role === "admin" || role === "owner") {
          router.replace("/admin");
        } else if (role === "staff") {
          router.replace("/employee");
        }
      }
    }
  }, [isAuthenticated, isLoading, mounted, pathname, router, user?.role]);

  // Show spinner while hydrating or auth is being checked
  if (!mounted || isLoading) return <LoadingSpinner fullPage message="Preparing your session..." />;
  if (!isAuthenticated) return null;
  return <>{children}</>;
}
