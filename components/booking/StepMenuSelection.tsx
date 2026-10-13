"use client";

import { useState } from "react";
import { UtensilsCrossed, Check, ArrowRight, Flame, Leaf, Sparkles, ChefHat, MessageSquare, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATERING_RESTAURANTS, CateringRestaurant, getCateringRestaurant } from "@/lib/cateringRestaurants";

interface StepMenuSelectionProps {
  restaurantId: string;
  initialSelectedDishes?: string[];
  initialDishQuantities?: Record<string, number>;
  initialCateringNotes?: string;
  onNext: (data: {
    selectedDishes: string[];
    dishQuantities: Record<string, number>;
    cateringNotes: string;
    cateringMenu: string;
  }) => void;
  onChangeRestaurant?: (id: string) => void;
}

export function StepMenuSelection({
  restaurantId,
  initialSelectedDishes = [],
  initialDishQuantities = {},
  initialCateringNotes = "",
  onNext,
  onChangeRestaurant
}: StepMenuSelectionProps) {
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string>(restaurantId || "jamaican_jerk_house");
  const restaurant: CateringRestaurant = getCateringRestaurant(currentRestaurantId);

  // Initialize selected dishes; if none selected, default to the restaurant's signature highlight dishes
  const [selectedDishes, setSelectedDishes] = useState<string[]>(() => {
    if (initialSelectedDishes && initialSelectedDishes.length > 0) {
      return initialSelectedDishes;
    }
    return restaurant.highlightDishes ? [...restaurant.highlightDishes.slice(0, 3)] : [];
  });

  // Track platter quantities per dish
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>(() => {
    if (initialDishQuantities && Object.keys(initialDishQuantities).length > 0) {
      return { ...initialDishQuantities };
    }
    const defaults: Record<string, number> = {};
    const initList = initialSelectedDishes && initialSelectedDishes.length > 0
      ? initialSelectedDishes
      : (restaurant.highlightDishes ? [...restaurant.highlightDishes.slice(0, 3)] : []);
    initList.forEach((d) => { defaults[d] = 1; });
    return defaults;
  });

  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [cateringNotes, setCateringNotes] = useState<string>(initialCateringNotes);

  const handleRestaurantChange = (id: string) => {
    setCurrentRestaurantId(id);
    setActiveCategory("all");
    const newRest = getCateringRestaurant(id);
    const newDishes = newRest.highlightDishes ? [...newRest.highlightDishes.slice(0, 3)] : [];
    setSelectedDishes(newDishes);
    const newQtys: Record<string, number> = {};
    newDishes.forEach((d) => { newQtys[d] = 1; });
    setDishQuantities(newQtys);
    if (onChangeRestaurant) {
      onChangeRestaurant(id);
    }
  };

  const toggleDish = (dishName: string) => {
    setSelectedDishes((prev) => {
      const exists = prev.includes(dishName);
      if (exists) {
        setDishQuantities((q) => {
          const nextQ = { ...q };
          delete nextQ[dishName];
          return nextQ;
        });
        return prev.filter((d) => d !== dishName);
      } else {
        setDishQuantities((q) => ({ ...q, [dishName]: 1 }));
        return [...prev, dishName];
      }
    });
  };

  const updateQuantity = (dishName: string, delta: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDishQuantities((prev) => {
      const current = prev[dishName] || 1;
      const nextVal = Math.max(1, Math.min(20, current + delta));
      return { ...prev, [dishName]: nextVal };
    });
  };

  const handleSelectAllHighlights = () => {
    if (!restaurant.highlightDishes) return;
    const combined = Array.from(new Set([...selectedDishes, ...restaurant.highlightDishes]));
    setSelectedDishes(combined);
    setDishQuantities((prev) => {
      const updated = { ...prev };
      combined.forEach((d) => {
        if (!updated[d]) updated[d] = 1;
      });
      return updated;
    });
  };

  const handleClearSelection = () => {
    setSelectedDishes([]);
    setDishQuantities({});
  };

  const handleContinue = () => {
    onNext({
      selectedDishes,
      dishQuantities,
      cateringNotes,
      cateringMenu: currentRestaurantId
    });
  };

  // Compile items to display
  const categories = restaurant.categories || [];
  const allItems = categories.flatMap((cat) =>
    cat.items.map((item) => ({ ...item, categoryName: cat.categoryName }))
  );

  const displayedItems =
    activeCategory === "all"
      ? allItems
      : allItems.filter((item) => item.categoryName === activeCategory);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Step Header */}
      <header className="space-y-2 sm:space-y-3">
        <div className="flex items-center gap-3">
          <span className="font-headline italic text-[#C8A96A] text-sm sm:text-base">06.</span>
          <div className="h-[1px] w-8 bg-white/20" />
          <span className="font-label uppercase tracking-widest text-[10px] text-white/50 font-bold">
            Catering Menu Selection
          </span>
        </div>
        <h2 className="font-headline italic text-2xl sm:text-4xl md:text-5xl text-white leading-tight">
          Select Your <span className="text-gold-gradient">Event Dishes</span>
        </h2>
        <p className="text-white/60 font-body text-xs sm:text-base font-light">
          Choose the items you want prepared and served for your private event.
        </p>
      </header>

      {/* Selected Restaurant Showcase & Quick Switcher */}
      <section className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#17241d] to-[#111713] border border-[#C8A96A]/30 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-3xl sm:text-4xl p-2 rounded-xl bg-black/40 border border-[#C8A96A]/20">
              {restaurant.emoji}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full bg-[#C8A96A] text-black">
                  {restaurant.cuisine}
                </span>
                <span className="text-[10px] text-[#C8A96A] font-semibold">{restaurant.rating}</span>
              </div>
              <h3 className="font-headline italic text-xl sm:text-2xl text-white font-bold mt-1">
                {restaurant.name}
              </h3>
              <p className="text-xs text-white/60 font-body line-clamp-1">{restaurant.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#C8A96A]">
              ✓ {selectedDishes.length} Dish{selectedDishes.length === 1 ? "" : "es"} Selected
            </span>
          </div>
        </div>

        {/* Quick Restaurant Switcher Pills */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-2">
            Switch Restaurant Partner:
          </p>
          <div className="flex flex-wrap gap-2">
            {CATERING_RESTAURANTS.map((rest) => {
              const isCurrent = rest.id === currentRestaurantId;
              return (
                <button
                  key={rest.id}
                  type="button"
                  onClick={() => handleRestaurantChange(rest.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                    isCurrent
                      ? "bg-[#C8A96A] text-black shadow-md"
                      : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10 border border-white/10"
                  )}
                >
                  <span>{rest.emoji}</span>
                  <span>{rest.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Menu Categories Pills & Quick Actions */}
      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === "all"
                  ? "bg-[#C8A96A] text-black font-bold shadow-md"
                  : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
              )}
            >
              All Items ({allItems.length})
            </button>
            {categories.map((cat, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveCategory(cat.categoryName)}
                className={cn(
                  "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all",
                  activeCategory === cat.categoryName
                    ? "bg-[#C8A96A] text-black font-bold shadow-md"
                    : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                )}
              >
                {cat.categoryName} ({cat.items.length})
              </button>
            ))}
          </div>

          {/* Quick Select Actions */}
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={handleSelectAllHighlights}
              className="text-[11px] text-[#C8A96A] hover:underline font-bold flex items-center gap-1 px-2 py-1 rounded bg-[#C8A96A]/10 border border-[#C8A96A]/20"
            >
              <Sparkles className="w-3 h-3" /> Select Favorites
            </button>
            {selectedDishes.length > 0 && (
              <button
                type="button"
                onClick={handleClearSelection}
                className="text-[11px] text-white/50 hover:text-white font-medium px-2 py-1"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Dish Items Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {displayedItems.map((dish, idx) => {
            const isSelected = selectedDishes.includes(dish.name);
            return (
              <div
                key={idx}
                onClick={() => toggleDish(dish.name)}
                className={cn(
                  "p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between group select-none",
                  isSelected
                    ? "bg-[#18211b] border-[#C8A96A] shadow-[0_0_20px_rgba(200,169,106,0.18)]"
                    : "bg-white/[0.03] border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/[0.06]"
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {/* Checkbox Icon */}
                      <div
                        className={cn(
                          "w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 transition-all",
                          isSelected
                            ? "bg-[#C8A96A] border-[#C8A96A] text-black shadow-sm"
                            : "border-white/30 bg-transparent group-hover:border-white/50"
                        )}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4
                          className={cn(
                            "text-xs sm:text-sm font-bold tracking-wide transition-colors leading-tight",
                            isSelected ? "text-white" : "text-white/90 group-hover:text-white"
                          )}
                        >
                          {dish.name}
                        </h4>
                        <p className="text-[10px] text-white/40 uppercase tracking-widest mt-0.5">
                          {dish.categoryName}
                        </p>
                      </div>
                    </div>

                    {/* Dish Badges */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {dish.spicy && (
                        <span
                          title="Spicy"
                          className="text-[9px] text-red-400 bg-red-400/10 border border-red-400/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold"
                        >
                          <Flame className="w-2.5 h-2.5" /> Spicy
                        </span>
                      )}
                      {dish.vegetarian && (
                        <span
                          title="Vegetarian"
                          className="text-[9px] text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 px-1.5 py-0.5 rounded flex items-center gap-0.5 font-bold"
                        >
                          <Leaf className="w-2.5 h-2.5" /> Veg
                        </span>
                      )}
                      {dish.tag && (
                        <span className="text-[9px] uppercase tracking-wider text-[#C8A96A] bg-[#C8A96A]/15 border border-[#C8A96A]/30 px-1.5 py-0.5 rounded font-bold">
                          {dish.tag}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-white/60 mt-2 leading-relaxed pl-7">
                    {dish.desc}
                  </p>

                  {/* Platter Quantity Stepper when selected */}
                  {isSelected && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="mt-3 pt-2.5 border-t border-[#C8A96A]/20 flex items-center justify-between"
                    >
                      <span className="text-[11px] text-[#C8A96A] font-semibold flex items-center gap-1">
                        Platters / Trays:
                      </span>
                      <div className="flex items-center gap-2 bg-black/40 border border-[#C8A96A]/30 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={(e) => updateQuantity(dish.name, -1, e)}
                          className="w-6 h-6 flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition"
                          title="Decrease platters"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold text-white min-w-[20px] text-center">
                          {dishQuantities[dish.name] || 1}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => updateQuantity(dish.name, 1, e)}
                          className="w-6 h-6 flex items-center justify-center rounded text-white/70 hover:text-white hover:bg-white/10 active:scale-95 transition"
                          title="Increase platters"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Selected Items Summary Strip */}
      {selectedDishes.length > 0 && (
        <section className="p-3.5 rounded-xl bg-white/[0.04] border border-[#C8A96A]/20 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold flex items-center gap-1.5">
              <ChefHat className="w-3.5 h-3.5" /> Selected Event Platters ({selectedDishes.length})
            </p>
            <span className="text-[10px] text-white/40">Included with venue booking</span>
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
            {selectedDishes.map((dish, i) => {
              const qty = dishQuantities[dish] || 1;
              return (
                <span
                  key={i}
                  className="text-[11px] px-2.5 py-1 rounded-lg bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-white font-medium flex items-center gap-2"
                >
                  <span>✓ {dish}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#C8A96A]/20 text-[#C8A96A] font-bold text-[10px]">
                    {qty} {qty === 1 ? "platter" : "platters"}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleDish(dish);
                    }}
                    className="text-white/40 hover:text-white text-xs ml-0.5"
                  >
                    ×
                  </button>
                </span>
              );
            })}
          </div>
        </section>
      )}

      {/* Culinary & Dietary Requests / Notes */}
      <section className="space-y-2 pt-2">
        <label className="text-[11px] uppercase tracking-widest text-white/70 font-bold flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#C8A96A]" />
          <span>Dietary Requests &amp; Catering Notes (Optional)</span>
        </label>
        <textarea
          rows={2}
          value={cateringNotes}
          onChange={(e) => setCateringNotes(e.target.value)}
          placeholder="e.g. Mild spice on jerk chicken, 2 gluten-free plates, serve dessert after speeches..."
          className="w-full bg-white/[0.04] border border-white/15 focus:border-[#C8A96A] rounded-xl p-3 text-xs text-white placeholder-white/30 focus:outline-none transition-all resize-none"
        />
      </section>

      {/* Navigation CTA */}
      <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t border-white/10">
        <div className="text-xs text-white/60">
          <span className="text-white font-bold">{selectedDishes.length}</span> dish{selectedDishes.length === 1 ? "" : "es"} selected from{" "}
          <strong className="text-[#C8A96A]">{restaurant.name}</strong>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            type="button"
            onClick={() => onNext({ selectedDishes: [], dishQuantities: {}, cateringNotes: "", cateringMenu: "none" })}
            className="px-4 py-4 rounded-xl text-xs font-semibold text-white/50 hover:text-white bg-white/5 hover:bg-white/10 transition border border-white/10"
          >
            Skip Catering
          </button>
          <button
            type="button"
            onClick={handleContinue}
            className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] font-black text-xs tracking-[0.2em] uppercase rounded-xl shadow-xl transition-all hover:scale-[1.02] active:scale-95"
          >
            <span>Continue to Summary &amp; Payment</span>
            <ArrowRight className="w-4 h-4 text-[#0d1612]" />
          </button>
        </div>
      </div>
    </div>
  );
}
