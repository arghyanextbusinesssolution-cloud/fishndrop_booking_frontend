"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  UserCheck,
  Building
} from "lucide-react";

export default function EmployeeLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // If already authenticated as staff or admin, route to their dashboard
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "admin" || user?.role === "owner") {
        router.replace("/admin");
      } else if (user?.role === "staff") {
        router.replace("/employee");
      }
    }
  }, [isAuthenticated, user?.role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter a valid employee email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    try {
      setIsLoading(true);
      const data = await login({ email: email.trim(), password });

      const role = data.user?.role;
      if (role === "staff") {
        toast.success(`Welcome back, ${data.user?.name || "Employee"}!`);
        setTimeout(() => {
          window.location.assign("/employee");
        }, 150);
      } else if (role === "admin" || role === "owner") {
        toast.success(`Welcome back, ${data.user?.name || "Admin"}!`);
        setTimeout(() => {
          window.location.assign("/admin");
        }, 150);
      } else {
        // Standard user or promoter attempted login at employee portal
        toast.success("Login successful. Redirecting to your dashboard...");
        const destination = role === "promoter" ? "/promoter" : "/user";
        setTimeout(() => {
          window.location.assign(destination);
        }, 150);
      }
    } catch (err: any) {
      toast.error(err.message || "Invalid employee email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B09] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-b from-[#C8A96A]/15 via-emerald-950/20 to-transparent blur-3xl pointer-events-none -z-0" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center space-y-3 relative z-10">
        <Link href="/" className="inline-block font-headline text-3xl sm:text-4xl italic text-[#C8A96A] hover:scale-105 transition-transform">
          Tropica NYC
        </Link>
        <div className="inline-flex items-center gap-2 bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-3.5 py-1 rounded-full text-[#E8CB8A]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span className="text-[10px] uppercase font-bold tracking-[0.2em] font-label">
            Staff &amp; Operations Portal
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-headline italic font-bold tracking-tight text-white">
          Employee Sign In
        </h1>
        <p className="text-xs text-white/60 max-w-sm mx-auto font-body">
          Enter your employee credentials to verify promoter applications, check tickets, and manage bookings.
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-[#0e1612]/95 border border-white/15 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                Employee Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@tropica.nyc"
                  className="w-full pl-10 pr-4 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8A96A] transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-white/70 block">
                  Password
                </label>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-white/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter employee password"
                  className="w-full pl-10 pr-10 py-3 bg-black/40 border border-white/15 rounded-xl text-white text-sm focus:outline-none focus:border-[#C8A96A] transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A] text-[#070B09] rounded-xl font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.99] transition-all shadow-lg shadow-[#C8A96A]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>{isLoading ? "Authenticating..." : "Sign In to Operations"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Help Box */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2 text-xs text-white/60">
            <div className="flex items-center gap-2 font-bold text-white/80">
              <UserCheck className="w-4 h-4 text-[#C8A96A]" />
              <span>Need account access?</span>
            </div>
            <p className="leading-relaxed">
              Staff accounts are created by administrators via the Employee Management panel. Check your inbox for credentials or contact an administrator.
            </p>
          </div>

          {/* Alternative links */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
            <Link href="/login" className="hover:text-[#C8A96A] transition-colors">
              Customer Sign In
            </Link>
            <Link href="/partner" className="hover:text-[#C8A96A] transition-colors">
              Promoter Portal
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

