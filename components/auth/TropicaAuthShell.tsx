import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ─────────────────────────────────────────────────────────────
   Tropica "private lounge" theme used by login / sign-up /
   partner portal screens: dark teak wall, hanging lanterns,
   palm fronds, warm floor glow and a gold-framed glass card.
   ───────────────────────────────────────────────────────────── */

/** Shared field + button styles so every themed form matches. */
export const tropicaField =
  "flex items-center gap-2.5 rounded-xl bg-black/55 border border-[#C8A96A]/30 px-3.5 transition-all focus-within:border-[#E0C68E] focus-within:shadow-[0_0_0_3px_rgba(200,169,106,0.15)]";
export const tropicaInput =
  "w-full min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/30";
export const tropicaInputBare =
  "w-full rounded-xl bg-black/55 border border-[#C8A96A]/30 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 transition-all focus:border-[#E0C68E] focus:shadow-[0_0_0_3px_rgba(200,169,106,0.15)]";
export const tropicaLabel = "block text-[11px] font-bold uppercase tracking-[0.18em] text-[#E0C68E]/80 mb-1.5";
export const tropicaGoldButton =
  "w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-b from-[#F1D9A0] via-[#D9B872] to-[#B8934E] text-[#1a1208] text-xs font-black uppercase tracking-[0.18em] shadow-[0_8px_28px_-6px_rgba(224,184,110,0.6),inset_0_1px_0_rgba(255,245,215,0.7)] hover:brightness-110 active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer";
export const tropicaGhostButton =
  "w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-[#C8A96A]/40 bg-black/40 text-[#E0C68E] text-xs font-bold uppercase tracking-[0.15em] hover:bg-[#C8A96A]/10 hover:border-[#E0C68E] transition-all cursor-pointer";

/* ── decorative pieces ── */

function Lantern({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute top-0", className)} aria-hidden>
      <div className="tropica-lantern-sway flex flex-col items-center">
        <div className="h-10 sm:h-16 w-px bg-gradient-to-b from-[#6b5530]/0 via-[#8a6d3b] to-[#C8A96A]" />
        <div className="relative">
          <div className="tropica-lantern-glow absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-[radial-gradient(circle,rgba(255,190,90,0.38)_0%,rgba(255,150,50,0.12)_40%,transparent_70%)]" />
          <svg viewBox="0 0 60 92" className="relative w-11 sm:w-14 drop-shadow-[0_0_14px_rgba(255,190,90,0.7)]">
            <defs>
              <radialGradient id="lanternCore" cx="50%" cy="55%" r="55%">
                <stop offset="0%" stopColor="#FFF4C9" />
                <stop offset="45%" stopColor="#FFC55E" />
                <stop offset="100%" stopColor="#B4621B" />
              </radialGradient>
              <linearGradient id="lanternMetal" x1="0" x2="1">
                <stop offset="0%" stopColor="#7a5a26" />
                <stop offset="50%" stopColor="#E8CB8A" />
                <stop offset="100%" stopColor="#7a5a26" />
              </linearGradient>
            </defs>
            <circle cx="30" cy="5" r="4" fill="none" stroke="url(#lanternMetal)" strokeWidth="2" />
            <path d="M18 18 L30 9 L42 18 Z" fill="url(#lanternMetal)" />
            <rect x="15" y="18" width="30" height="4" rx="1" fill="url(#lanternMetal)" />
            <path d="M17 22 H43 L46 70 H14 Z" fill="url(#lanternCore)" className="tropica-lantern-glow" />
            <path d="M17 22 H43 L46 70 H14 Z M30 22 V70 M15.5 46 H44.5" fill="none" stroke="url(#lanternMetal)" strokeWidth="1.6" />
            <rect x="12" y="70" width="36" height="5" rx="1.5" fill="url(#lanternMetal)" />
            <path d="M20 75 H40 L36 84 H24 Z" fill="url(#lanternMetal)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/** A palm frond drawn from a stem plus generated leaflets. */
function Frond({ className, flip, tone = "#1f4a2c" }: { className?: string; flip?: boolean; tone?: string }) {
  // Stem is the quadratic curve P0 → P1 → P2; leaflets sprout along it, swept toward the tip.
  const P0 = [8, 200], P1 = [100, 120], P2 = [208, 52];
  const leaflets = Array.from({ length: 15 }, (_, i) => {
    const t = (i + 1) / 16;
    const u = 1 - t;
    const x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0];
    const y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
    const dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]);
    const dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
    const tangent = (Math.atan2(dy, dx) * 180) / Math.PI;
    const len = 26 + 62 * Math.sin(Math.PI * (0.15 + t * 0.8));
    // Rounded so server and browser render identical markup (no hydration mismatch).
    const r = (n: number) => Math.round(n * 10) / 10;
    return { x: r(x), y: r(y), len: r(len), angle: r(tangent - 50) };
  });
  return (
    <svg viewBox="0 0 230 230" className={cn("pointer-events-none absolute", className)} style={flip ? { transform: "scaleX(-1)" } : undefined} aria-hidden>
      <defs>
        <linearGradient id={`frond-${tone}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tone} />
          <stop offset="100%" stopColor="#0b1d12" />
        </linearGradient>
      </defs>
      <path d="M8 200 Q100 120 208 52" stroke="#2f5a35" strokeWidth="3" fill="none" />
      {leaflets.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y})`}>
          <path
            d={`M0 0 Q ${l.len * 0.5} -9 ${l.len} 0 Q ${l.len * 0.5} 7 0 0 Z`}
            fill={`url(#frond-${tone})`}
            stroke="#3f7a47"
            strokeOpacity="0.35"
            strokeWidth="0.8"
            transform={`rotate(${l.angle})`}
          />
          <path
            d={`M0 0 Q ${l.len * 0.5} -9 ${l.len} 0 Q ${l.len * 0.5} 7 0 0 Z`}
            fill={`url(#frond-${tone})`}
            stroke="#3f7a47"
            strokeOpacity="0.35"
            strokeWidth="0.8"
            transform={`rotate(${l.angle + 100})`}
          />
        </g>
      ))}
    </svg>
  );
}

