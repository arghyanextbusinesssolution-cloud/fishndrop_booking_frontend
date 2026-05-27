import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <footer className="w-full py-16 flex flex-col items-center gap-8 mt-auto border-t border-[#C8A96A]/10 bg-[#0F3D2E]">
      <Link href="/" className="relative w-56 h-20 hover:brightness-110 transition-all">
        <Image
          src="/tropica-logo.png"
          alt="Tropica Sanctuary"
          fill
          className="object-contain opacity-60 hover:opacity-100 transition-opacity"
        />
      </Link>

      <div className="flex flex-wrap justify-center gap-10">
        <Link
          href="#"
          className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A]/40 hover:text-[#C8A96A] transition-colors font-bold"
        >
          Privacy Policy
        </Link>
        <Link
          href="/terms-and-conditions"
          className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A]/40 hover:text-[#C8A96A] transition-colors font-bold"
        >
          Terms of Service
        </Link>
        <Link
          href="#"
          className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A]/40 hover:text-[#C8A96A] transition-colors font-bold"
        >
          Sustainability
        </Link>
      </div>
      <p className="font-label text-[10px] uppercase tracking-[0.25em] text-[#C8A96A]/30 font-bold text-center">
        © 2024 Tropica Sanctuary. All rights reserved.
      </p>
    </footer>
  );
};
