"use client";

import { useState } from "react";
import { Music, UtensilsCrossed, Sparkles, Check, ArrowRight, Info, X, ExternalLink, Star, Eye, Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATERING_RESTAURANTS, CateringRestaurant, getCateringRestaurant } from "@/lib/cateringRestaurants";
import { CateringRestaurantModal } from "./CateringRestaurantModal";

interface StepEventPreferencesProps {
  onNext: (data: { needDj: boolean; cateringMenu: string; needDecoration: boolean; decorationStyle?: string; needPhotographer: boolean; photographerHours: number }) => void;
  initialNeedDj?: boolean;
  initialCateringMenu?: string;
  initialNeedDecoration?: boolean;
  initialDecorationStyle?: string;
  initialNeedPhotographer?: boolean;
  initialPhotographerHours?: number;
}

const DECORATION_STYLES = [
  { id: "tropical_arch", label: "Tropical Floral & Palm Arches", desc: "Fresh exotic flowers, monstera leaves, and entrance arch" },
  { id: "luxury_candlelight", label: "Luxury Candlelight & Tableware", desc: "Gold chargers, crystal glassware, and romantic candlelight" },
  { id: "balloon_backdrop", label: "Custom Balloon & Photo Backdrop", desc: "Bespoke color balloon garland with custom event signage" },
  { id: "champagne_tower", label: "Champagne Tower & Table Styling", desc: "Coupe glass champagne tower with custom floral runners" }
];

