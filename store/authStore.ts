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
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
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
    const token = Cookies.get("token") ?? null;
    const userRaw = localStorage.getItem("auth_user");
    const user = userRaw ? (JSON.parse(userRaw) as User) : null;
    set({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading: false,
    });
  },
  isAdmin: () => get().user?.role === "admin",
}));
