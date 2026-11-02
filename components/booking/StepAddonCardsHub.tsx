"use client";

import { useState } from "react";
import {
  Music,
  Camera,
  UtensilsCrossed,
  Check,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  Plus,
  Minus,
  Trash2,
  Sliders,
  CheckCircle2,
  ChefHat,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CATERING_RESTAURANTS, CateringRestaurant, getCateringRestaurant } from "@/lib/cateringRestaurants";
import { RestaurantNoticeModal } from "./RestaurantNoticeModal";

interface StepAddonCardsHubProps {
  onNext: (data: {
    needDj: boolean;
    needPhotographer: boolean;
    photographerHours: number;
    cateringMenu: string;
    selectedDishes: string[];
    dishQuantities: Record<string, number>;
    cateringNotes: string;
  }) => void;
  initialNeedDj?: boolean;
  initialNeedPhotographer?: boolean;
  initialPhotographerHours?: number;
  initialCateringMenu?: string;
  initialSelectedDishes?: string[];
  initialDishQuantities?: Record<string, number>;
  initialCateringNotes?: string;
}

export function StepAddonCardsHub({
  onNext,
  initialNeedDj = false,
  initialNeedPhotographer = false,
  initialPhotographerHours = 2,
  initialCateringMenu = "none",
  initialSelectedDishes = [],
  initialDishQuantities = {},
  initialCateringNotes = ""
}: StepAddonCardsHubProps) {
  // Navigation inside the Addon Step: "hub" | "dj" | "photography" | "restaurant"
  const [subView, setSubView] = useState<"hub" | "dj" | "photography" | "restaurant">("hub");

  // Addon 1: DJ
  const [needDj, setNeedDj] = useState<boolean>(initialNeedDj);

  // Addon 2: Photographer ($300 for 2 hrs, $150/extra hr)
  const [needPhotographer, setNeedPhotographer] = useState<boolean>(initialNeedPhotographer);
  const [photographerHours, setPhotographerHours] = useState<number>(initialPhotographerHours || 2);
  const photographerCost = needPhotographer ? 300 + Math.max(0, photographerHours - 2) * 150 : 0;

  // Addon 3: Restaurant & Catering Menu
  const [cateringMenu, setCateringMenu] = useState<string>(initialCateringMenu || "none");
  const [selectedDishes, setSelectedDishes] = useState<string[]>(initialSelectedDishes || []);
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>(initialDishQuantities || {});
  const [cateringNotes, setCateringNotes] = useState<string>(initialCateringNotes || "");

  // Restaurant menu sub-view internal state (Multiple selection allowed)
  const [tempRestaurantIds, setTempRestaurantIds] = useState<string[]>(() => {
    if (cateringMenu && cateringMenu !== "none") {
      const parts = cateringMenu.split(",").map((s) => s.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return ["jamaican_jerk_house"];
  });
  const [filterRestaurantTab, setFilterRestaurantTab] = useState<string>("all");
  const [noticeRestaurant, setNoticeRestaurant] = useState<CateringRestaurant | null>(null);
  const [showRestaurantNoticeModal, setShowRestaurantNoticeModal] = useState<boolean>(false);

  const hasCatering = cateringMenu && cateringMenu !== "none";
  const djCost = needDj ? 300 : 0;
  const totalAddonsPrice = djCost + photographerCost;

  const toggleRestaurant = (id: string) => {
    setTempRestaurantIds((prev) => {
      if (prev.includes(id)) {
        if (prev.length === 1) return prev; // keep at least 1 selected
        return prev.filter((r) => r !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const getSelectedRestaurantNames = () => {
    const ids = cateringMenu !== "none" ? cateringMenu.split(",").map((s) => s.trim()) : tempRestaurantIds;
    const names = ids
      .map((id) => CATERING_RESTAURANTS.find((r) => r.id === id)?.name)
      .filter(Boolean);
    if (names.length === 0) return "Partner Catering";
    if (names.length === 1) return names[0];
    if (names.length === 2) return `${names[0]} & ${names[1]}`;
    return `${names[0]}, ${names[1]} & ${names.length - 2} more`;
  };

  // Final submit to move to Checkout
  const handleProceedToCheckout = () => {
    onNext({
      needDj,
      needPhotographer,
      photographerHours,
      cateringMenu,
      selectedDishes,
      dishQuantities,
      cateringNotes
    });
  };

  /* ========================================================================= */
  /* SUBVIEW 1: DJ CONFIGURATION                                               */
  /* ========================================================================= */
  if (subView === "dj") {
    return (
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setSubView("hub")}
          className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-widest text-white/60 hover:text-[#C8A96A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Add-on Options
        </button>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
              <Music className="w-4 h-4" />
            </span>
            <span className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">
              Entertainment Add-on
            </span>
          </div>
          <h2 className="font-headline italic text-4xl text-white">
            Live DJ &amp; Sound Experience
          </h2>
          <p className="text-white/60 font-body text-base">
            Turn your private sanctuary buyout into an unforgettable celebration with club-grade sound and a dedicated DJ.
          </p>
        </header>

        {/* DJ Price Card & Inclusions */}
        <div className="bg-[#121614] rounded-3xl p-6 sm:p-8 border border-[#C8A96A]/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                Full Event Coverage
              </span>
              <h3 className="font-headline text-2xl text-white">Professional DJ Package</h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-headline text-3xl sm:text-4xl text-[#E3C281] font-bold">$300</span>
              <span className="block text-[11px] text-white/50 font-label">Fixed Event Fee</span>
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/80 font-label">
              What&apos;s Included:
            </h4>
            <div className="grid sm:grid-cols-2 gap-3 text-sm text-white/80">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Check className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <span>Club-grade PA speakers &amp; subwoofers</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Check className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <span>Wireless mic for speeches &amp; toasts</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Check className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <span>Ambient dancefloor party lighting</span>
              </div>
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                <Check className="w-4 h-4 text-[#C8A96A] shrink-0 mt-0.5" />
                <span>Tailored playlist (Afrobeats, Hip-Hop, House, R&amp;B)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {needDj ? (
            <button
              type="button"
              onClick={() => {
                setNeedDj(false);
                setSubView("hub");
              }}
              className="w-full sm:w-1/3 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-label uppercase tracking-widest text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Remove DJ Add-on
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setNeedDj(true);
              setSubView("hub");
            }}
            className="flex-1 py-4 rounded-xl bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label uppercase tracking-widest text-xs font-bold transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Confirm &amp; Add DJ ($300)
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUBVIEW 2: PHOTOGRAPHY CONFIGURATION                                      */
  /* ========================================================================= */
  if (subView === "photography") {
    const currentCost = 300 + Math.max(0, photographerHours - 2) * 150;

    return (
      <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setSubView("hub")}
          className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-widest text-white/60 hover:text-[#C8A96A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Add-on Options
        </button>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
              <Camera className="w-4 h-4" />
            </span>
            <span className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">
              Media Add-on
            </span>
          </div>
          <h2 className="font-headline italic text-4xl text-white">
            Professional Photography / Videography
          </h2>
          <p className="text-white/60 font-body text-base">
            Capture every candid smile, highlight reel, champagne toast, and special moment with our on-site media team.
          </p>
        </header>

        {/* Pricing Card & Hours Selector */}
        <div className="bg-[#121614] rounded-3xl p-6 sm:p-8 border border-[#C8A96A]/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/10 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
                High-Resolution Digital Gallery &amp; Video Reels
              </span>
              <h3 className="font-headline text-2xl text-white">
                {photographerHours} Hours Coverage
              </h3>
            </div>
            <div className="text-left sm:text-right">
              <span className="font-headline text-3xl sm:text-4xl text-[#E3C281] font-bold">
                ${currentCost}
              </span>
              <span className="block text-[11px] text-white/50 font-label">
                $300 base (2 hrs) + $150/extra hr
              </span>
            </div>
          </div>

          {/* Select Hours */}
          <div className="space-y-3">
            <label className="font-label text-xs uppercase tracking-widest text-white/80 font-bold block">
              Select Photography / Videography Hours:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[2, 3, 4, 5].map((hrs) => {
                const cost = 300 + (hrs - 2) * 150;
                const isSelected = photographerHours === hrs;
                return (
                  <button
                    key={hrs}
                    type="button"
                    onClick={() => setPhotographerHours(hrs)}
                    className={cn(
                      "p-3.5 rounded-2xl border text-center transition-all cursor-pointer",
                      isSelected
                        ? "bg-[#C8A96A] text-[#0d1612] border-[#C8A96A] shadow-md font-bold"
                        : "bg-white/[0.04] border-white/10 text-white hover:border-[#C8A96A]/50"
                    )}
                  >
                    <div className="font-headline text-xl">{hrs} Hours</div>
                    <div className={cn("text-xs font-mono mt-0.5", isSelected ? "text-[#0d1612]/80" : "text-[#E3C281]")}>
                      ${cost}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inclusions */}
          <div className="space-y-2 pt-2 border-t border-white/10">
            <h4 className="text-xs font-bold uppercase tracking-widest text-white/70 font-label">
              Included with Photography / Videography:
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-white/80">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8A96A]" /> Full digital photo album delivered in 48h
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8A96A]" /> Edited highlight video reels &amp; color correction
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8A96A]" /> High-resolution digital download rights
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-[#C8A96A]" /> Candid, group, decor &amp; video footage
              </div>
            </div>
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {needPhotographer ? (
            <button
              type="button"
              onClick={() => {
                setNeedPhotographer(false);
                setSubView("hub");
              }}
              className="w-full sm:w-1/3 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-label uppercase tracking-widest text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Remove Media Add-on
            </button>
          ) : null}

          <button
            type="button"
            onClick={() => {
              setNeedPhotographer(true);
              setSubView("hub");
            }}
            className="flex-1 py-4 rounded-xl bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label uppercase tracking-widest text-xs font-bold transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Confirm Photography / Videography ({photographerHours} hrs &bull; ${currentCost})
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* SUBVIEW 3: RESTAURANT & MENU SELECTION (MULTI-SELECTION ALLOWED)          */
  /* ========================================================================= */
  if (subView === "restaurant") {
    const activeRestaurants = CATERING_RESTAURANTS.filter((r) => tempRestaurantIds.includes(r.id));
    const displayedRestaurants =
      filterRestaurantTab === "all"
        ? activeRestaurants
        : activeRestaurants.filter((r) => r.id === filterRestaurantTab);

    const toggleDish = (dishName: string) => {
      setSelectedDishes((prev) => {
        if (prev.includes(dishName)) {
          const next = prev.filter((d) => d !== dishName);
          const nextQty = { ...dishQuantities };
          delete nextQty[dishName];
          setDishQuantities(nextQty);
          return next;
        } else {
          setDishQuantities((q) => ({ ...q, [dishName]: 1 }));
          return [...prev, dishName];
        }
      });
    };

    const updateQuantity = (dishName: string, delta: number) => {
      setDishQuantities((prev) => {
        const cur = prev[dishName] || 1;
        const nextVal = Math.max(1, cur + delta);
        return { ...prev, [dishName]: nextVal };
      });
    };

    const handleConfirmMenu = () => {
      setCateringMenu(tempRestaurantIds.join(","));
      setSubView("hub");
    };

    return (
      <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setSubView("hub")}
          className="inline-flex items-center gap-2 text-xs font-label uppercase tracking-widest text-white/60 hover:text-[#C8A96A] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Add-on Options
        </button>

        <header className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A]">
              <UtensilsCrossed className="w-4 h-4" />
            </span>
            <span className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">
              Dining &amp; Catering Add-on
            </span>
          </div>
          <h2 className="font-headline italic text-4xl text-white">
            Curate Restaurant &amp; Menu Platters
          </h2>
          <p className="text-white/60 font-body text-base">
            Select one or multiple partner restaurants to combine distinct culinary flavors for your event.
          </p>
        </header>

        {/* Step 1: Restaurant Selector Cards (Multiple Allowed) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-label text-xs uppercase tracking-widest text-white/80 font-bold block">
              1. Select Catering Restaurant Partners (Multiple Selection Allowed):
            </label>
            <span className="text-[11px] text-[#C8A96A] font-bold font-label">
              {tempRestaurantIds.length} Selected
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {CATERING_RESTAURANTS.map((r) => {
              const isChosen = tempRestaurantIds.includes(r.id);
              return (
                <div
                  key={r.id}
                  onClick={() => toggleRestaurant(r.id)}
                  className={cn(
                    "p-3 sm:p-4 rounded-xl sm:rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex gap-3 sm:gap-4 items-center group",
                    isChosen
                      ? "bg-[#C8A96A]/15 border-[#C8A96A] ring-2 ring-[#C8A96A]/30 shadow-lg"
                      : "bg-white/[0.03] border-white/10 hover:border-white/30 hover:bg-white/[0.06]"
                  )}
                >
                  <img
                    src={r.image}
                    alt={r.name}
                    className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl object-cover shrink-0 brightness-90 group-hover:brightness-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="text-base sm:text-lg shrink-0">{r.emoji}</span>
                      <h4 className="font-headline text-sm sm:text-base font-bold text-white truncate">{r.name}</h4>
                    </div>
                    <p className="text-[11px] sm:text-xs text-white/50 truncate font-label mt-0.5">{r.cuisine}</p>
                    <span className="text-[10px] text-[#C8A96A] font-bold uppercase tracking-wider block mt-0.5">
                      {r.rating}
                    </span>
                  </div>
                  {isChosen ? (
                    <div className="w-6 h-6 rounded-full bg-[#C8A96A] text-[#0d1612] flex items-center justify-center shrink-0 shadow-md">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center shrink-0 text-white/30 group-hover:border-white/50 group-hover:text-white">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 2: Curate Dishes from Selected Restaurants */}
        <div className="bg-[#121614] rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 border border-[#C8A96A]/25 space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-white/10 gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label block">
                Menu Curation
              </span>
              <h3 className="font-headline text-xl sm:text-2xl text-white">
                Signature Event Platters
              </h3>
            </div>
            <span className="text-[11px] sm:text-xs font-label font-bold px-2.5 py-1 rounded-full bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#E3C281] shrink-0">
              {selectedDishes.length} {selectedDishes.length === 1 ? "platter" : "platters"} chosen
            </span>
          </div>

          {/* Restaurant filter tabs if multiple restaurants are selected */}
          {activeRestaurants.length > 1 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-1">
              <button
                type="button"
                onClick={() => setFilterRestaurantTab("all")}
                className={cn(
                  "text-xs px-3 py-1.5 rounded-xl font-bold font-label transition-all cursor-pointer",
                  filterRestaurantTab === "all"
                    ? "bg-[#C8A96A] text-[#0d1612] shadow-sm"
                    : "bg-white/5 text-white/70 hover:bg-white/10"
                )}
              >
                All Menus ({activeRestaurants.length})
              </button>
              {activeRestaurants.map((r) => {
                const isTab = filterRestaurantTab === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setFilterRestaurantTab(r.id)}
                    className={cn(
                      "text-xs px-3 py-1.5 rounded-xl font-bold font-label transition-all flex items-center gap-1.5 cursor-pointer",
                      isTab
                        ? "bg-[#C8A96A] text-[#0d1612] shadow-sm"
                        : "bg-white/5 text-white/70 hover:bg-white/10"
                    )}
                  >
                    <span>{r.emoji}</span> {r.name}
                  </button>
                );
              })}
            </div>
          )}

          {/* Dishes list per restaurant */}
          <div className="space-y-6">
            {displayedRestaurants.map((rest) => (
              <div key={rest.id} className="space-y-4 pt-1">
                {displayedRestaurants.length > 1 && (
                  <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                    <span className="text-xl">{rest.emoji}</span>
                    <h4 className="font-headline text-lg sm:text-xl text-white">{rest.name}</h4>
                    <span className="text-[10px] text-[#C8A96A] font-bold uppercase tracking-wider font-label ml-auto">
                      {rest.cuisine}
                    </span>
                  </div>
                )}

                {rest.categories.map((cat) => (
                  <div key={cat.categoryName} className="space-y-2.5">
                    <div className="flex items-center gap-2 pt-1">
                      <h5 className="font-label text-xs uppercase tracking-widest text-[#E3C281] font-bold shrink-0">
                        {cat.categoryName}
                      </h5>
                      <div className="h-[1px] flex-1 bg-white/10" />
                    </div>
                    <div className="grid gap-2 sm:gap-2.5">
                      {cat.items.map((item) => {
                        const isSelected = selectedDishes.includes(item.name);
                        const qty = dishQuantities[item.name] || 1;

                        return (
                          <div
                            key={item.name}
                            onClick={() => toggleDish(item.name)}
                            className={cn(
                              "p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all flex items-start justify-between gap-2.5 sm:gap-3 cursor-pointer group",
                              isSelected
                                ? "bg-[#C8A96A]/10 border-[#C8A96A]/60 shadow-md ring-1 ring-[#C8A96A]/20 text-white"
                                : "bg-white/[0.02] border-white/10 text-white/80 hover:bg-white/[0.05] hover:border-white/20"
                            )}
                          >
                            <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                              <div
                                className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                                  isSelected
                                    ? "bg-[#C8A96A] border-[#C8A96A] text-[#0d1612] shadow-sm"
                                    : "border-white/30 bg-black/20 group-hover:border-white/50"
                                )}
                              >
                                {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                  <span
                                    className={cn(
                                      "font-headline text-sm sm:text-base font-bold leading-snug",
                                      isSelected ? "text-[#E3C281]" : "text-white"
                                    )}
                                  >
                                    {item.name}
                                  </span>
                                  {item.tag && (
                                    <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#C8A96A]/15 text-[#E3C281] font-bold font-label border border-[#C8A96A]/25 shrink-0">
                                      {item.tag}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] sm:text-xs text-white/50 line-clamp-2 mt-1 leading-relaxed">
                                  {item.desc}
                                </p>
                              </div>
                            </div>

                            {/* Platter Quantity Stepper if selected */}
                            {isSelected && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="flex items-center gap-1 bg-black/60 border border-[#C8A96A]/40 rounded-lg p-0.5 shrink-0 ml-1.5 self-center sm:self-start mt-0.5 shadow-sm"
                              >
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.name, -1)}
                                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer"
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="font-mono text-xs font-bold px-1 text-[#E3C281] min-w-[20px] text-center">
                                  {qty}x
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.name, 1)}
                                  className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 active:scale-95 text-white flex items-center justify-center transition-colors cursor-pointer"
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Dietary Notes */}
          <div className="space-y-2 pt-4 border-t border-white/10">
            <label className="font-label text-xs uppercase tracking-widest text-white/80 font-bold block">
              Dietary Restrictions or Special Instructions (Optional):
            </label>
            <textarea
              value={cateringNotes}
              onChange={(e) => setCateringNotes(e.target.value)}
              placeholder="e.g. 2 guests with gluten allergy, serve appetizers at 8 PM..."
              rows={2}
              className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-white/30 outline-none focus:border-[#C8A96A] transition-colors resize-none"
            />
          </div>
        </div>

        {/* Confirmation Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {hasCatering ? (
            <button
              type="button"
              onClick={() => {
                setCateringMenu("none");
                setSelectedDishes([]);
                setSubView("hub");
              }}
              className="w-full sm:w-1/3 py-3.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 font-label uppercase tracking-widest text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Remove Catering
            </button>
          ) : null}

          <button
            type="button"
            onClick={handleConfirmMenu}
            className="flex-1 py-4 rounded-xl bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label uppercase tracking-widest text-xs font-bold transition-all shadow-[0_0_20px_rgba(200,169,106,0.3)] hover:shadow-[0_0_30px_rgba(200,169,106,0.5)] flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" /> Confirm &amp; Save Menu ({selectedDishes.length} Dishes &bull; {tempRestaurantIds.length} Partners)
          </button>
        </div>
      </div>
    );
  }

  /* ========================================================================= */
  /* DEFAULT VIEW: 3-CARD ADD-ONS HUB                                          */
  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Restaurant Add-on Notice Modal */}
      <RestaurantNoticeModal
        isOpen={showRestaurantNoticeModal}
        onClose={() => setShowRestaurantNoticeModal(false)}
        onConfirm={() => {
          setShowRestaurantNoticeModal(false);
          setSubView("restaurant");
        }}
        restaurantName={getSelectedRestaurantNames()}
        restaurantEmoji="🍽️"
        restaurantCuisine="Curated Event Menus & Platters"
      />

      {/* Header — Crown + Add-Ons */}
      <header className="space-y-3 text-center">
        <div className="flex items-center justify-center gap-3">
          <div className="h-[1px] flex-1 max-w-[60px] bg-gradient-to-r from-transparent to-[#C8A96A]/50" />
          <span className="text-[#C8A96A] text-2xl">👑</span>
          <div className="h-[1px] flex-1 max-w-[60px] bg-gradient-to-l from-transparent to-[#C8A96A]/50" />
        </div>
        <h2 className="font-headline italic text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
          Add-Ons
        </h2>
        <p className="text-white/50 font-body text-sm sm:text-base font-light max-w-md mx-auto">
          Select any of the 3 curated add-ons below to customize your event, or proceed directly to checkout.
        </p>
      </header>

      {/* 3 Compact Horizontal Add-on Cards */}
      <div className="flex flex-col gap-3">

        {/* CARD 1: DJ */}
        <div
          className={cn(
            "rounded-2xl p-3.5 sm:p-4 border transition-all duration-300",
            needDj
              ? "bg-[#C8A96A]/10 border-[#C8A96A] shadow-[0_0_20px_rgba(200,169,106,0.15)]"
              : "bg-[#121614] border-white/10 hover:border-[#C8A96A]/40"
          )}
        >
          <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shrink-0">
              <Music className="w-5 h-5" />
            </div>

            {/* Title + Badge */}
            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-sm sm:text-base text-white leading-snug">
                Live DJ &amp; Music
              </h3>
              <span
                className={cn(
                  "inline-block mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-[2px] rounded-full font-label",
                  needDj
                    ? "bg-[#C8A96A] text-[#0d1612]"
                    : "bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30"
                )}
              >
                {needDj ? "✓ Added" : "Optional"}
              </span>
            </div>

            {/* Price */}
            <span className="font-headline text-lg sm:text-xl text-[#E3C281] font-bold shrink-0">
              $300
            </span>

            {/* Select Button */}
            <button
              type="button"
              onClick={() => setSubView("dj")}
              className={cn(
                "py-2 px-3.5 sm:px-4 rounded-lg font-label uppercase tracking-widest text-[9px] sm:text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap",
                needDj
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  : "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a]"
              )}
            >
              {needDj ? "Edit" : "Select →"}
            </button>
          </div>
        </div>

        {/* CARD 2: Photography / Videography */}
        <div
          className={cn(
            "rounded-2xl p-3.5 sm:p-4 border transition-all duration-300",
            needPhotographer
              ? "bg-[#C8A96A]/10 border-[#C8A96A] shadow-[0_0_20px_rgba(200,169,106,0.15)]"
              : "bg-[#121614] border-white/10 hover:border-[#C8A96A]/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shrink-0">
              <Camera className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-sm sm:text-base text-white leading-snug">
                Photography / Videography
              </h3>
              <span
                className={cn(
                  "inline-block mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-[2px] rounded-full font-label",
                  needPhotographer
                    ? "bg-[#C8A96A] text-[#0d1612]"
                    : "bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30"
                )}
              >
                {needPhotographer ? `✓ ${photographerHours}h Added` : "Optional"}
              </span>
            </div>

            <span className="font-headline text-lg sm:text-xl text-[#E3C281] font-bold shrink-0">
              {needPhotographer ? `$${photographerCost}` : "$300+"}
            </span>

            <button
              type="button"
              onClick={() => setSubView("photography")}
              className={cn(
                "py-2 px-3.5 sm:px-4 rounded-lg font-label uppercase tracking-widest text-[9px] sm:text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap",
                needPhotographer
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  : "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a]"
              )}
            >
              {needPhotographer ? "Edit" : "Select →"}
            </button>
          </div>
        </div>

        {/* CARD 3: Restaurant & Catering */}
        <div
          onClick={() => setShowRestaurantNoticeModal(true)}
          className={cn(
            "rounded-2xl p-3.5 sm:p-4 border transition-all duration-300 cursor-pointer",
            hasCatering
              ? "bg-[#C8A96A]/10 border-[#C8A96A] shadow-[0_0_20px_rgba(200,169,106,0.15)]"
              : "bg-[#121614] border-white/10 hover:border-[#C8A96A]/40"
          )}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#C8A96A]/20 border border-[#C8A96A]/40 flex items-center justify-center text-[#C8A96A] shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-headline text-sm sm:text-base text-white leading-snug">
                Restaurant &amp; Catering
              </h3>
              <span
                className={cn(
                  "inline-block mt-0.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest px-2 py-[2px] rounded-full font-label",
                  hasCatering
                    ? "bg-[#C8A96A] text-[#0d1612]"
                    : "bg-[#C8A96A]/20 text-[#C8A96A] border border-[#C8A96A]/30"
                )}
              >
                {hasCatering ? `✓ ${selectedDishes.length} Dishes` : "Optional"}
              </span>
            </div>

            <span className="font-headline text-lg sm:text-xl text-[#E3C281] font-bold shrink-0">
              Menu
            </span>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setShowRestaurantNoticeModal(true);
              }}
              className={cn(
                "py-2 px-3.5 sm:px-4 rounded-lg font-label uppercase tracking-widest text-[9px] sm:text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 whitespace-nowrap",
                hasCatering
                  ? "bg-white/10 text-white hover:bg-white/20 border border-white/20"
                  : "bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a]"
              )}
            >
              {hasCatering ? "Edit" : "Select →"}
            </button>
          </div>
        </div>

      </div>

      {/* Checkout Action Section */}
      <div className="bg-[#121614] rounded-3xl p-6 sm:p-8 border border-[#C8A96A]/25 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#C8A96A] font-label">
              Add-ons Summary
            </span>
          </div>
          <div className="text-white text-sm">
            {totalAddonsPrice > 0 || hasCatering ? (
              <span className="text-white/80">
                Selected:{" "}
                <strong className="text-[#E3C281]">
                  {[
                    needDj ? "DJ ($300)" : null,
                    needPhotographer ? `Photo (${photographerHours}h - $${photographerCost})` : null,
                    hasCatering ? `Menu (${selectedDishes.length} dishes)` : null
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </strong>
              </span>
            ) : (
              <span className="text-white/50 italic">No add-ons currently selected.</span>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleProceedToCheckout}
            className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#C8A96A] text-[#0d1612] hover:bg-[#d8b97a] font-label uppercase tracking-widest text-xs font-bold transition-all shadow-[0_0_25px_rgba(200,169,106,0.35)] hover:shadow-[0_0_35px_rgba(200,169,106,0.55)] flex items-center justify-center gap-2 cursor-pointer"
          >
            {totalAddonsPrice > 0 || hasCatering ? (
              <>
                Proceed to Checkout (+${totalAddonsPrice}) <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                No Add-ons, Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
