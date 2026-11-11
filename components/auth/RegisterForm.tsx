"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle2, Eye, EyeOff, Loader2, Lock, Mail, Smartphone, User as UserIcon } from "lucide-react";
import { tropicaField, tropicaGoldButton, tropicaInput, tropicaLabel } from "@/components/auth/TropicaAuthShell";

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
    <form onSubmit={handleRegister} className="space-y-4 animate-in fade-in duration-300">
      <div>
        <label htmlFor="name" className={tropicaLabel}>Full name</label>
        <div className={tropicaField}>
          <UserIcon className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
          <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className={tropicaInput} />
        </div>
      </div>

      <div>
        <label htmlFor="email" className={tropicaLabel}>Email</label>
        <div className={tropicaField}>
          <Mail className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={tropicaInput} />
        </div>
      </div>

      <div>
        <label htmlFor="password" className={tropicaLabel}>Password</label>
        <div className={tropicaField}>
          <Lock className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
            className={tropicaInput}
          />
          <button type="button" aria-label="Toggle password visibility" onClick={() => setShowPassword((v) => !v)} className="text-white/45 hover:text-white cursor-pointer">
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>
      </div>

      <div>
        <label htmlFor="phone" className={tropicaLabel}>
          Phone <span className="normal-case tracking-normal font-medium text-white/35">(optional)</span>
        </label>
        <div className={tropicaField}>
          <Smartphone className="w-4 h-4 text-[#C8A96A]/70 shrink-0" />
          <input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" className={tropicaInput} />
        </div>
      </div>

      <button type="submit" disabled={registering || !name || !email || !password} className={`${tropicaGoldButton} mt-2`}>
        {registering ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        {registering ? "Creating account..." : "Join Tropica"}
      </button>
    </form>
  );
}
