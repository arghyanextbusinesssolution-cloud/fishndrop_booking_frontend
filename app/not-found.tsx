import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6" style={{ backgroundColor: '#0F3D2E' }}>
      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
        <div className="relative w-64 h-24 md:w-80 md:h-32 mb-12">
          <Image
            src="/tropica-logo.png"
            alt="Tropica Sanctuary"
            fill
            className="object-contain"
            priority
          />
        </div>
        
        <h1 className="font-headline text-8xl md:text-[10rem] text-[#C8A96A] opacity-20 tracking-tighter italic leading-none absolute top-10 md:-top-10 -z-10 pointer-events-none">
          404
        </h1>
        
        <h2 className="font-headline text-4xl md:text-6xl text-white italic mb-6">
          Lost in the <span className="text-gold-gradient">Sanctuary</span>
        </h2>
        
        <p className="font-body text-white/60 text-lg md:text-xl font-light mb-12 max-w-md mx-auto">
          The page you are looking for has vanished into the mist. Allow us to guide you back to the main lounge.
        </p>

        <Link 
          href="/" 
          className="bg-gold-gradient text-on-primary font-label text-[11px] tracking-[0.3em] uppercase px-12 py-5 rounded-full shadow-2xl shadow-[#C8A96A]/20 hover:scale-105 active:scale-95 transition-all duration-500 font-bold"
        >
          Return Home
        </Link>
      </div>

      {/* Decorative ambient lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#C8A96A]/5 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
