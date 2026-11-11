"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, UserCheck } from "lucide-react";
import { TropicaAuthShell, tropicaField, tropicaGoldButton, tropicaInput, tropicaLabel } from "@/components/auth/TropicaAuthShell";

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
    <TropicaAuthShell
      eyebrow="Staff & Operations"
      title="Employee sign in"
      subtitle="Verify promoter applications, check tickets and manage bookings."
      footer={
        <div className="flex items-center justify-between">
          <Link href="/login" className="hover:text-[#E0C68E] transition-colors">
            Customer sign in
          </Link>
          <Link href="/partner" className="hover:text-[#E0C68E] transition-colors">
            Promoter portal
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="employee-email" className={tropicaLabel}>
            Employee email
          </label>
          <div className={tropicaField}>
            <Mail className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="employee-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="staff@tropica.nyc"
              className={tropicaInput}
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-password" className={tropicaLabel}>
            Password
          </label>
          <div className={tropicaField}>
            <Lock className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="employee-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter employee password"
              className={tropicaInput}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword(!showPassword)}
              className="text-white/45 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={isLoading} className={`${tropicaGoldButton} mt-2`}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
          {isLoading ? "Authenticating..." : "Sign in to operations"}
        </button>
      </form>

      <div className="p-4 rounded-2xl bg-black/35 border border-[#C8A96A]/15 space-y-1.5 text-xs text-white/55">
        <div className="flex items-center gap-2 font-bold text-white/80">
          <UserCheck className="w-4 h-4 text-[#C8A96A]" />
          <span>Need account access?</span>
        </div>
        <p className="leading-relaxed">
          Staff accounts are created by administrators in Employee Management. Check your inbox for credentials or contact an administrator.
        </p>
      </div>
    </TropicaAuthShell>
  );
}
