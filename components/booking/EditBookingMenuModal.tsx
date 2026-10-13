"use client";

import { useState, useMemo, useEffect } from "react";
import { Booking } from "@/types";
import api from "@/lib/axios";
import {
  CATERING_RESTAURANTS,
  CATERING_LABEL_MAP,
  getCateringRestaurant,
  parseCateringDetails,
  formatCateringNotes
} from "@/lib/cateringRestaurants";
import {
  UtensilsCrossed,
  X,
  Plus,
  Minus,
  Check,
  Save,
  Loader2,
  Sparkles,
  Flame,
  Leaf,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface EditBookingMenuModalProps {
  isOpen: boolean;
  booking: Booking | null;
  onClose: () => void;
  onSuccess: (updatedBooking: Booking) => void;
}

export function EditBookingMenuModal({
  isOpen,
  booking,
  onClose,
  onSuccess
}: EditBookingMenuModalProps) {
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("none");
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [dishQuantities, setDishQuantities] = useState<Record<string, number>>({});
  const [dietaryNotes, setDietaryNotes] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [customDishInput, setCustomDishInput] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (booking && isOpen) {
      const parsed = parseCateringDetails(booking);
      setSelectedRestaurantId(parsed.restaurantKey || "none");
      setSelectedDishes(parsed.dishes || []);
      setDishQuantities(parsed.dishQuantities || {});
      setDietaryNotes(parsed.dietaryNotes || "");
    }
  }, [booking, isOpen]);

  const currentRestaurant = useMemo(() => {
    if (selectedRestaurantId === "none" || selectedRestaurantId === "no_catering") return null;
    return getCateringRestaurant(selectedRestaurantId);
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (currentRestaurant?.categories?.length) {
      setActiveCategory(currentRestaurant.categories[0].categoryName);
    } else {
      setActiveCategory("");
    }
  }, [currentRestaurant]);

  if (!isOpen || !booking) return null;

  const toggleDish = (dishName: string) => {
    setSelectedDishes((prev) => {
      if (prev.includes(dishName)) {
        setDishQuantities((q) => {
          const next = { ...q };
          delete next[dishName];
          return next;
        });
        return prev.filter((d) => d !== dishName);
      } else {
        setDishQuantities((q) => ({ ...q, [dishName]: 1 }));
        return [...prev, dishName];
      }
    });
  };

  const removeDish = (dishName: string) => {
    setSelectedDishes((prev) => prev.filter((d) => d !== dishName));
    setDishQuantities((q) => {
      const next = { ...q };
      delete next[dishName];
      return next;
    });
  };

  const updateDishQty = (dishName: string, delta: number) => {
    setDishQuantities((prev) => {
      const current = prev[dishName] || 1;
      const nextVal = Math.max(1, Math.min(50, current + delta));
      return { ...prev, [dishName]: nextVal };
    });
  };

  const handleAddCustomDish = () => {
    const trimmed = customDishInput.trim();
    if (!trimmed) return;
    if (selectedDishes.includes(trimmed)) {
      toast.error("This dish is already in your menu");
      return;
    }
    setSelectedDishes((prev) => [...prev, trimmed]);
    setDishQuantities((q) => ({ ...q, [trimmed]: 1 }));
    setCustomDishInput("");
    toast.success(`Added "${trimmed}" to menu`);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const parsed = parseCateringDetails(booking);
      const updatedNotes = formatCateringNotes(parsed.baseNotes, selectedDishes, dietaryNotes, dishQuantities);

      const { data } = await api.patch(`/bookings/${booking._id}/menu`, {
        cateringMenu: selectedRestaurantId,
        notes: updatedNotes,
        dishQuantities
      });

      if (data.success && data.booking) {
        toast.success("Catering menu & restaurant updated successfully!");
        onSuccess(data.booking);
        onClose();
      } else {
        throw new Error(data.message || "Failed to update menu");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || "Failed to save catering preferences");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#0b1b14] border border-[#C8A96A]/30 rounded-2xl max-w-4xl w-full my-auto max-h-[92vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#C8A96A]/20 bg-[#071610]/90 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#C8A96A]/15 border border-[#C8A96A]/30 flex items-center justify-center text-[#C8A96A]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C8A96A]">
                  Venue Booking Menu
                </span>
                <span className="text-[10px] font-mono text-white/50">
                  #{booking._id.slice(-6).toUpperCase()}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-headline italic text-white">
                Edit Partner Restaurant &amp; Menu
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/user/venue-bookings/${booking._id}/edit-menu`}
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-[#C8A96A] hover:text-[#E8CB8A] bg-[#C8A96A]/10 hover:bg-[#C8A96A]/20 border border-[#C8A96A]/30 px-3 py-1.5 rounded-lg transition-colors"
              title="Open full page editor in new tab"
            >
              <span>Full Page</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="text-white/60 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto flex-1 text-sm font-body">
          {/* Step 1: Restaurant Selector */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-[#C8A96A] flex items-center gap-1.5">
                <span>1. Select Culinary Partner</span>
              </label>
              {selectedRestaurantId && (
                <span className="text-[11px] text-[#E8CB8A] font-semibold bg-[#C8A96A]/10 px-2.5 py-0.5 rounded-full border border-[#C8A96A]/30">
                  {CATERING_LABEL_MAP[selectedRestaurantId] || selectedRestaurantId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {CATERING_RESTAURANTS.map((rest) => {
                const isSelected = selectedRestaurantId === rest.id;
                return (
                  <div
                    key={rest.id}
                    onClick={() => {
                      setSelectedRestaurantId(rest.id);
                      if (rest.id !== selectedRestaurantId) {
                        setSelectedDishes([]);
                      }
                    }}
                    className={cn(
                      "cursor-pointer rounded-xl p-3.5 transition-all duration-200 border flex flex-col justify-between text-left",
                      isSelected
                        ? "bg-[#C8A96A]/20 border-[#C8A96A] ring-2 ring-[#C8A96A]/40 shadow-lg"
                        : "bg-black/30 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                    )}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xl">{rest.emoji}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5" /> Selected
                          </span>
                        )}
                      </div>
                      <h4 className="font-headline text-base italic text-white leading-tight">
                        {rest.name}
                      </h4>
                      <p className="text-[11px] text-[#C8A96A] font-medium">{rest.cuisine}</p>
                      <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                        {rest.shortDesc}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* No Partner Catering */}
              <div
                onClick={() => {
                  setSelectedRestaurantId("none");
                  setSelectedDishes([]);
                }}
                className={cn(
                  "cursor-pointer rounded-xl p-3.5 transition-all duration-200 border flex flex-col justify-between text-left",
                  selectedRestaurantId === "none" || selectedRestaurantId === "no_catering"
                    ? "bg-[#C8A96A]/20 border-[#C8A96A] ring-2 ring-[#C8A96A]/40 shadow-lg"
                    : "bg-black/30 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                )}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🚫</span>
                    {(selectedRestaurantId === "none" || selectedRestaurantId === "no_catering") && (
                      <span className="flex items-center gap-1 text-[9px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-2.5 h-2.5" /> Selected
                      </span>
                    )}
                  </div>
                  <h4 className="font-headline text-base italic text-white leading-tight">
                    No Partner Catering
                  </h4>
                  <p className="text-[11px] text-white/40 font-medium">Self-Managed / Venue Only</p>
                  <p className="text-[10px] text-white/60 line-clamp-2 leading-relaxed">
                    Bring your own private catering or handle food independently.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Selected Dishes Tray & Create Custom Dish */}
          <section className="space-y-3 pt-3 border-t border-white/10">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[#C8A96A]">
                2. Curated Menu Dishes ({selectedDishes.length} Selected)
              </label>
              {selectedDishes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedDishes([])}
                  className="text-[10px] text-rose-400 hover:underline"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Currently Selected Badges */}
            {selectedDishes.length > 0 ? (
              <div className="p-3.5 rounded-xl bg-black/40 border border-[#C8A96A]/25 flex flex-wrap gap-2">
                {selectedDishes.map((dish) => {
                  const qty = dishQuantities[dish] || 1;
                  return (
                    <span
                      key={dish}
                      className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-[#C8A96A]/20 text-white border border-[#C8A96A]/40"
                    >
                      <span>{dish}</span>
                      <div className="flex items-center gap-1 bg-black/50 px-1 py-0.5 rounded border border-white/20">
                        <button
                          type="button"
                          onClick={() => updateDishQty(dish, -1)}
                          className="w-3.5 h-3.5 flex items-center justify-center rounded text-white/60 hover:text-white"
                          title="Decrease platters"
                        >
                          <Minus className="w-2.5 h-2.5" />
                        </button>
                        <span className="font-bold text-[#C8A96A] text-[10px] min-w-[12px] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateDishQty(dish, 1)}
                          className="w-3.5 h-3.5 flex items-center justify-center rounded text-white/60 hover:text-white"
                          title="Increase platters"
                        >
                          <Plus className="w-2.5 h-2.5" />
                        </button>
                      </div>
                      <span className="text-[10px] text-white/40">
                        {qty === 1 ? "platter" : "platters"}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeDish(dish)}
                        className="text-white/60 hover:text-rose-400 transition-colors ml-0.5"
                        title="Remove"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">
                No dishes chosen yet. Select items below or create custom dishes.
              </p>
            )}

            {/* Create Custom Dish Input Box */}
            <div className="p-3 rounded-xl bg-[#071610] border border-[#C8A96A]/30 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-[#E8CB8A] font-bold">
                <Sparkles className="w-3.5 h-3.5 text-[#C8A96A]" />
                <span>Create / Add Custom Dish or Special Item</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customDishInput}
                  onChange={(e) => setCustomDishInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddCustomDish();
                    }
                  }}
                  placeholder="e.g. Garlic Herb Grilled Salmon, Plantain Tarts, Coconut Sorbet..."
                  className="flex-1 bg-black/50 border border-white/15 focus:border-[#C8A96A] rounded-lg px-3 py-2 text-xs text-white placeholder:text-white/30 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={handleAddCustomDish}
                  className="inline-flex items-center gap-1 bg-[#C8A96A] hover:bg-[#D6B97A] text-[#071610] font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Dish</span>
                </button>
              </div>
            </div>
          </section>

          {/* Step 3: Browse Category Items (if restaurant selected) */}
          {currentRestaurant && currentRestaurant.categories?.length > 0 && (
            <section className="space-y-3 pt-3 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#C8A96A]">
                  3. Select Items from {currentRestaurant.name}
                </label>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1.5 pb-1">
                {currentRestaurant.categories.map((cat) => (
                  <button
                    key={cat.categoryName}
                    type="button"
                    onClick={() => setActiveCategory(cat.categoryName)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all",
                      activeCategory === cat.categoryName
                        ? "bg-[#C8A96A] text-[#071610]"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {currentRestaurant.categories
                  .find((c) => c.categoryName === activeCategory)
                  ?.items.map((item) => {
                    const isSelected = selectedDishes.includes(item.name);
                    return (
                      <div
                        key={item.name}
                        onClick={() => toggleDish(item.name)}
                        className={cn(
                          "cursor-pointer p-3 rounded-xl border transition-all duration-150 flex items-start justify-between gap-2.5",
                          isSelected
                            ? "bg-[#C8A96A]/20 border-[#C8A96A]"
                            : "bg-black/30 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h5 className="font-headline text-sm italic text-white leading-tight">
                              {item.name}
                            </h5>
                            {item.spicy && (
                              <span className="flex items-center text-[9px] text-rose-400 font-bold bg-rose-500/10 px-1 py-0.2 rounded border border-rose-500/20">
                                <Flame className="w-2.5 h-2.5 mr-0.5" /> Spicy
                              </span>
                            )}
                            {item.vegetarian && (
                              <span className="flex items-center text-[9px] text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded border border-emerald-500/20">
                                <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/60 line-clamp-2 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>

                        <button
                          type="button"
                          className={cn(
                            "w-6 h-6 rounded-md shrink-0 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-[#C8A96A] text-[#071610]"
                              : "bg-white/10 text-white/50"
                          )}
                        >
                          {isSelected ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Step 4: Dietary Notes */}
          <section className="space-y-2 pt-3 border-t border-white/10">
            <label className="text-xs font-bold uppercase tracking-wider text-[#C8A96A] block">
              4. Dietary Notes &amp; Special Chef Instructions
            </label>
            <textarea
              rows={2}
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="e.g. 2 guests with shellfish allergies, medium spice for jerk dishes, serve entrees at 7:30 PM..."
              className="w-full bg-black/50 border border-white/15 focus:border-[#C8A96A] rounded-xl p-3 text-xs text-white placeholder:text-white/30 outline-none transition-all resize-none"
            />
          </section>
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#C8A96A]/20 bg-[#071610]/95 flex items-center justify-between gap-3 sticky bottom-0 z-20">
          <div className="text-xs text-white/60">
            <span className="text-[#C8A96A] font-bold">{selectedDishes.length}</span> dishes ready to save
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-white/20 text-white/70 hover:text-white text-xs font-bold uppercase tracking-wider transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-[#C8A96A] hover:bg-[#D6B97A] text-[#071610] font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#C8A96A]/20 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Menu Preferences</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
