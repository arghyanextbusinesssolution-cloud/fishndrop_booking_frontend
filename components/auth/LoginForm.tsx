"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Smartphone, Mail, Clock, Sparkles, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function LoginForm({ initialTab = "email" }: { initialTab?: "phone" | "email" }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"phone" | "email">(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const { login } = useAuth();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password) {
      toast.error("Please enter your password");
      return;
    }

    setEmailLoading(true);
    try {
      const data = await login({ email, password });
      toast.success("Welcome back!");
      const destination = data.user.role === "admin" ? "/admin" : "/user";
      window.location.assign(destination);
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password");
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Login Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1.5 bg-black/60 rounded-xl border border-[#C8A96A]/30">
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={cn(
            "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === "email"
              ? "bg-[#C8A96A] text-[#0d1612] shadow-md font-extrabold"
              : "text-white/60 hover:text-white"
          )}
        >
          <Mail className="w-4 h-4" /> Email &amp; Password
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("phone")}
          className={cn(
            "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 relative",
            activeTab === "phone"
              ? "bg-[#C8A96A] text-[#0d1612] shadow-md font-extrabold"
              : "text-white/60 hover:text-white"
          )}
        >
          <Smartphone className="w-4 h-4" /> Phone Login
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase font-black tracking-tighter">
            Soon
          </span>
        </button>
      </div>

      {/* TAB 1: Email & Password Login */}
      {activeTab === "email" && (
        <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in duration-300">
          <div>
            <Label htmlFor="email" className="text-white font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="bg-black/50 border-2 border-[#C8A96A]/40 text-white placeholder:text-white/30 text-base mt-1"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white font-semibold">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/50 border-2 border-[#C8A96A]/40 text-white pr-10 text-base"
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
            {emailLoading ? "Authenticating..." : "Sign In"}
          </Button>
        </form>
      )}

      {/* TAB 2: Phone OTP Login - Coming Soon */}
      {activeTab === "phone" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#16271f] via-[#0d1813] to-black border border-[#C8A96A]/40 p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center mx-auto text-[#C8A96A]">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>

            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#C8A96A]/20 text-[#E8CB8A] border border-[#C8A96A]/40">
                <Sparkles className="w-3.5 h-3.5" /> Coming Soon
              </span>
              <h3 className="font-headline italic text-2xl text-white pt-2">Phone SMS Login</h3>
              <p className="text-xs text-white/70 max-w-xs mx-auto leading-relaxed">
                Phone OTP authentication is currently coming soon. Please log in using your Email &amp; Password.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-wider hover:bg-[#D6B97A] transition-all shadow-md"
            >
              <span>Switch to Email Sign In</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
