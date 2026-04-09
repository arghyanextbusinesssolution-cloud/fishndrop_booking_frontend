"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { LoadingSpinner } from "./LoadingSpinner";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (pathname.startsWith("/admin") && user?.role !== "admin") router.replace("/user");
    if (pathname.startsWith("/user") && user?.role !== "user") router.replace("/admin");
  }, [isAuthenticated, isLoading, pathname, router, user?.role]);

  if (isLoading) return <LoadingSpinner fullPage message="Checking session..." />;
  if (!isAuthenticated) return <LoadingSpinner fullPage message="Redirecting..." />;
  return <>{children}</>;
}
