"use client";

import { useState } from "react";
import { Music, UtensilsCrossed, Sparkles, ChevronDown, Check, ArrowRight, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface StepEventPreferencesProps {
  onNext: (data: { needDj: boolean; cateringMenu: string; needDecoration: boolean; decorationStyle?: string }) => void;
  initialNeedDj?: boolean;
  initialCateringMenu?: string;
  initialNeedDecoration?: boolean;
  initialDecorationStyle?: string;
}

const CATERING_MENUS = [
  {
    id: "seafood_buffet",
    label: "Seafood Extravaganza Buffet",
    desc: "Fresh catch of the day, lobster, prawns, crab claws, oysters and grilled fish",
    emoji: "🦞"
  },
  {
    id: "tropica_signature",
    label: "Tropica Signature Experience",
    desc: "Chef's curated multi-course menu with tropical fusion flavours and wine pairings",
    emoji: "🍽️"
  },
  {
    id: "cocktail_canapes",
    label: "Cocktail and Canapes Reception",
    desc: "Elegant finger foods, artisan canapes, charcuterie boards and cocktail pairings",
    emoji: "🥂"
  },
  {
    id: "bbq_grill",
    label: "Tropical BBQ and Grill",
    desc: "Live grill station with premium meats, seafood skewers and tropical sides",
    emoji: "🔥"
  },
  {
    id: "vegan_garden",
    label: "Garden and Vegan Feast",
    desc: "Fully plant-based menu with seasonal vegetables, grains, and creative mains",
    emoji: "🌿"
  },
  {
    id: "kids_friendly",
    label: "Family and Kids Menu",
    desc: "Crowd-pleasing dishes for all ages — pastas, mini sliders, nuggets and desserts",
    emoji: "🎉"
  },
  {
    id: "custom",
    label: "Custom Menu",
    desc: "Have dietary requirements or a bespoke vision? We will craft your menu personally",
    emoji: "✍️"
  }
];

const DECORATION_STYLES = [
  { id: "tropical_arch", label: "Tropical Floral & Palm Arches", desc: "Fresh exotic flowers, monstera leaves, and entrance arch" },
  { id: "luxury_candlelight", label: "Luxury Candlelight & Tableware", desc: "Gold chargers, crystal glassware, and romantic candlelight" },
  { id: "balloon_backdrop", label: "Custom Balloon & Photo Backdrop", desc: "Bespoke color balloon garland with custom event signage" },
  { id: "champagne_tower", label: "Champagne Tower & Table Styling", desc: "Coupe glass champagne tower with custom floral runners" }
];

export const StepEventPreferences = ({
  onNext,
  initialNeedDj = false,
  initialCateringMenu = "seafood_buffet",
  initialNeedDecoration = false,
  initialDecorationStyle = "tropical_arch"
}: StepEventPreferencesProps) => {
  const [needDj, setNeedDj] = useState<boolean>(initialNeedDj);
  const [showDjModal, setShowDjModal] = useState<boolean>(false);
  const [cateringMenu, setCateringMenu] = useState<string>(initialCateringMenu);
  const [menuOpen, setMenuOpen] = useState(false);

  // Decoration Checkbox state
  const [needDecoration, setNeedDecoration] = useState<boolean>(initialNeedDecoration);
  const [decorationStyle, setDecorationStyle] = useState<string>(initialDecorationStyle);

  const selectedMenu = CATERING_MENUS.find((m) => m.id === cateringMenu) || CATERING_MENUS[0];

  const handleDjToggle = (wantDj: boolean) => {
    setNeedDj(wantDj);
    if (wantDj) {
      setShowDjModal(true);
    }
  };

  const handleContinue = () => {
    onNext({
      needDj,
      cateringMenu,
      needDecoration,
      decorationStyle: needDecoration ? decorationStyle : undefined
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* DJ $300 Pop-Up Notice Modal */}
      {showDjModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#111412] border border-[#C8A96A]/40 rounded-2xl p-8 max-w-md w-full space-y-6 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#C8A96A] via-[#E8CB8A] to-[#C8A96A]" />
            <button
              onClick={() => setShowDjModal(false)}
              className="absolute top-4 right-4 text-white/50 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center">
                <Music className="w-6 h-6 text-[#C8A96A]" />
              </div>
              <div>
                <span className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">Add-on Feature</span>
                <h3 className="font-headline italic text-2xl text-white">DJ Service Add-on</h3>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 space-y-2">
              <p className="font-headline italic text-3xl text-[#C8A96A]">$300 USD <span className="text-base text-white/70 font-body font-normal">/ 4 Hours</span></p>
              <p className="text-xs text-white/80 font-body leading-relaxed">
                Professional live DJ mixing for 4 hours customized to your party theme, playlist preferences, and lighting setup.
              </p>
            </div>

            <button
              onClick={() => setShowDjModal(false)}
              className="w-full bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs uppercase tracking-widest py-4 rounded-xl shadow-lg transition-all"
            >
              Got It, Confirm DJ ($300 / 4 hrs)
            </button>
          </div>
        </div>
      )}

      {/* Step Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-headline italic text-[#C8A96A] text-base">05.</span>
          <div className="h-[1px] w-8 bg-white/20" />
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Event Preferences &amp; Add-ons</span>
        </div>
        <h2 className="font-headline italic text-3xl md:text-5xl text-white leading-tight">
          Curate Your <span className="text-gold-gradient">Add-ons &amp; Styling</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light">
          Tailor your entertainment, catering menu, and bespoke decor for a memorable celebration.
        </p>
      </header>

      {/* ─── 1. DJ Service ($300 for 4 Hours) ───────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 text-[#C8A96A]" />
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/50 font-bold">Entertainment</p>
              <h3 className="font-headline italic text-xl md:text-2xl text-white">DJ Service Add-on</h3>
            </div>
          </div>
          <span className="font-mono text-sm font-bold bg-[#C8A96A]/20 text-[#C8A96A] px-3 py-1.5 rounded-lg border border-[#C8A96A]/40">
            $300 / 4 Hours
          </span>
        </div>

        <p className="text-white/60 font-body text-sm font-light leading-relaxed">
          Professional live DJ for 4 hours with customized sound and lighting ($300 USD).
        </p>

        <div className="grid grid-cols-2 gap-3">
          {/* YES */}
          <button
            type="button"
            onClick={() => handleDjToggle(true)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300",
              needDj
                ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-[0_0_20px_rgba(200,169,106,0.15)]"
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
              needDj ? "border-[#C8A96A] bg-[#C8A96A]" : "border-white/30"
            )}>
              {needDj && <Check className="w-3 h-3 text-black" />}
            </div>
            <div className="min-w-0">
              <p className={cn(
                "font-label text-[11px] uppercase tracking-wider font-bold leading-tight",
                needDj ? "text-[#C8A96A]" : "text-white/70"
              )}>Yes, Include DJ (+$300)</p>
              <p className="text-white/40 font-body text-[10px] mt-0.5">4 Hours Live DJ</p>
            </div>
          </button>

          {/* NO */}
          <button
            type="button"
            onClick={() => handleDjToggle(false)}
            className={cn(
              "flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all duration-300",
              !needDj
                ? "bg-white/10 border-white/30"
                : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-300",
              !needDj ? "border-white bg-white" : "border-white/30"
            )}>
              {!needDj && <Check className="w-3 h-3 text-black" />}
            </div>
            <div className="min-w-0">
              <p className={cn(
                "font-label text-[11px] uppercase tracking-wider font-bold leading-tight",
                !needDj ? "text-white" : "text-white/70"
              )}>No, Thanks</p>
              <p className="text-white/40 font-body text-[10px] mt-0.5">I will manage music</p>
            </div>
          </button>
        </div>

        {needDj && (
          <div className="p-3 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-between">
            <p className="text-xs text-[#C8A96A] font-body font-semibold">
              ✓ DJ Add-on Selected ($300 USD for 4 Hours)
            </p>
            <button
              type="button"
              onClick={() => setShowDjModal(true)}
              className="text-[11px] text-[#C8A96A] underline hover:text-white flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> View Details
            </button>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* ─── 2. Catering Menu ───────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center flex-shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-[#C8A96A]" />
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-white/50 font-bold">Food and Dining</p>
            <h3 className="font-headline italic text-xl md:text-2xl text-white">Catering Menu</h3>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className={cn(
              "w-full flex items-center justify-between gap-2 rounded-xl px-4 py-3.5 text-left transition-all duration-300 border-2",
              menuOpen ? "bg-white/10 border-[#C8A96A]/40" : "bg-white/5 border-white/10 hover:border-white/20"
            )}
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <span className="text-xl flex-shrink-0">{selectedMenu.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-white uppercase tracking-wider truncate">
                  {selectedMenu.label}
                </p>
                <p className="text-[11px] text-white/50 italic truncate mt-0.5">
                  {selectedMenu.desc}
                </p>
              </div>
            </div>
            <ChevronDown className={cn("w-4 h-4 text-[#C8A96A] flex-shrink-0 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-[#1a1c1b] border border-white/20 rounded-xl shadow-2xl overflow-y-auto max-h-72">
              {CATERING_MENUS.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => {
                    setCateringMenu(menu.id);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left transition-all border-l-4",
                    cateringMenu === menu.id ? "bg-[#C8A96A]/10 border-[#C8A96A]" : "hover:bg-white/5 border-transparent"
                  )}
                >
                  <span className="text-lg flex-shrink-0">{menu.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-xs font-bold uppercase tracking-wider truncate", cateringMenu === menu.id ? "text-[#C8A96A]" : "text-white")}>
                      {menu.label}
                    </p>
                    <p className="text-[10px] text-white/50 italic mt-0.5 truncate">{menu.desc}</p>
                  </div>
                  {cateringMenu === menu.id && <Check className="w-4 h-4 text-[#C8A96A]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* ─── 3. Event Decoration Checkbox ──────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-[#C8A96A]" />
          </div>
          <div>
            <p className="font-label text-[10px] uppercase tracking-widest text-white/50 font-bold">Styling &amp; Decor</p>
            <h3 className="font-headline italic text-xl md:text-2xl text-white">Event Decoration</h3>
          </div>
        </div>

        {/* Decoration Checkbox */}
        <label className="flex items-center gap-4 p-4 rounded-xl bg-black/40 border-2 border-[#C8A96A]/30 cursor-pointer hover:border-[#C8A96A]/60 transition-all">
          <input
            type="checkbox"
            checked={needDecoration}
            onChange={(e) => setNeedDecoration(e.target.checked)}
            className="w-5 h-5 rounded border-[#C8A96A] bg-transparent text-[#C8A96A] focus:ring-0 cursor-pointer"
          />
          <div className="flex-1">
            <p className="font-body text-sm font-bold text-white">Include Custom Event Decoration</p>
            <p className="text-xs text-white/60">Professional table styling, florals, lighting, and decorative setups</p>
          </div>
        </label>

        {/* Decoration Options Dropdown / Options if checked */}
        {needDecoration && (
          <div className="space-y-3 pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
            <p className="font-label text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold">Select Decoration Style</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {DECORATION_STYLES.map((style) => (
                <button
                  key={style.id}
                  type="button"
                  onClick={() => setDecorationStyle(style.id)}
                  className={cn(
                    "p-4 rounded-xl border-2 text-left transition-all",
                    decorationStyle === style.id
                      ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-md"
                      : "bg-white/5 border-white/10 hover:border-white/20"
                  )}
                >
                  <p className={cn("text-xs font-bold uppercase tracking-wider", decorationStyle === style.id ? "text-[#C8A96A]" : "text-white")}>
                    {style.label}
                  </p>
                  <p className="text-[10px] text-white/50 italic mt-1 leading-relaxed">{style.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Continue CTA */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>Continue to Summary &amp; Payment</span>
          <ArrowRight className="w-4 h-4 text-[#0d1612]" />
        </button>
      </div>
    </div>
  );
};