function Stanchion({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 150" className={cn("pointer-events-none absolute bottom-[6%] w-6 sm:w-8", className)} aria-hidden>
      <defs>
        <linearGradient id="postGold" x1="0" x2="1">
          <stop offset="0%" stopColor="#6e5222" />
          <stop offset="45%" stopColor="#F3DDA6" />
          <stop offset="100%" stopColor="#6e5222" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="9" r="8" fill="url(#postGold)" />
      <rect x="16" y="15" width="8" height="118" rx="2" fill="url(#postGold)" />
      <ellipse cx="20" cy="140" rx="18" ry="6" fill="url(#postGold)" />
    </svg>
  );
}

function LoungeBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
      {/* teak slat wall */}
      <div className="absolute inset-0 bg-[#0b0704]" />
      <div className="absolute inset-0 opacity-70 bg-[repeating-linear-gradient(90deg,#2b1a0e_0px,#3a2414_14px,#24150b_30px,#0d0805_32px,#0d0805_34px)]" />
      {/* warm center wash + vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_55%_at_50%_42%,rgba(255,176,80,0.22),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.85)_100%)]" />
      {/* glossy floor with light reflections */}
      <div className="absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-b from-transparent via-[#120a04]/90 to-[#050302]" />
      <div className="absolute inset-x-0 bottom-0 h-[16%] bg-[radial-gradient(ellipse_45%_60%_at_50%_100%,rgba(255,180,90,0.28),transparent_70%)]" />
      <div className="absolute bottom-0 left-[12%] h-[14%] w-10 bg-gradient-to-t from-[#FFB45A]/25 to-transparent blur-md" />
      <div className="absolute bottom-0 right-[12%] h-[14%] w-10 bg-gradient-to-t from-[#FFB45A]/25 to-transparent blur-md" />

      {/* lanterns */}
      <Lantern className="left-[6%] sm:left-[10%]" />
      <Lantern className="right-[6%] sm:right-[10%]" />

      {/* palm fronds framing the scene */}
      <Frond className="-left-16 -top-10 w-72 sm:w-96 rotate-[20deg] opacity-90" tone="#24532f" />
      <Frond className="-right-16 -top-10 w-72 sm:w-96 rotate-[-20deg] opacity-90" tone="#24532f" flip />
      <Frond className="-left-20 bottom-[-4rem] w-80 sm:w-[28rem] rotate-[-70deg] opacity-95" tone="#2d6236" />
      <Frond className="-right-20 bottom-[-4rem] w-80 sm:w-[28rem] rotate-[70deg] opacity-95" tone="#2d6236" flip />

      {/* velvet-rope posts */}
      <Stanchion className="hidden md:block left-[17%]" />
      <Stanchion className="hidden md:block right-[17%]" />
    </div>
  );
}

/* ── shell ── */

interface TropicaAuthShellProps {
  /** Small gold line above the title, e.g. "Members Lounge". */
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Text under the logo; defaults to "Private Event Space". */
  tagline?: string;
  /** Card width. */
  size?: "md" | "lg" | "xl";
  /** Rendered under the card body, separated by a hairline (links, notes). */
  footer?: ReactNode;
  children: ReactNode;
}

export function TropicaAuthShell({ eyebrow, title, subtitle, tagline = "Private Event Space", size = "md", footer, children }: TropicaAuthShellProps) {
  const width = size === "xl" ? "max-w-2xl" : size === "lg" ? "max-w-lg" : "max-w-md";
  return (
    <div className="relative min-h-screen bg-[#0b0704] text-white overflow-x-hidden">
      <LoungeBackdrop />

      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-14">
        {/* Logo */}
        <Link href="/" className="group flex flex-col items-center gap-2">
          <div className="relative h-20 w-36 sm:h-24 sm:w-44 drop-shadow-[0_0_18px_rgba(255,190,90,0.45)] transition-transform duration-300 group-hover:scale-105">
            <Image src="/tropica-logo.png" alt="Tropica" fill priority className="object-contain" />
          </div>
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.45em] text-[#E0C68E]/85">{tagline}</span>
        </Link>

        {/* Card */}
        <div
          className={cn(
            "relative mt-6 w-full overflow-hidden rounded-3xl border border-[#C8A96A]/55",
            "bg-gradient-to-b from-[#1a140c]/85 via-[#0e0b07]/90 to-[#090705]/95 backdrop-blur-xl",
            "shadow-[0_0_70px_-12px_rgba(224,184,110,0.55),0_30px_60px_-20px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,235,190,0.18)]",
            width
          )}
        >
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#F1D9A0] to-transparent" />
          <div className="absolute inset-[5px] rounded-[1.25rem] border border-[#C8A96A]/15 pointer-events-none" />

          <div className="relative p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              {eyebrow && <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.35em] text-[#E0C68E]">{eyebrow}</p>}
              <h1 className="font-headline text-3xl sm:text-4xl font-bold text-white">{title}</h1>
              {subtitle && <p className="text-xs sm:text-sm text-white/60 max-w-sm mx-auto">{subtitle}</p>}
            </div>

            {children}

            {footer && <div className="pt-5 border-t border-[#C8A96A]/15 text-xs text-white/55">{footer}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}

/** "──── OR ────" divider that sits on the transparent card. */
export function TropicaDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.25em] text-white/40">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[#C8A96A]/30" />
      {label}
      <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[#C8A96A]/30" />
    </div>
  );
}
