"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { Booking, Table } from "@/types";
import {
  CATERING_RESTAURANTS,
  CATERING_LABEL_MAP,
  getCateringRestaurant,
  parseCateringDetails,
  formatCateringNotes
} from "@/lib/cateringRestaurants";
import {
  UtensilsCrossed,
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  Flame,
  Leaf,
  Plus,
  Check,
  X,
  Wine,
  Music,
  Save,
  Loader2,
  AlertCircle,
  TableProperties
} from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

export default function EditBookingMenuPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();

  // Support both /venue-bookings/[id]/edit-menu and ?bookingId=... / ?id=...
  const rawId = (params?.id as string) || searchParams.get("bookingId") || searchParams.get("id");

  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Active section tab (extensible for future options)
  const [activeTab, setActiveTab] = useState<"menu" | "beverages" | "atmosphere">("menu");

  // Editable state
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string>("none");
  const [selectedDishes, setSelectedDishes] = useState<string[]>([]);
  const [dietaryNotes, setDietaryNotes] = useState<string>("");
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [customDishInput, setCustomDishInput] = useState<string>("");

  useEffect(() => {
    if (!rawId) {
      setLoading(false);
      return;
    }

    const fetchBooking = async () => {
      try {
        setLoading(true);
        const { data } = await api.get(`/bookings/${rawId}`);
        if (data.success && data.booking) {
          const b: Booking = data.booking;
          setBooking(b);

          const parsed = parseCateringDetails(b);
          setSelectedRestaurantId(parsed.restaurantKey || "none");
          setSelectedDishes(parsed.dishes);
          setDietaryNotes(parsed.dietaryNotes);
        }
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    fetchBooking();
  }, [rawId]);

  const currentRestaurant = useMemo(() => {
    if (selectedRestaurantId === "none" || selectedRestaurantId === "no_catering") return null;
    return getCateringRestaurant(selectedRestaurantId);
  }, [selectedRestaurantId]);

  useEffect(() => {
    if (currentRestaurant?.categories?.length) {
      setActiveCategory(currentRestaurant.categories[0].categoryName);
    }
  }, [currentRestaurant]);

  const toggleDish = (dishName: string) => {
    setSelectedDishes((prev) =>
      prev.includes(dishName) ? prev.filter((d) => d !== dishName) : [...prev, dishName]
    );
  };

  const removeDish = (dishName: string) => {
    setSelectedDishes((prev) => prev.filter((d) => d !== dishName));
  };

  const handleAddCustomDish = () => {
    const trimmed = customDishInput.trim();
    if (!trimmed) return;
    if (selectedDishes.includes(trimmed)) {
      toast.error("This dish is already in your menu");
      return;
    }
    setSelectedDishes((prev) => [...prev, trimmed]);
    setCustomDishInput("");
    toast.success(`Added "${trimmed}" to menu`);
  };

  const handleSave = async () => {
    if (!booking) return;

    setSaving(true);
    try {
      const parsed = parseCateringDetails(booking);
      const updatedNotes = formatCateringNotes(parsed.baseNotes, selectedDishes, dietaryNotes);

      const { data } = await api.patch(`/bookings/${booking._id}/menu`, {
        cateringMenu: selectedRestaurantId,
        notes: updatedNotes
      });

      if (data.success) {
        toast.success("Catering menu & restaurant updated successfully!");
        setBooking(data.booking);
        router.push("/user/venue-bookings");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update catering preferences");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#C8A96A]" />
        <p className="font-headline italic text-white/80">Loading reservation details...</p>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-4xl mx-auto p-8 text-center space-y-6">
        <AlertCircle className="w-12 h-12 text-[#C8A96A] mx-auto opacity-70" />
        <h2 className="font-headline text-3xl italic text-white">Booking Not Found</h2>
        <p className="text-white/60 text-sm">
          We could not locate this reservation. Please verify the booking ID.
        </p>
        <Link
          href="/user/venue-bookings"
          className="inline-flex items-center gap-2 bg-[#C8A96A] text-[#0b1410] font-bold text-xs uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-[#D6B97A] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Venue Bookings</span>
        </Link>
      </div>
    );
  }

  const assignedTables = booking.tables || [];

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 md:p-10 lg:p-16 space-y-8 md:space-y-12">
      {/* Top Breadcrumb & Return Link */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <Link
          href="/user/venue-bookings"
          className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#C8A96A] hover:text-[#E8CB8A] transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Venue Bookings</span>
        </Link>
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/40">
          <span>Booking #{booking._id.slice(-6).toUpperCase()}</span>
          <span>•</span>
          <span className="text-emerald-400 font-bold">{booking.status}</span>
        </div>
      </div>

      {/* Hero Header */}
      <header className="space-y-3">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-5 h-5 text-[#C8A96A]" />
          <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C8A96A]">
            Private Dining &amp; Menu Customization
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-headline italic tracking-tight text-white leading-tight">
          Customize Your <span className="text-[#C8A96A]">Menu &amp; Restaurant</span>
        </h1>
        <p className="text-sm md:text-base text-white/70 max-w-2xl font-light leading-relaxed">
          Select your partner restaurant, curate signature entrees and sides for your guests, and record special dietary instructions for our culinary team.
        </p>
      </header>

      {/* Booking Overview Card with Assigned Tables */}
      <div className="p-5 md:p-6 rounded-2xl bg-black/40 border border-[#C8A96A]/30 backdrop-blur-md shadow-xl grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#C8A96A] font-bold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5" />
            <span>Date &amp; Time</span>
          </div>
          <p className="font-headline text-lg italic text-white">
            {new Date(booking.bookingDate).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric"
            })}
          </p>
          <p className="text-xs text-white/60 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {booking.bookingTime} ({booking.durationHours || 5} Hours)
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-[#C8A96A] font-bold uppercase tracking-wider">
            <Users className="w-3.5 h-3.5" />
            <span>Party Size &amp; Occasion</span>
          </div>
          <p className="font-headline text-lg italic text-white capitalize">{booking.occasion}</p>
          <p className="text-xs text-white/60">{booking.partySize} Honored Guests</p>
        </div>

        {/* Assigned Tables Section */}
        <div className="md:col-span-2 space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-[#C8A96A] font-bold uppercase tracking-wider">
            <TableProperties className="w-3.5 h-3.5" />
            <span>Assigned Sanctuary Tables</span>
          </div>
          {assignedTables.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-0.5">
              {assignedTables.map((t: Table) => (
                <span
                  key={t._id}
                  className="px-2.5 py-1 rounded-lg bg-[#C8A96A]/15 border border-[#C8A96A]/30 text-[#E8CB8A] text-xs font-mono font-bold flex items-center gap-1"
                >
                  <span>Table #{t.tableNumber}</span>
                  <span className="text-[10px] text-white/50 font-normal">({t.capacity} seats)</span>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/80 italic">
              Exclusive Sanctuary Buyout (All Venue Tables Reserved Exclusively)
            </p>
          )}
        </div>
      </div>

      {/* Special Negotiated Offer Quote / Rate Banner if set */}
      {booking.offerPrice !== undefined && booking.offerPrice !== null && (
        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-[#C8A96A]/20 via-[#C8A96A]/10 to-transparent border border-[#C8A96A]/40 backdrop-blur-md shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#C8A96A]" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#C8A96A]">
                Special Negotiated Offer Quote
              </span>
              <span className="text-[9px] uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">
                {booking.offerStatus || "Offered"}
              </span>
            </div>
            <p className="font-headline text-3xl italic text-white">
              ${Number(booking.offerPrice).toFixed(2)}{" "}
              <span className="text-xs font-mono text-[#C8A96A] font-normal not-italic">
                (Exclusive Rate)
              </span>
            </p>
            {booking.negotiationNotes && (
              <p className="text-xs text-white/90 italic max-w-2xl bg-black/30 p-2.5 rounded-lg border border-white/10">
                "{booking.negotiationNotes}"
              </p>
            )}
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] uppercase tracking-widest text-white/50 block font-mono">
              Total Booking Value
            </span>
            <span className="text-sm font-bold text-white">
              ${booking.totalAmount ? Number(booking.totalAmount).toFixed(2) : Number(booking.offerPrice).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Modular Section Tabs (Extensible for future options) */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("menu")}
          className={cn(
            "py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
            activeTab === "menu"
              ? "bg-[#C8A96A] text-[#0b1410] shadow-md"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <UtensilsCrossed className="w-4 h-4" />
          <span>Catering &amp; Menu Selection</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("beverages")}
          className={cn(
            "py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
            activeTab === "beverages"
              ? "bg-[#C8A96A] text-[#0b1410] shadow-md"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Wine className="w-4 h-4" />
          <span>Beverage &amp; Bar Upgrades</span>
          <span className="text-[9px] lowercase bg-white/10 px-1.5 py-0.2 rounded-full">expansion</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("atmosphere")}
          className={cn(
            "py-2.5 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2",
            activeTab === "atmosphere"
              ? "bg-[#C8A96A] text-[#0b1410] shadow-md"
              : "text-white/60 hover:text-white hover:bg-white/5"
          )}
        >
          <Music className="w-4 h-4" />
          <span>Sound &amp; Ambience Notes</span>
          <span className="text-[9px] lowercase bg-white/10 px-1.5 py-0.2 rounded-full">expansion</span>
        </button>
      </div>

      {/* TAB 1: Catering & Menu Selection */}
      {activeTab === "menu" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Step 1: Select Restaurant */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-headline text-2xl italic text-white">1. Select Catering Restaurant</h3>
                <p className="text-xs text-white/60">Choose a culinary partner or manage catering independently.</p>
              </div>
              {selectedRestaurantId && (
                <span className="text-xs text-[#E8CB8A] font-semibold bg-[#C8A96A]/10 px-3 py-1 rounded-full border border-[#C8A96A]/30">
                  {CATERING_LABEL_MAP[selectedRestaurantId] || selectedRestaurantId}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                      "cursor-pointer rounded-2xl p-4 transition-all duration-300 relative border flex flex-col justify-between group",
                      isSelected
                        ? "bg-[#C8A96A]/15 border-[#C8A96A] ring-2 ring-[#C8A96A]/40 shadow-xl"
                        : "bg-black/40 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                    )}
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl">{rest.emoji}</span>
                        {isSelected && (
                          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                            <Check className="w-3 h-3" /> Selected
                          </span>
                        )}
                      </div>
                      <h4 className="font-headline text-lg italic text-white leading-tight group-hover:text-[#E8CB8A] transition-colors">
                        {rest.name}
                      </h4>
                      <p className="text-xs text-[#C8A96A] font-medium">{rest.cuisine}</p>
                      <p className="text-[11px] text-white/60 line-clamp-2 font-light leading-relaxed">
                        {rest.shortDesc}
                      </p>
                    </div>
                  </div>
                );
              })}

              {/* Option: No Partner Catering */}
              <div
                onClick={() => {
                  setSelectedRestaurantId("none");
                  setSelectedDishes([]);
                }}
                className={cn(
                  "cursor-pointer rounded-2xl p-4 transition-all duration-300 border flex flex-col justify-between group",
                  selectedRestaurantId === "none" || selectedRestaurantId === "no_catering"
                    ? "bg-[#C8A96A]/15 border-[#C8A96A] ring-2 ring-[#C8A96A]/40 shadow-xl"
                    : "bg-black/40 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                )}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🚫</span>
                    {(selectedRestaurantId === "none" || selectedRestaurantId === "no_catering") && (
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <Check className="w-3 h-3" /> Selected
                      </span>
                    )}
                  </div>
                  <h4 className="font-headline text-lg italic text-white leading-tight">
                    No Partner Catering
                  </h4>
                  <p className="text-xs text-white/40 font-medium">Self-Managed / Venue Only</p>
                  <p className="text-[11px] text-white/60 line-clamp-2 font-light leading-relaxed">
                    You bring your own caterer or order directly from your preferred vendor.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Dish Selection (Only if restaurant has categories) */}
          {currentRestaurant && currentRestaurant.categories?.length > 0 && (
            <section className="space-y-6 pt-4 border-t border-white/10">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-headline text-2xl italic text-white">
                    2. Select Dishes from {currentRestaurant.name}
                  </h3>
                  <p className="text-xs text-white/60">
                    Click items to add or remove them from your curated party menu.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#C8A96A] font-bold bg-[#C8A96A]/10 px-3 py-1.5 rounded-xl border border-[#C8A96A]/30">
                    {selectedDishes.length} {selectedDishes.length === 1 ? "Dish" : "Dishes"} Chosen
                  </span>
                </div>
              </div>

              {/* Selected Dishes Tray */}
              {selectedDishes.length > 0 && (
                <div className="p-4 rounded-xl bg-black/60 border border-[#C8A96A]/30 space-y-2">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-[#C8A96A]">
                    Currently Selected Menu:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedDishes.map((dish) => (
                      <span
                        key={dish}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#C8A96A]/20 text-white border border-[#C8A96A]/40"
                      >
                        <span>{dish}</span>
                        <button
                          type="button"
                          onClick={() => removeDish(dish)}
                          className="hover:text-rose-400 transition-colors p-0.5"
                          title="Remove dish"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Create / Add Custom Dish */}
              <div className="p-4 rounded-xl bg-black/40 border border-[#C8A96A]/30 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-[#E8CB8A] font-bold">
                  <Sparkles className="w-4 h-4 text-[#C8A96A]" />
                  <span>Create / Add Custom Dish or Special Item</span>
                </div>
                <p className="text-xs text-white/60">
                  Request dishes not listed in the standard catalog, custom preparations, or dietary substitutions.
                </p>
                <div className="flex flex-wrap sm:flex-nowrap gap-2 pt-1">
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
                    placeholder="e.g. Grilled Garlic Butter Lobster, Truffle Sweet Potato Mash..."
                    className="flex-1 bg-black/60 border border-white/20 focus:border-[#C8A96A] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDish}
                    className="inline-flex items-center gap-1.5 bg-[#C8A96A] hover:bg-[#D6B97A] text-[#0b1410] font-black text-xs uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-md shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Dish</span>
                  </button>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
                {currentRestaurant.categories.map((cat) => (
                  <button
                    key={cat.categoryName}
                    type="button"
                    onClick={() => setActiveCategory(cat.categoryName)}
                    className={cn(
                      "px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all",
                      activeCategory === cat.categoryName
                        ? "bg-[#C8A96A] text-[#0b1410] shadow-md"
                        : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {cat.categoryName}
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentRestaurant.categories
                  .find((c) => c.categoryName === activeCategory)
                  ?.items.map((item) => {
                    const isSelected = selectedDishes.includes(item.name);
                    return (
                      <div
                        key={item.name}
                        onClick={() => toggleDish(item.name)}
                        className={cn(
                          "cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-start justify-between gap-4 group",
                          isSelected
                            ? "bg-[#C8A96A]/20 border-[#C8A96A] shadow-md"
                            : "bg-black/30 border-white/10 hover:border-[#C8A96A]/40 hover:bg-white/5"
                        )}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-headline text-base italic text-white group-hover:text-[#E8CB8A] transition-colors">
                              {item.name}
                            </h5>
                            {item.spicy && (
                              <span className="flex items-center text-[10px] text-rose-400 font-bold bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                                <Flame className="w-2.5 h-2.5 mr-0.5" /> Spicy
                              </span>
                            )}
                            {item.vegetarian && (
                              <span className="flex items-center text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                <Leaf className="w-2.5 h-2.5 mr-0.5" /> Veg
                              </span>
                            )}
                            {item.tag && (
                              <span className="text-[10px] text-[#C8A96A] bg-[#C8A96A]/15 px-1.5 py-0.2 rounded font-semibold">
                                {item.tag}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white/60 leading-relaxed font-light">{item.desc}</p>
                        </div>

                        <button
                          type="button"
                          className={cn(
                            "w-8 h-8 rounded-full shrink-0 flex items-center justify-center transition-all",
                            isSelected
                              ? "bg-[#C8A96A] text-[#0b1410]"
                              : "bg-white/10 text-white/50 group-hover:bg-[#C8A96A]/30 group-hover:text-white"
                          )}
                        >
                          {isSelected ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </section>
          )}

          {/* Step 3: Special Dietary & Chef Instructions */}
          <section className="space-y-3 pt-4 border-t border-white/10">
            <h3 className="font-headline text-xl italic text-white">3. Dietary Preferences &amp; Chef Notes</h3>
            <p className="text-xs text-white/60">
              Mention allergies, spice tolerances, custom sides, or service timing preferences.
            </p>
            <textarea
              rows={3}
              value={dietaryNotes}
              onChange={(e) => setDietaryNotes(e.target.value)}
              placeholder="e.g. 2 guests with peanut allergies, prefer extra fried sweet plantains, mild spice for jerk dishes..."
              className="w-full bg-black/60 border border-white/15 focus:border-[#C8A96A] focus:ring-2 focus:ring-[#C8A96A]/20 rounded-xl p-4 text-sm font-body text-white placeholder:text-white/30 outline-none transition-all resize-none"
            />
          </section>
        </div>
      )}

      {/* TAB 2: Beverage & Bar Upgrades (Modular container for future features) */}
      {activeTab === "beverages" && (
        <div className="p-8 rounded-2xl bg-black/40 border border-white/10 space-y-6 text-center animate-in fade-in duration-300">
          <Wine className="w-12 h-12 text-[#C8A96A] mx-auto opacity-80" />
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-headline text-2xl italic text-white">Bar &amp; Beverage Packages</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Curated wine pairings, champagne towers, and craft mocktail stations are available upon request. Our hospitality concierge will coordinate your beverage setup directly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left max-w-3xl mx-auto pt-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] text-[#C8A96A] font-bold uppercase tracking-wider">Option A</span>
              <h5 className="font-headline text-base italic text-white">Signature Cocktail Service</h5>
              <p className="text-xs text-white/50">Customized welcome drink for your guests.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] text-[#C8A96A] font-bold uppercase tracking-wider">Option B</span>
              <h5 className="font-headline text-base italic text-white">Sommelier Wine Pairing</h5>
              <p className="text-xs text-white/50">Curated red and white wines pairing with entrees.</p>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
              <span className="text-[10px] text-[#C8A96A] font-bold uppercase tracking-wider">Option C</span>
              <h5 className="font-headline text-base italic text-white">Island Mocktail Bar</h5>
              <p className="text-xs text-white/50">Zero-proof tropical fruits, mango puree, and mint.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Sound & Atmosphere (Modular container for future features) */}
      {activeTab === "atmosphere" && (
        <div className="p-8 rounded-2xl bg-black/40 border border-white/10 space-y-6 text-center animate-in fade-in duration-300">
          <Music className="w-12 h-12 text-[#C8A96A] mx-auto opacity-80" />
          <div className="space-y-2 max-w-lg mx-auto">
            <h3 className="font-headline text-2xl italic text-white">Entertainment &amp; Atmosphere</h3>
            <p className="text-xs text-white/70 leading-relaxed">
              Tailor the acoustic and visual vibe of your private sanctuary buyout. Submit your Spotify playlist or coordinate with our in-house DJ.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 max-w-md mx-auto text-xs text-[#E8CB8A]">
            {booking.needDj ? (
              <p className="font-bold flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                DJ Requested on Booking Record (+$300)
              </p>
            ) : (
              <p>No DJ Service requested. Standard ambient sound system will be provided.</p>
            )}
            {booking.needPhotographer && (
              <p className="font-bold flex items-center justify-center gap-1.5 mt-2 pt-2 border-t border-[#C8A96A]/20">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                📷 Photographer Requested: {booking.photographerHours || 2} hrs (+${300 + Math.max(0, (booking.photographerHours || 2) - 2) * 150})
              </p>
            )}
          </div>
        </div>
      )}

      {/* Save Action Footer */}
      <div className="sticky bottom-4 z-30 p-4 sm:p-5 rounded-2xl bg-[#0b1410]/95 border border-[#C8A96A]/40 backdrop-blur-xl shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#C8A96A]/20 flex items-center justify-center text-[#C8A96A]">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-wider">
              {CATERING_LABEL_MAP[selectedRestaurantId] || "No Partner Catering"}
            </p>
            <p className="text-[11px] text-white/60">
              {selectedDishes.length} {selectedDishes.length === 1 ? "dish" : "dishes"} selected for this private event
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/user/venue-bookings"
            className="px-5 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white hover:bg-white/5 text-xs font-bold uppercase tracking-wider transition-all"
          >
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="bg-[#C8A96A] hover:bg-[#D6B97A] text-[#0b1410] font-black text-xs uppercase tracking-widest px-8 py-3.5 rounded-xl transition-all shadow-xl shadow-[#C8A96A]/20 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving Preferences...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Catering Preferences</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
