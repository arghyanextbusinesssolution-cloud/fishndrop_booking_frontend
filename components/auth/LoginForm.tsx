"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const { login } = useAuth();

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
      <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in duration-300">
        <div>
          <Label htmlFor="email" className="text-white font-semibold">Email Address or Phone Number</Label>
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
          <Label htmlFor="password" className="text-white font-semibold">Password</Label>
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
          {emailLoading ? "Authenticating..." : "Sign In"}
        </Button>
      </form>
    </div>
  );
}
