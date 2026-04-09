import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
        <h1 className="mb-5 text-2xl font-semibold">Register</h1>
        <RegisterForm />
        <p className="mt-4 text-sm text-[var(--text-secondary)]">Already have an account? <Link href="/login" className="text-[var(--accent)]">Login</Link></p>
      </div>
    </div>
  );
}
