"use client";

import Cookies from "js-cookie";
import { create } from "zustand";
import { User } from "@/types";

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  initAuth: () => void;
  isAdmin: () => boolean;
  fetchMe: () => Promise<void>;
}

const getInitialState = () => {
  if (typeof window === "undefined") {
    return {
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,
    };
  }

  const token = Cookies.get("token") ?? null;
  const role = Cookies.get("user_role") ?? null;
  const userRaw = localStorage.getItem("auth_user");
  
  console.log("[AuthStore] Initializing...", {
    hasToken: Boolean(token),
    hasRole: Boolean(role),
    hasUserInStorage: Boolean(userRaw)
  });

  if (token) {
    console.log("[AuthStore] Token detected:", token.substring(0, 10) + "...");
  }

  let user: User | null = null;
  try {
    user = userRaw ? JSON.parse(userRaw) : null;
  } catch (e) {
    console.error("Failed to parse auth_user from localStorage", e);
  }

  // If we have a token and role cookie, but no user object, create a partial user
  if (token && role && !user) {
    user = { role } as User;
  }

  return {
    user,
    token,
    isAuthenticated: Boolean(token),
    isLoading: false,
  };
};

export const useAuthStore = create<AuthState>((set, get) => ({
  ...getInitialState(),
  setAuth: (user, token) => {
    Cookies.set("token", token, { expires: 7, path: "/" });
    Cookies.set("user_role", user.role, { expires: 7, path: "/" });
    localStorage.setItem("auth_user", JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  clearAuth: () => {
    Cookies.remove("token", { path: "/" });
    Cookies.remove("user_role", { path: "/" });
    localStorage.removeItem("auth_user");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  initAuth: () => {
    const state = getInitialState();
    set(state);
    if (state.isAuthenticated && !state.user?.name) {
      get().fetchMe();
    }
  },
  isAdmin: () => get().user?.role === "admin",
  fetchMe: async () => {
    // Only import api here to avoid circular dependency
    const { default: api } = await import("@/lib/axios");
    try {
      const response = await api.get("/auth/me");
      if (response.data.success) {
        const user = response.data.user;
        localStorage.setItem("auth_user", JSON.stringify(user));
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error("[AuthStore] fetchMe failed", error);
    }
  },
}));
