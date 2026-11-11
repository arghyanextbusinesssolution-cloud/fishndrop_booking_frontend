import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { TropicaAuthShell } from "@/components/auth/TropicaAuthShell";

export default function RegisterPage() {
  return (
    <TropicaAuthShell
      eyebrow="Become a member"
      title="Join the guest list"
      subtitle="Create your free Tropica membership to book tables, host parties and keep your passes in one place."
      footer={
        <div className="space-y-3 text-center">
          <p>
            Already a member?{" "}
            <Link href="/login" className="text-[#E0C68E] hover:text-white transition-colors uppercase tracking-widest text-[10px] font-bold">
              Sign in
            </Link>
          </p>
          <p className="text-[10px] text-white/35 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Your details are never shared outside Tropica.
          </p>
        </div>
      }
    >
      <RegisterForm />
    </TropicaAuthShell>
  );
}
