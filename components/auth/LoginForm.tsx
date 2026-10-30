"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Eye, EyeOff, Smartphone, Mail, ArrowRight, ShieldCheck } from "lucide-react";
import { PhoneVerificationModal } from "@/components/auth/PhoneVerificationModal";

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
      const destination = data.user.role === "admin" ? "/admin" : "/user";
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
    const destination = role === "admin" ? "/admin" : "/user";
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
    <div className="space-y-6">
      {/* Top Quick Action Bar: Email Login active + Direct Phone OTP Modal Trigger */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-black/60 rounded-xl border border-[#C8A96A]/30">
        <button
          type="button"
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider uppercase bg-[#C8A96A] text-[#0d1612] shadow-md shadow-[#C8A96A]/20 transition-all"
        >
          <Mail className="w-3.5 h-3.5" />
          <span>Email &amp; Password</span>
        </button>

        <button
          type="button"
          onClick={() => setIsPhoneModalOpen(true)}
          className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-xs font-bold tracking-wider uppercase text-white/80 hover:text-white hover:bg-white/10 border border-transparent hover:border-[#C8A96A]/40 transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span>Phone SMS OTP</span>
        </button>
      </div>

      {/* Primary Login Form */}
      <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in duration-300">
        <div>
          <Label htmlFor="email" className="text-white font-semibold">
            Email Address or Phone Number
          </Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com or +15550000000"
            className="bg-black/50 border-2 border-[#C8A96A]/40 text-white placeholder:text-white/30 text-base mt-1 focus:border-[#C8A96A]"
          />
        </div>

        <div>
          <Label htmlFor="password" className="text-white font-semibold">
            Password
          </Label>
          <div className="relative mt-1">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-black/50 border-2 border-[#C8A96A]/40 text-white pr-10 text-base focus:border-[#C8A96A]"
            />
            <button
              type="button"
              aria-label="Toggle password visibility"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          isLoading={emailLoading}
          disabled={emailLoading || !email || !password}
          className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase py-6 shadow-xl shadow-[#C8A96A]/20 transition-all duration-300 mt-2"
        >
          {emailLoading ? "Authenticating..." : "Sign In with Password"}
        </Button>
      </form>

      {/* Alternative Access Divider */}
      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-[#0b1410] px-3 text-white/50 font-semibold tracking-wider">
            Or Use Instant SMS
          </span>
        </div>
      </div>

      {/* Direct Phone SMS Modal Launcher */}
      <button
        type="button"
        onClick={() => setIsPhoneModalOpen(true)}
        className="w-full p-4 rounded-xl bg-gradient-to-r from-black/60 to-black/40 border border-[#C8A96A]/40 hover:border-[#C8A96A] hover:bg-[#C8A96A]/10 transition-all duration-200 text-left group flex items-center justify-between shadow-lg shadow-black/40"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#E8CB8A] group-hover:scale-105 transition-transform shrink-0">
            <Smartphone className="w-5 h-5 text-[#C8A96A]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#E8CB8A] text-sm font-bold tracking-wide group-hover:text-white transition-colors">
                Sign In with Phone SMS
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Instant OTP
              </span>
            </div>
            <p className="text-[11px] text-white/60 font-light mt-0.5">
              Enter 4-digit code sent to your phone to redirect directly to dashboard.
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-[#C8A96A] group-hover:translate-x-1 transition-transform shrink-0 ml-2" />
      </button>

      {/* Phone Verification Modal */}
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={handleOtpSuccess}
      />
    </div>
  );
}
