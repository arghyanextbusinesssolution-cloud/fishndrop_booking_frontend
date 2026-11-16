"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, UserCheck } from "lucide-react";
import { TropicaAuthShell, tropicaField, tropicaGoldButton, tropicaInput, tropicaLabel } from "@/components/auth/TropicaAuthShell";

export default function PartnerLoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { isAuthenticated, user } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Already signed in as a venue owner → straight to the portal
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === "venue_owner") {
        router.replace("/partner-portal");
      }
    }
  }, [isAuthenticated, user?.role, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim() || !email.includes("@")) {
      toast.error("Please enter the email your login was sent to");
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
      if (role === "venue_owner") {
        toast.success(`Welcome, ${data.user?.name || "partner"}!`);
        setTimeout(() => window.location.assign("/partner-portal"), 150);
      } else {
        // Not a venue owner — send them to their own dashboard
        toast.success("Login successful. Redirecting to your dashboard...");
        const destination =
          role === "admin" || role === "owner" ? "/admin" : role === "staff" ? "/employee" : role === "promoter" ? "/promoter" : "/user";
        setTimeout(() => window.location.assign(destination), 150);
      }
    } catch (err: unknown) {
      toast.error((err as Error)?.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TropicaAuthShell
      eyebrow="Partner Venues"
      title="Venue partner sign in"
      subtitle="Confirm booking requests, get paid and manage your venue on Tropica NYC."
      footer={
        <div className="flex items-center justify-between">
          <Link href="/login" className="hover:text-[#E0C68E] transition-colors">
            Customer sign in
          </Link>
          <Link href="/employee-login" className="hover:text-[#E0C68E] transition-colors">
            Tropica staff
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="partner-email" className={tropicaLabel}>
            Email
          </label>
          <div className={tropicaField}>
            <Mail className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="partner-email"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@yourvenue.com"
              className={tropicaInput}
            />
          </div>
        </div>

        <div>
          <label htmlFor="partner-password" className={tropicaLabel}>
            Password
          </label>
          <div className={tropicaField}>
            <Lock className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="partner-password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password from your welcome email"
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
          {isLoading ? "Authenticating..." : "Sign in"}
        </button>
      </form>

      <div className="p-4 rounded-2xl bg-black/35 border border-[#C8A96A]/15 space-y-1.5 text-xs text-white/55">
        <div className="flex items-center gap-2 font-bold text-white/80">
          <UserCheck className="w-4 h-4 text-[#C8A96A]" />
          <span>Need account access?</span>
        </div>
        <p className="leading-relaxed">
          Partner logins are created by the Tropica team. Check your welcome email for your details, or contact Tropica to reset your password.
        </p>
      </div>
    </TropicaAuthShell>
  );
}
