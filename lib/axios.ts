"use client";

import axios from "axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import { useAuthStore } from "@/store/authStore";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = Cookies.get("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[API OK]", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[API ERROR]", {
        method: error.config?.method?.toUpperCase(),
        url: error.config?.url,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
    }

    if (!error.response) {
      if (error.code === "ECONNABORTED") {
        toast.error("Request timed out. Please try again.");
      } else {
        toast.error("Network error. Check your connection.");
      }
      return Promise.reject(error);
    }

    if (error.response.status === 401) {
      Cookies.remove("token", { path: "/" });
      Cookies.remove("user_role", { path: "/" });
      useAuthStore.getState().clearAuth();
      if (typeof window !== "undefined") window.location.href = "/login";
    }

    if (error.response.status === 503) {
      const data = error.response.data as { message?: string; code?: string } | undefined;
      toast.error(data?.message || "Service unavailable. Try again in a moment.");
    }

    return Promise.reject(error);
  }
);

export default api;
