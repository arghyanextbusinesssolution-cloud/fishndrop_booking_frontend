import Link from "next/link";
import Image from "next/image";

export const Footer = () => {
  return (
    <div className="flex flex-col w-full">
      {/* CTA Section */}
      <section className="w-full py-20 px-4 flex flex-col items-center text-center bg-[#0F3D2E] border-b border-[#C8A96A]/10">
        <h2 className="font-headline text-3xl md:text-5xl text-[#C8A96A] mb-4">
          Reserve Your Private Lounge Experience
        </h2>
        <p className="font-body text-[#C8A96A]/80 text-sm md:text-base mb-10 max-w-2xl italic">
          Perfect for intimate dinners, celebrations, and unforgettable evenings.
        </p>
        <Link
          href="/book-venue"
          className="bg-[#C8A96A] text-[#0F3D2E] px-10 py-4 rounded-lg font-label text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all shadow-lg shadow-[#C8A96A]/20"
        >
          RESERVE NOW
        </Link>
      </section>

      {/* Footer Section */}
      <footer className="w-full py-16 px-4 md:px-12 bg-[#0F2D24] text-[#C8A96A]">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🌴</span>
              <span className="font-headline text-2xl uppercase tracking-wider group-hover:brightness-110 transition-all">TROPICA</span>
            </Link>
            <p className="font-body text-sm text-[#C8A96A]/70 leading-relaxed max-w-xs italic">
              A private garden dining and lounge experience crafted for beautiful moments.
            </p>
          </div>

          {/* Quick Links Column */}
          <div className="space-y-6">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-[#C8A96A]/60">Quick Links</h3>
            <div className="flex flex-col gap-3">
              <Link href="/experience" className="text-sm hover:text-white transition-colors">Experience</Link>
              <Link href="/" className="text-sm hover:text-white transition-colors">Reservation</Link>
              <Link href="/gallery" className="text-sm hover:text-white transition-colors">Gallery</Link>
            </div>
          </div>

          {/* Contact Column */}
          <div className="space-y-6">
            <h3 className="font-label text-xs uppercase tracking-[0.2em] font-bold text-[#C8A96A]/60">Contact</h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm flex items-center gap-2">
                <span className="opacity-60">Email:</span>
                <a href="mailto:Bookings@tropica.nyc" className="hover:text-white transition-colors font-semibold">Bookings@tropica.nyc</a>
              </p>
              <p className="text-sm flex items-center gap-2">
                <span className="opacity-60">Phone:</span>
                <a href="tel:+18669907422" className="hover:text-white transition-colors font-semibold">1 866-990-7422</a>
              </p>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-[#C8A96A]/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/40 font-bold order-2 md:order-1">
            © 2026 Tropica Sanctuary. All rights reserved.
          </p>
          <div className="flex gap-6 order-1 md:order-2">
            <Link href="/privacy" className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/40 font-bold hover:text-[#C8A96A] transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/40 font-bold hover:text-[#C8A96A] transition-colors">Terms & Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
