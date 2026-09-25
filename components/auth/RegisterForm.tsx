"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";

export function RegisterForm() {
  const router = useRouter();
  const { sendOTP, verifyOTP } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || name.trim().length < 2) {
      toast.error("Please enter your name");
      return;
    }
    if (!phone || phone.trim().length < 8) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setSendingOtp(true);
    try {
      await sendOTP(phone);
      setOtpSent(true);
      toast.success("Verification code sent via SMS!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send SMS OTP");
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.trim().length < 6) {
      toast.error("Please enter the 6-digit verification code");
      return;
    }

    setVerifyingOtp(true);
    try {
      const data = await verifyOTP(phone, otp, name, email);
      toast.success("Account created and verified successfully!");
      const destination = data.user.role === "admin" ? "/admin" : "/user";
      router.push(destination);
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setVerifyingOtp(false);
    }
  };

  return (
    <div className="space-y-4">
      {!otpSent ? (
        <form onSubmit={handleSendOTP} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white/80">Full Name</Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="bg-black/30 border-[#C8A96A]/30 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-white/80">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
              className="bg-black/30 border-[#C8A96A]/30 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-white/80">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 917679672137 or +1 (555) 000-0000"
              className="bg-black/30 border-[#C8A96A]/30 text-white mt-1"
            />
            <p className="mt-1.5 text-xs text-white/50">
              We'll send a code to verify your phone via SMS. No password needed.
            </p>
          </div>

          <Button
            type="submit"
            isLoading={sendingOtp}
            disabled={sendingOtp || !phone || !name}
            className="w-full bg-[#C8A96A] text-white hover:bg-[#b59858] transition-all duration-300 font-label text-[11px] tracking-[0.2em] uppercase font-bold py-6 shadow-lg shadow-[#C8A96A]/20"
          >
            {sendingOtp ? "Sending SMS..." : "Send Verification Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleVerifyAndRegister} className="space-y-4 animate-in fade-in duration-300">
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label htmlFor="otp" className="text-white/80">Enter 6-Digit Verification Code</Label>
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
              className="bg-black/30 border-[#C8A96A]/30 text-white tracking-widest font-mono text-center text-xl"
            />
            <p className="mt-1 text-xs text-white/50">
              Sent via SMS to <span className="text-white">{phone}</span>.
            </p>
          </div>

          <Button
            type="submit"
            isLoading={verifyingOtp}
            disabled={verifyingOtp || otp.length < 6}
            className="w-full bg-[#C8A96A] text-white hover:bg-[#b59858] transition-all duration-300 font-label text-[11px] tracking-[0.2em] uppercase font-bold py-6 shadow-lg shadow-[#C8A96A]/20"
          >
            {verifyingOtp ? "Verifying..." : "Verify & Complete Registration"}
          </Button>
        </form>
      )}
    </div>
  );
}
