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

  const sendOTP = async (phone: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/send-otp", { phone });
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || "Failed to send OTP via SMS";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async (phone: string, otp: string, name?: string, email?: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/auth/verify-otp", { phone, otp, name, email });
      if (data.token && data.user) {
        setAuth(data.user, data.token);
      }
      return data;
    } catch (err: any) {
      const msg = err.response?.data?.message || "OTP verification failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: { email?: string; password?: string; phone?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>("/auth/login", credentials);
      if (data.token && data.user) {
        setAuth(data.user, data.token);
      }
      return data;
    } catch (err: any) {
      const apiError = err as { response?: { data?: ApiError } };
      const msg = apiError.response?.data?.message ?? "Login failed";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, phone, password }: { name: string; email?: string; phone?: string; password?: string }) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>("/auth/register", { name, email, phone, password });
      if (data.token && data.user) {
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
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    clearAuth();
    router.push("/login");
  };

  return { sendOTP, verifyOTP, login, register, logout, loading, error };
}
