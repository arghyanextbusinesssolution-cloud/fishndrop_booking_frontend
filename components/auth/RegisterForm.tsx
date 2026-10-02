"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff } from "lucide-react";

export function RegisterForm() {
  const router = useRouter();
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [registering, setRegistering] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error("Please enter your full name");
      return;
    }
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters");
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
      toast.success("Account created successfully!");
      const destination = data.user?.role === "admin" ? "/admin" : "/user";
      router.push(destination);
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Please try again.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
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
          <Label htmlFor="phone" className="text-white/80 font-semibold">Phone Number (Optional)</Label>
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
    </div>
  );
}
