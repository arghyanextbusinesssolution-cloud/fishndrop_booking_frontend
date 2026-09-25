"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Smartphone, Mail, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const formatUSPhoneNumber = (value: string): string => {
  if (!value) return "";
  const cleaned = value.replace(/\D/g, "");
  const match = cleaned.length === 11 && cleaned.startsWith("1") ? cleaned.slice(1) : cleaned.slice(0, 10);
  
  const len = match.length;
  if (len === 0) return "";
  if (len < 4) return `(${match}`;
  if (len < 7) return `(${match.slice(0, 3)}) ${match.slice(3)}`;
  return `(${match.slice(0, 3)}) ${match.slice(3, 6)}-${match.slice(6)}`;
};

const COUNTRY_CODES = [
  { code: "+1", flag: "🇺🇸", label: "US (+1)" },
  { code: "+91", flag: "🇮🇳", label: "IN (+91)" },
  { code: "+44", flag: "🇬🇧", label: "UK (+44)" },
  { code: "+1", flag: "🇨🇦", label: "CA (+1)" },
  { code: "+61", flag: "🇦🇺", label: "AU (+61)" },
  { code: "+52", flag: "🇲🇽", label: "MX (+52)" },
  { code: "+49", flag: "🇩🇪", label: "DE (+49)" },
  { code: "+33", flag: "🇫🇷", label: "FR (+33)" },
];

export function LoginForm({ initialTab = "phone" }: { initialTab?: "phone" | "email" }) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"phone" | "email">(initialTab);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Phone OTP state
  const [countryCode, setCountryCode] = useState("+1");
  const [phone, setPhone] = useState("");
  const [submittedPhone, setSubmittedPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  // Admin / Email login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);

  const { sendOTP, verifyOTP, login } = useAuth();

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawDigits = phone.replace(/\D/g, "");
    if (!rawDigits || rawDigits.length < 7) {
      toast.error("Please enter a valid phone number");
      return;
    }

    const fullPhone = phone.startsWith("+") ? phone : `${countryCode}${rawDigits}`;

    setSendingOtp(true);
    try {
      const res = await sendOTP(fullPhone);
      setSubmittedPhone(fullPhone);
      setOtpSent(true);
      if (res?.devOtp) {
        toast(`Dev Code: ${res.devOtp}`, { icon: "🔑", duration: 8000 });
      }
      toast.success("Verification code sent!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const data = await verifyOTP(submittedPhone || phone, otp);
      toast.success("Welcome back!");
      const destination = data.user.role === "admin" ? "/admin" : "/user";
      window.location.assign(destination);
    } catch (err: any) {
      toast.error(err.message || "Invalid verification code");
    } finally {
      setVerifyingOtp(false);
    }
  };

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
          onClick={() => setActiveTab("phone")}
          className={cn(
            "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === "phone"
              ? "bg-[#C8A96A] text-[#0d1612] shadow-md"
              : "text-white/60 hover:text-white"
          )}
        >
          <Smartphone className="w-4 h-4" /> Phone OTP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={cn(
            "py-2.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2",
            activeTab === "email"
              ? "bg-[#C8A96A] text-[#0d1612] shadow-md"
              : "text-white/60 hover:text-white"
          )}
        >
          <Mail className="w-4 h-4" /> Admin Email
        </button>
      </div>

      {/* TAB 1: Phone SMS OTP Login */}
      {activeTab === "phone" && (
        <div className="space-y-4 animate-in fade-in duration-300">
          {!otpSent ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div>
                <Label htmlFor="phone" className="text-white font-semibold">Phone Number</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    disabled={sendingOtp}
                    className="bg-black/60 border-2 border-[#C8A96A]/40 text-[#C8A96A] font-bold text-sm rounded-lg px-2 py-2 focus:outline-none focus:border-[#C8A96A] cursor-pointer"
                  >
                    {COUNTRY_CODES.map((item, i) => (
                      <option key={i} value={item.code} className="bg-[#0d1612] text-white">
                        {item.flag} {item.code}
                      </option>
                    ))}
                  </select>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={countryCode === "+1" ? "(347) 455-3121" : "6295666768"}
                    className="flex-1 bg-black/50 border-2 border-[#C8A96A]/40 text-white placeholder:text-white/30 text-base"
                  />
                </div>
                <p className="mt-1.5 text-xs text-white/60">
                  Passwordless login via SMS verification code.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={sendingOtp}
                disabled={sendingOtp || !phone}
                className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase py-6 shadow-xl shadow-[#C8A96A]/20 transition-all duration-300"
              >
                {sendingOtp ? "Sending SMS..." : "Send Verification Code"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <Label htmlFor="otp" className="text-white font-semibold">Enter 6-Digit Verification Code</Label>
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="text-xs text-[#C8A96A] hover:underline"
                  >
                    Change Phone
                  </button>
                </div>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                  className="bg-black/50 border-2 border-[#C8A96A]/40 text-white tracking-widest font-mono text-center text-2xl py-3"
                />
                <p className="mt-1.5 text-xs text-white/60">
                  SMS sent to <span className="text-white font-bold">{submittedPhone || phone}</span>.
                </p>
              </div>

              <Button
                type="submit"
                isLoading={verifyingOtp}
                disabled={verifyingOtp || otp.length < 6}
                className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase py-6 shadow-xl shadow-[#C8A96A]/20 transition-all duration-300"
              >
                {verifyingOtp ? "Verifying..." : "Verify & Sign In"}
              </Button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: Admin Email & Password Login */}
      {activeTab === "email" && (
        <form onSubmit={handleEmailLogin} className="space-y-4 animate-in fade-in duration-300">
          <div>
            <Label htmlFor="email" className="text-white font-semibold">Admin Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@tropica.com"
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
            className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase py-6 shadow-xl shadow-[#C8A96A]/20 transition-all duration-300"
          >
            {emailLoading ? "Authenticating..." : "Admin Sign In"}
          </Button>
        </form>
      )}
    </div>
  );
}
