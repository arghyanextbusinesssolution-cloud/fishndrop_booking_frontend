"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { AuthResponse, ApiError } from "@/types";
import { useAuthStore } from "@/store/authStore";

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { setAuth, clearAuth } = useAuthStore();

  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", { email, password });
      setAuth(data.user, data.token);
      return data;
    } catch (err) {
      const apiError = err as { response?: { data?: ApiError } };
      setError(apiError.response?.data?.message ?? "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, phone, password }: { name: string; email: string; phone?: string; password: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", { name, email, phone, password });
      if (data.token) {
        setAuth(data.user, data.token);
      }
      return data;
    } catch (err: any) {
      const data = err.response?.data;
      let message = data?.message || "Registration failed";

      if (data?.errors && Array.isArray(data.errors)) {
        message = data.errors.map((e: any) => e.message).join(". ");
      }
      
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { login, register, logout, loading, error };
}
