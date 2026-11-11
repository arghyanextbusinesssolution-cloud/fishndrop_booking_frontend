"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Smartphone, Mail, ArrowRight, Lock, Loader2, User as UserIcon } from "lucide-react";
import { PhoneVerificationModal } from "@/components/auth/PhoneVerificationModal";
import { TropicaDivider, tropicaField, tropicaGoldButton, tropicaInput, tropicaLabel } from "@/components/auth/TropicaAuthShell";

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (!email.includes("@") && email.trim().length < 5)) {
      toast.error("Please enter a valid email address or phone number");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setEmailLoading(true);
    try {
      const data = await login({ email, password });
      toast.success("Welcome back! Redirecting to dashboard...");
      const destination = data.user.role === "admin" || data.user.role === "owner" || data.user.role === "staff" ? "/admin" : data.user.role === "promoter" ? "/promoter" : "/user";
      try {
        router.replace(destination);
      } catch {
        // fallback
      }
      setTimeout(() => {
        window.location.assign(destination);
      }, 150);
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setEmailLoading(false);
    }
  };

  const handleOtpSuccess = (user: any) => {
    toast.success("Welcome back! Redirecting to dashboard...");
    const role = user?.role || useAuthStore.getState().user?.role || "user";
    const destination = role === "admin" || role === "owner" || role === "staff" ? "/admin" : role === "promoter" ? "/promoter" : "/user";
    try {
      router.replace(destination);
    } catch {
      // fallback
    }
    setTimeout(() => {
      window.location.assign(destination);
    }, 150);
  };

  return (
    <div className="space-y-5">
      {/* Method switcher: email active, phone opens the OTP modal */}
      <div className="grid grid-cols-2 gap-1.5 p-1 bg-black/50 rounded-xl border border-[#C8A96A]/25">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[11px] font-bold tracking-wider uppercase bg-gradient-to-b from-[#F1D9A0] to-[#C8A96A] text-[#1a1208] shadow-md shadow-[#C8A96A]/20"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email</span>
        </button>
        <button
          type="button"
          onClick={() => setIsPhoneModalOpen(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-[11px] font-bold tracking-wider uppercase text-white/70 hover:text-white hover:bg-white/5 transition-all cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span>Phone OTP</span>
        </button>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in duration-300">
        <div>
          <label htmlFor="email" className={tropicaLabel}>
            Email or phone
          </label>
          <div className={tropicaField}>
            <UserIcon className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="email"
              type="text"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={tropicaInput}
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className={tropicaLabel}>
            Password
          </label>
          <div className={tropicaField}>
            <Lock className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={tropicaInput}
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword((v) => !v)}
              className="text-white/45 hover:text-white cursor-pointer"
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={emailLoading || !email || !password} className={`${tropicaGoldButton} mt-2`}>
          {emailLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
          {emailLoading ? "Signing in..." : "Enter the lounge"}
        </button>
      </form>

      <TropicaDivider label="or" />

      <button
        type="button"
        onClick={() => setIsPhoneModalOpen(true)}
        className="w-full p-3.5 rounded-xl bg-black/40 border border-[#C8A96A]/30 hover:border-[#E0C68E] hover:bg-[#C8A96A]/[0.07] transition-all text-left group flex items-center justify-between cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/35 flex items-center justify-center shrink-0">
            <Smartphone className="w-5 h-5 text-[#E0C68E]" />
          </div>
          <div>
            <span className="text-[#E0C68E] text-sm font-bold group-hover:text-white transition-colors">Sign in with a text code</span>
            <p className="text-[11px] text-white/50 mt-0.5">We&apos;ll send a 4-digit code to your phone.</p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#C8A96A] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
      </button>

      <PhoneVerificationModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} onSuccess={handleOtpSuccess} />
    </div>
  );
}
