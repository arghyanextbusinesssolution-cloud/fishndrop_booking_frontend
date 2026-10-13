"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, UtensilsCrossed, Star, CheckCircle, Sparkles, Flame, Leaf } from "lucide-react";
import { CateringRestaurant } from "@/lib/cateringRestaurants";

interface CateringRestaurantModalProps {
  restaurant: CateringRestaurant | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRestaurant?: (id: string) => void;
  isSelected?: boolean;
}

export function CateringRestaurantModal({
  restaurant,
  isOpen,
  onClose,
  onSelectRestaurant,
  isSelected = false
}: CateringRestaurantModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeCategory, setActiveCategory] = useState<number>(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen || !restaurant || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[999999] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      style={{ height: "100dvh", minHeight: "100vh" }}
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl sm:max-w-3xl h-[85dvh] max-h-[85dvh] sm:h-auto sm:max-h-[88vh] flex flex-col bg-[#111413] border border-[#C8A96A]/40 rounded-3xl shadow-2xl overflow-hidden text-white my-auto animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Background Hero & Badges */}
        <div className="relative h-36 sm:h-52 w-full overflow-hidden flex-shrink-0">
          <img
            src={restaurant.image}
            alt={restaurant.name}
            className="w-full h-full object-cover brightness-[0.65]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#111413] via-[#111413]/40 to-transparent" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-black/60 border border-white/20 text-white/80 hover:text-white hover:bg-black/90 flex items-center justify-center transition-all"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Top Tag Badges */}
          <div className="absolute top-4 left-4 flex flex-wrap gap-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-[#C8A96A] text-black shadow-md flex items-center gap-1.5">
              <span>{restaurant.emoji}</span>
              {restaurant.cuisine}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-black/70 border border-white/20 text-[#C8A96A] backdrop-blur-sm flex items-center gap-1">
              <Star className="w-3 h-3 fill-[#C8A96A]" />
              {restaurant.rating}
            </span>
          </div>

          {/* Title & Tagline in Hero */}
          <div className="absolute bottom-4 left-5 right-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-wide flex items-center gap-2 drop-shadow-md">
              {restaurant.name}
            </h2>
            <p className="text-xs sm:text-sm text-white/80 mt-1 drop-shadow font-light">
              {restaurant.tagline}
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-7 py-5 space-y-6">
          {/* Restaurant Description */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
            <p className="text-xs text-white/70 leading-relaxed font-body">
              {restaurant.fullDesc}
            </p>
          </div>

          {/* Highlight Signature Dishes */}
          {restaurant.highlightDishes && restaurant.highlightDishes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#C8A96A] font-bold mb-2.5 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Signature Event Highlights
              </p>
              <div className="flex flex-wrap gap-2">
                {restaurant.highlightDishes.map((dish, i) => (
                  <span
                    key={i}
                    className="px-3 py-1.5 rounded-lg bg-[#C8A96A]/10 border border-[#C8A96A]/30 text-xs text-white/90 font-medium"
                  >
                    ✨ {dish}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Menu Category Tabs */}
          {restaurant.categories && restaurant.categories.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <p className="text-xs uppercase tracking-wider text-white/50 font-bold flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-[#C8A96A]" /> Curated Catering Menu
                </p>
                <span className="text-[11px] text-white/40">
                  {restaurant.categories[activeCategory]?.items.length || 0} items in category
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {restaurant.categories.map((cat, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveCategory(idx)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      activeCategory === idx
                        ? "bg-[#C8A96A] text-black font-bold shadow-md"
                        : "bg-white/5 text-white/60 hover:text-white hover:bg-white/10 border border-white/10"
                    }`}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>

              {/* Dish Items in Active Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {restaurant.categories[activeCategory]?.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-[#C8A96A]/30 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-white tracking-wide">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.spicy && (
                            <span title="Spicy" className="text-[10px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Flame className="w-2.5 h-2.5" /> Spicy
                            </span>
                          )}
                          {item.vegetarian && (
                            <span title="Vegetarian" className="text-[10px] text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Leaf className="w-2.5 h-2.5" /> Veg
                            </span>
                          )}
                          {item.tag && (
                            <span className="text-[9px] uppercase tracking-wider text-[#C8A96A] bg-[#C8A96A]/10 border border-[#C8A96A]/30 px-1.5 py-0.5 rounded font-bold">
                              {item.tag}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-white/60 mt-1.5 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-black/40 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-white/50 text-center sm:text-left">
            Included in your private event reservation package.
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-all"
            >
              Close
            </button>

            {onSelectRestaurant && (
              <button
                type="button"
                onClick={() => {
                  onSelectRestaurant(restaurant.id);
                  onClose();
                }}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg ${
                  isSelected
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-[#C8A96A] text-black hover:bg-[#d6b97a]"
                }`}
              >
                {isSelected ? (
                  <>
                    <CheckCircle className="w-4 h-4" /> Selected For Event
                  </>
                ) : (
                  <>
                    <span>Select This Restaurant</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
