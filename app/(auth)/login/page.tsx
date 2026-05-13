"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { LoginForm } from "@/components/auth/LoginForm";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  
  useEffect(() => {
    if (isAuthenticated) router.replace(user?.role === "admin" ? "/admin" : "/user");
  }, [isAuthenticated, router, user?.role]);
  
  return (
    <div className="flex min-h-screen items-center justify-center px-4" style={{ backgroundColor: '#0F3D2E' }}>
      <div className="w-full max-w-md rounded-2xl border border-[#C8A96A]/20 bg-black/40 backdrop-blur-xl p-8 shadow-2xl">
        <Link href="/" className="mb-10 flex justify-center">
          <div className="relative w-64 h-24 hover:scale-105 transition-all duration-300">
            <Image
              src="/tropica-logo.png"
              alt="Tropica Sanctuary"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>
        <h1 className="mb-6 text-center font-headline text-3xl italic text-white">Guest Login</h1>
        <LoginForm />
        <div className="mt-8 text-center space-y-3 font-body text-sm text-white/60">
          <p>
            No account?{" "}
            <Link href="/register" className="text-[#C8A96A] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
              Register
            </Link>
          </p>
          {/* <p>
            Admin?{" "}
            <Link href="/admin-login" className="text-[#C8A96A] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
              Use admin login
            </Link>
          </p> */}
        </div>
      </div>
    </div>
  );
}
