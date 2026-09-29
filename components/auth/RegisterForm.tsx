"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-[#C8A96A]" ? null : "react-hot-toast";
import toastHot from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Mail, Smartphone, Eye, EyeOff, Sparkles, Clock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  // Active Tab: Default is "email"
  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");

  // Form Fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  
  // Loading state
  const [registering, setRegistering] = useState(false);

  // Handle direct Email + Password Signup
  const handleEmailRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toastHot.error("Please enter your full name");
      return;
    }
    if (!email || !email.includes("@")) {
      toastHot.error("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      toastHot.error("Password must be at least 6 characters");
      return;
    }

    setRegistering(true);
    try {
      const data = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined
      });
      toastHot.success("Account created successfully!");
      const destination = data.user?.role === "admin" ? "/admin" : "/user";
      router.push(destination);
    } catch (err: any) {
      toastHot.error(err.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Registration Mode Switcher Toggle Tabs */}
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

      {/* TAB 1: Email & Password Sign Up (Default) */}
      {activeTab === "email" && (
        <form onSubmit={handleEmailRegister} className="space-y-4 animate-in fade-in duration-300">
          <div>
            <Label htmlFor="name" className="text-white/80 font-semibold">Full Name</Label>
            <Input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-black/40 border-[#C8A96A]/30 text-white mt-1 text-base focus:border-[#C8A96A]"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white/80 font-semibold">Email Address</Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="bg-black/40 border-[#C8A96A]/30 text-white mt-1 text-base focus:border-[#C8A96A]"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-white/80 font-semibold">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-black/40 border-[#C8A96A]/30 text-white pr-10 text-base focus:border-[#C8A96A]"
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

          <div>
            <Label htmlFor="phone" className="text-white/80 font-semibold">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1 (555) 000-0000"
              className="bg-black/40 border-[#C8A96A]/30 text-white mt-1 text-base focus:border-[#C8A96A]"
            />
          </div>

          <Button
            type="submit"
            isLoading={registering}
            disabled={registering || !name || !email || !password}
            className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase py-6 shadow-xl shadow-[#C8A96A]/20 transition-all duration-300 mt-2"
          >
            {registering ? "Creating Account..." : "Create Account & Sign In"}
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
                Phone number SMS verification login is currently undergoing upgrade and will be available soon. Please use Email &amp; Password to sign up.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab("email")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#C8A96A] text-[#0d1612] font-black text-xs uppercase tracking-wider hover:bg-[#D6B97A] transition-all shadow-md"
            >
              <span>Switch to Email Sign Up</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