export const StepEventPreferences = ({
  onNext,
  initialNeedDj = false,
  initialCateringMenu = "none",
  initialNeedDecoration = false,
  initialDecorationStyle = "tropical_arch",
  initialNeedPhotographer = false,
  initialPhotographerHours = 2
}: StepEventPreferencesProps) => {
  const [needDj, setNeedDj] = useState<boolean>(initialNeedDj);
  const [showDjModal, setShowDjModal] = useState<boolean>(false);
  const [cateringMenu, setCateringMenu] = useState<string>(initialCateringMenu ?? "none");

  // Restaurant Menu Modal state
  const [activeModalRestaurant, setActiveModalRestaurant] = useState<CateringRestaurant | null>(null);

  // Decoration Checkbox state
  const [needDecoration, setNeedDecoration] = useState<boolean>(initialNeedDecoration);
  const [decorationStyle, setDecorationStyle] = useState<string>(initialDecorationStyle);

  // Photographer state: $300 base for 2 hrs, +$150/hr extra
  const [needPhotographer, setNeedPhotographer] = useState<boolean>(initialNeedPhotographer);
  const [photographerHours, setPhotographerHours] = useState<number>(initialPhotographerHours);
  const photographerCost = needPhotographer ? 300 + Math.max(0, photographerHours - 2) * 150 : 0;

  const hasCatering = cateringMenu && cateringMenu !== "none";
  const selectedRestaurant = hasCatering ? getCateringRestaurant(cateringMenu) : null;

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
      decorationStyle: needDecoration ? decorationStyle : undefined,
      needPhotographer,
      photographerHours
    });
  };

  return (
    <div className="space-y-8 md:space-y-12 animate-in fade-in duration-500">
      {/* Restaurant Menu Interactive Modal */}
      <CateringRestaurantModal
        restaurant={activeModalRestaurant}
        isOpen={Boolean(activeModalRestaurant)}
        onClose={() => setActiveModalRestaurant(null)}
        onSelectRestaurant={(id) => setCateringMenu(id)}
        isSelected={activeModalRestaurant?.id === cateringMenu}
      />

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
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">Event Preferences &amp; Catering</span>
        </div>
        <h2 className="font-headline italic text-3xl md:text-5xl text-white leading-tight">
          Curate Your <span className="text-gold-gradient">Dining &amp; Add-ons</span>
        </h2>
        <p className="text-white/60 font-body text-base md:text-lg font-light">
          Choose from our 3 premier partner restaurants for private catering, music, and bespoke event styling.
        </p>
      </header>

      {/* ─── 1. Partner Restaurant Catering Selector ─────────────── */}
      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5 text-[#C8A96A]" />
            </div>
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-white/50 font-bold">Catering Partners</p>
              <h3 className="font-headline italic text-xl md:text-2xl text-white">Select Event Restaurant Menu</h3>
            </div>
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A]">
            Included with Venue
          </span>
        </div>

        {/* Optional Catering Notice */}
        <p className="text-white/60 font-body text-xs sm:text-sm font-light">
          Partner catering is completely optional. Select any restaurant below if you want meals served, or choose <strong>"No Partner Catering"</strong> if you prefer to bring your own food or private chef.
        </p>

        {/* 3 Restaurant Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CATERING_RESTAURANTS.filter(r => r.id !== "custom_catering").map((rest) => {
            const isSelected = cateringMenu === rest.id;
            return (
              <div
                key={rest.id}
                onClick={() => setCateringMenu(prev => prev === rest.id ? "none" : rest.id)}
                className={cn(
                  "relative rounded-2xl overflow-hidden border-2 transition-all duration-300 flex flex-col justify-between cursor-pointer group select-none",
                  isSelected
                    ? "bg-[#161c18] border-[#C8A96A] shadow-[0_0_25px_rgba(200,169,106,0.25)] scale-[1.01]"
                    : "bg-white/[0.03] border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/[0.06]"
                )}
              >
                {/* Image & Header */}
                <div className="relative h-40 w-full overflow-hidden flex-shrink-0">
                  <img
                    src={rest.image}
                    alt={rest.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 brightness-[0.75]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161c18] via-transparent to-black/40" />

                  {/* Top Badge & Rating */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 border border-white/20 text-[#C8A96A] backdrop-blur-sm">
                      {rest.cuisine}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C8A96A] text-black shadow">
                      {rest.emoji}
                    </span>
                  </div>

                  {/* Selection Checkmark */}
                  {isSelected && (
                    <div className="absolute bottom-3 right-3 w-7 h-7 rounded-full bg-[#C8A96A] text-black flex items-center justify-center shadow-lg animate-in zoom-in-50">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  )}

                  {/* Restaurant Name over image */}
                  <div className="absolute bottom-2 left-3 right-12">
                    <h4 className="font-headline italic text-lg text-white font-bold tracking-wide drop-shadow">
                      {rest.name}
                    </h4>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-[11px] text-white/70 line-clamp-2 leading-relaxed">
                      {rest.shortDesc}
                    </p>

                    {/* Dish highlights */}
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {rest.highlightDishes.slice(0, 3).map((dish, idx) => (
                        <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-white/5 text-white/80 border border-white/10">
                          {dish}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions: View Menu Modal */}
                  <div className="pt-2 border-t border-white/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      type="button"
                      onClick={() => setActiveModalRestaurant(rest)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold bg-[#C8A96A]/15 hover:bg-[#C8A96A] text-[#C8A96A] hover:text-black border border-[#C8A96A]/30 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Preview Menu</span>
                    </button>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => setCateringMenu("none")}
                        className="px-3 py-2 rounded-xl text-[11px] font-medium text-white/50 hover:text-red-400 bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                      >
                        Deselect
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Menu Card / Option */}
        <div
          onClick={() => setCateringMenu(prev => prev === "custom_catering" ? "none" : "custom_catering")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none",
            cateringMenu === "custom_catering" || cateringMenu === "custom"
              ? "bg-[#C8A96A]/15 border-[#C8A96A] shadow-md"
              : "bg-white/[0.02] border-white/10 hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              cateringMenu === "custom_catering" || cateringMenu === "custom" ? "border-[#C8A96A] bg-[#C8A96A]" : "border-white/30"
            )}>
              {(cateringMenu === "custom_catering" || cateringMenu === "custom") && <Check className="w-3 h-3 text-black" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                ✍️ Custom Menu / Multi-Restaurant Fusion
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                Have specific dietary requirements (vegan, halal, kosher) or want dishes from multiple restaurants? We will tailor it for you.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-[#C8A96A] tracking-wider flex-shrink-0">
            Bespoke Setup
          </span>
        </div>

        {/* No Partner Catering Option */}
        <div
          onClick={() => setCateringMenu("none")}
          className={cn(
            "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between gap-4 select-none",
            !hasCatering
              ? "bg-white/10 border-[#C8A96A] shadow-md"
              : "bg-white/[0.02] border-white/10 hover:border-white/20"
          )}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
              !hasCatering ? "border-[#C8A96A] bg-[#C8A96A]" : "border-white/30"
            )}>
              {!hasCatering && <Check className="w-3 h-3 text-black" />}
            </div>
            <div>
              <p className="text-xs font-bold text-white uppercase tracking-wider">
                🚫 No Partner Catering Needed
              </p>
              <p className="text-[11px] text-white/50 mt-0.5">
                I do not want partner catering. I will manage food independently, bring outside catering/cake, or celebrate without meals.
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider flex-shrink-0">
            Self-Managed
          </span>
        </div>

        {/* Active Selection Banner */}
        {hasCatering && selectedRestaurant ? (
          <div className="p-3.5 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">{selectedRestaurant.emoji}</span>
              <div>
                <p className="text-xs font-bold text-white">
                  Selected: <span className="text-[#C8A96A]">{selectedRestaurant.name}</span>
                </p>
                <p className="text-[10px] text-white/60">{selectedRestaurant.cuisine}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActiveModalRestaurant(selectedRestaurant)}
                className="text-[11px] text-[#C8A96A] underline hover:text-white font-semibold flex items-center gap-1"
              >
                <Eye className="w-3.5 h-3.5" /> Preview Menu
              </button>
              <button
                type="button"
                onClick={() => setCateringMenu("none")}
                className="text-[11px] text-white/50 hover:text-red-400 font-semibold transition"
              >
                Deselect
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="text-lg">🚫</span>
              <div>
                <p className="text-xs font-bold text-white/90">
                  No Partner Catering Selected
                </p>
                <p className="text-[10px] text-white/50">Your reservation will proceed with venue booking only.</p>
              </div>
            </div>
            <span className="text-[10px] uppercase tracking-wider text-[#C8A96A] font-bold">
              Catering Optional
            </span>
          </div>
        )}
      </section>

      {/* Divider */}
      <div className="h-px bg-white/10" />

      {/* ─── 2. DJ Service ($300 for 4 Hours) ───────────────────── */}
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

      {/* ── Photographer Add-On ── */}
      <section className="space-y-5">
        <div className="flex items-center gap-3">
          <Camera className="w-5 h-5 text-[#C8A96A]" />
          <h2 className="font-headline italic text-2xl text-[#E5E7EB]">Event Photographer</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A]/70 bg-[#C8A96A]/10 px-2 py-0.5 rounded-full border border-[#C8A96A]/20">Add-On</span>
        </div>

        {/* Toggle Card */}
        <div className={cn(
          "rounded-2xl border-2 p-6 transition-all duration-500 cursor-pointer select-none",
          needPhotographer
            ? "border-[#C8A96A] bg-[#C8A96A]/8 shadow-lg shadow-[#C8A96A]/10"
            : "border-white/10 bg-white/3 hover:border-white/20"
        )} onClick={() => setNeedPhotographer(v => !v)}>
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Custom toggle */}
              <div className={cn(
                "w-12 h-6 rounded-full relative transition-colors duration-300 flex-shrink-0",
                needPhotographer ? "bg-[#C8A96A]" : "bg-white/15"
              )}>
                <div className={cn(
                  "absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300",
                  needPhotographer ? "left-7" : "left-1"
                )} />
              </div>
              <div>
                <p className={cn("font-headline italic text-xl leading-tight", needPhotographer ? "text-[#C8A96A]" : "text-white/70")}>
                  Professional Photographer
                </p>
                <p className="text-[11px] text-white/40 mt-0.5 font-light italic">
                  High-res event photos delivered within 48 hrs
                </p>
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="font-headline italic text-2xl text-[#C8A96A] font-bold">
                {needPhotographer ? `$${photographerCost}` : "$300"}
              </p>
              <p className="text-[10px] text-white/40 uppercase tracking-wider">
                {needPhotographer ? `${photographerHours}hr${photographerHours !== 1 ? "s" : ""}` : "2 hr base"}
              </p>
            </div>
          </div>

          {/* Hour Selector — only when toggled on */}
          {needPhotographer && (
            <div className="mt-5 pt-4 border-t border-[#C8A96A]/20" onClick={e => e.stopPropagation()}>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] font-bold mb-3">Coverage Duration</p>
              <div className="flex items-center gap-3 flex-wrap">
                {[2, 3, 4, 5, 6].map(hrs => (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setPhotographerHours(hrs)}
                    className={cn(
                      "flex flex-col items-center px-4 py-2.5 rounded-xl border-2 transition-all duration-300 min-w-[60px]",
                      photographerHours === hrs
                        ? "border-[#C8A96A] bg-[#C8A96A]/15 shadow-md"
                        : "border-white/10 bg-white/5 hover:border-white/25"
                    )}
                  >
                    <span className={cn("font-headline italic text-lg font-bold leading-none", photographerHours === hrs ? "text-[#C8A96A]" : "text-white/60")}>
                      {hrs}hr
                    </span>
                    <span className={cn("text-[9px] font-bold uppercase tracking-wider mt-1", photographerHours === hrs ? "text-[#C8A96A]/80" : "text-white/30")}>
                      ${300 + Math.max(0, hrs - 2) * 150}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/35 mt-3 italic">
                Base: $300 / 2 hrs &nbsp;·&nbsp; Additional hours: +$150/hr
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Continue CTA */}
      <div className="pt-4">
        <button
          type="button"
          onClick={handleContinue}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-10 py-5 bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
        >
          <span>{hasCatering ? "Continue to Select Menu" : "Continue to Summary & Payment"}</span>
          <ArrowRight className="w-4 h-4 text-[#0d1612]" />
        </button>
      </div>
    </div>
  );
};

