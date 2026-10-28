"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Eye, X, ChevronLeft, ChevronRight, Sparkles, Filter } from "lucide-react";

interface GalleryItem {
  id: string;
  title: string;
  category: "all" | "garden" | "dining" | "culinary" | "cocktails" | "events";
  categoryLabel: string;
  image: string;
  description: string;
  aspect?: "tall" | "wide" | "square";
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "1",
    title: "The Garden Conservatory",
    category: "garden",
    categoryLabel: "The Sanctuary",
    image: "/venue_ambience.jpg",
    description: "Our signature botanical greenhouse illuminated under bespoke golden chandeliers.",
    aspect: "wide"
  },
  {
    id: "2",
    title: "Intimate Canopy Table",
    category: "dining",
    categoryLabel: "Private Dining",
    image: "/resturant_img1.png",
    description: "Secluded dining enclave ensconced in living palms, tailored for romantic evenings.",
    aspect: "tall"
  },
  {
    id: "3",
    title: "Smoked Hibiscus Botanical Elixir",
    category: "cocktails",
    categoryLabel: "Signature Cocktails",
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=1200&q=80",
    description: "Crafted with artisanal agave, house-made floral cordials, and cold smoke infusion.",
    aspect: "square"
  },
  {
    id: "4",
    title: "Tasting Menu: Seared Diver Scallops",
    category: "culinary",
    categoryLabel: "Culinary Art",
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80",
    description: "Served with cauliflower velouté, white truffle emulsion, and micro greens.",
    aspect: "wide"
  },
  {
    id: "5",
    title: "Private Milestone Celebration",
    category: "events",
    categoryLabel: "Private Events",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80",
    description: "Exclusive full-sanctuary buyout customized with bespoke floral arches and ambient lighting.",
    aspect: "tall"
  },
  {
    id: "6",
    title: "Midnight Orchid Old Fashioned",
    category: "cocktails",
    categoryLabel: "Signature Cocktails",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=80",
    description: "Japanese whiskey rested in sherry casks, infused with dark orchid nectar and orange bitters.",
    aspect: "square"
  },
  {
    id: "7",
    title: "Candlelit Garden Corridor",
    category: "garden",
    categoryLabel: "The Sanctuary",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    description: "The verdant walkway guiding guests to their secluded botanical dining gazebos.",
    aspect: "wide"
  },
  {
    id: "8",
    title: "Prime Dry-Aged Wagyu Filet",
    category: "culinary",
    categoryLabel: "Culinary Art",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80",
    description: "A5 Wagyu served with roasted shallot jus, black garlic puree, and foraged forest mushrooms.",
    aspect: "tall"
  },
  {
    id: "9",
    title: "Intimate Proposal Setting",
    category: "events",
    categoryLabel: "Private Events",
    image: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1200&q=80",
    description: "Private glasshouse illuminated by thousands of fairy lights for a momentous question.",
    aspect: "square"
  },
  {
    id: "10",
    title: "The Sommelier's Reserve",
    category: "dining",
    categoryLabel: "Private Dining",
    image: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80",
    description: "Rare vintage champagnes and Old World wines curated specifically for multi-course dining.",
    aspect: "tall"
  },
  {
    id: "11",
    title: "Valrhona Dark Chocolate Ganache",
    category: "culinary",
    categoryLabel: "Culinary Art",
    image: "https://images.unsplash.com/photo-1579372786545-d24232daf58c?auto=format&fit=crop&w=1200&q=80",
    description: "Gold leaf crisp, passionfruit gel, and house-churned Tahitian vanilla bean gelato.",
    aspect: "wide"
  },
  {
    id: "12",
    title: "Botanical Solarium Gathering",
    category: "events",
    categoryLabel: "Private Events",
    image: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
    description: "An evening of laughter, champagne toasts, and live acoustic acoustics in the garden.",
    aspect: "square"
  }
];

const CATEGORIES = [
  { id: "all", label: "All Exhibits" },
  { id: "garden", label: "The Sanctuary" },
  { id: "dining", label: "Private Dining" },
  { id: "culinary", label: "Culinary Art" },
  { id: "cocktails", label: "Cocktails" },
  { id: "events", label: "Private Events" },
  { id: "guest_memories", label: "Guest Memories" }
];

export default function GalleryPage() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [communityItems, setCommunityItems] = useState<GalleryItem[]>([]);

  useEffect(() => {
    const fetchCommunityPhotos = async () => {
      try {
        const { default: api } = await import("@/lib/axios");
        const res = await api.get("/gallery/public");
        if (res.data?.success && Array.isArray(res.data.photos)) {
          const mapped: GalleryItem[] = res.data.photos.map((p: any) => ({
            id: p._id,
            title: p.title,
            category: p.category || "guest_memories",
            categoryLabel:
              p.category === "dining"
                ? "Private Dining"
                : p.category === "garden"
                ? "The Sanctuary"
                : p.category === "cocktails"
                ? "Cocktails"
                : p.category === "culinary"
                ? "Culinary Art"
                : p.category === "events"
                ? "Private Events"
                : "Guest Memories",
            image: p.imageUrl,
            description: p.description || `Captured by ${p.userName || "Guest Member"}`,
            aspect: "wide"
          }));
          setCommunityItems(mapped);
        }
      } catch (err) {
        console.error("Failed to load community photos", err);
      }
    };

    fetchCommunityPhotos();
  }, []);

  const allItems = [...communityItems, ...GALLERY_ITEMS];

  const filteredItems = activeCategory === "all"
    ? allItems
    : allItems.filter((item) => item.category === activeCategory);

  const currentItem = selectedItemIndex !== null ? filteredItems[selectedItemIndex] : null;

  const handleNext = useCallback(() => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) => (prev! + 1) % filteredItems.length);
  }, [selectedItemIndex, filteredItems.length]);

  const handlePrev = useCallback(() => {
    if (selectedItemIndex === null) return;
    setSelectedItemIndex((prev) => (prev! - 1 + filteredItems.length) % filteredItems.length);
  }, [selectedItemIndex, filteredItems.length]);

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedItemIndex === null) return;
      if (e.key === "Escape") setSelectedItemIndex(null);
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handlePrev();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItemIndex, handleNext, handlePrev]);

  return (
    <div className="min-h-screen bg-[#071912] text-[#E5E7EB] font-body selection:bg-[#C8A96A]/30 selection:text-[#C8A96A] overflow-x-hidden">
      <NavBar />

      {/* Hero Header */}
      <section className="relative w-full pt-32 md:pt-40 pb-16 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#0F3D2E]/40 via-[#071912]/80 to-[#071912]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[250px] bg-[#C8A96A]/10 blur-[120px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 border border-[#C8A96A]/35 bg-[#C8A96A]/10 px-4 py-1.5 rounded-full mb-5 backdrop-blur-md"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5C77A]" />
            <span className="font-label text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#E5C77A] font-bold">
              Visual Chronicle
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-headline text-4xl sm:text-6xl md:text-7xl text-[#C8A96A] mb-4 leading-tight"
          >
            Sanctuary <span className="italic font-light">Gallery</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="font-body text-[#C8A96A]/80 text-base md:text-lg max-w-2xl mx-auto italic"
          >
            A curated glimpse into our candlelit glasshouse, private botanical dining enclaves, and artisan gastronomy.
          </motion.p>
        </div>
      </section>

      {/* Filter Tabs */}
      <section className="sticky top-20 z-30 bg-[#071912]/95 backdrop-blur-xl border-y border-[#C8A96A]/20 py-4 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-start md:justify-center gap-2 overflow-x-auto scrollbar-none pb-1 md:pb-0">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedItemIndex(null);
                }}
                className={`cursor-pointer whitespace-nowrap px-4 sm:px-5 py-2 rounded-full font-label text-[11px] uppercase tracking-[0.2em] font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-[#C8A96A] text-[#071912] shadow-md shadow-[#C8A96A]/25 scale-105"
                    : "text-white/70 hover:text-white hover:bg-white/5 border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* Gallery Masonry / Grid */}
      <section className="py-12 md:py-20 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          <AnimatePresence>
            {filteredItems.map((item, index) => (
              <motion.div
                layout
                key={item.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
                onClick={() => setSelectedItemIndex(index)}
                className="group relative cursor-pointer rounded-2xl overflow-hidden bg-[#0F2D24]/40 border border-[#C8A96A]/25 hover:border-[#C8A96A] transition-all duration-500 shadow-xl hover:shadow-[0_15px_35px_rgba(200,169,106,0.2)]"
              >
                <div className="relative h-72 sm:h-80 w-full overflow-hidden">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.9]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071912] via-[#071912]/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Category Pill */}
                  <div className="absolute top-4 left-4 z-10">
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] px-3 py-1 rounded-full bg-[#071912]/80 backdrop-blur-md text-[#E5C77A] border border-[#C8A96A]/30">
                      {item.categoryLabel}
                    </span>
                  </div>

                  {/* View Overlay Icon */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="w-12 h-12 rounded-full bg-[#C8A96A] text-[#071912] flex items-center justify-center shadow-lg transform scale-75 group-hover:scale-100 transition-transform">
                      <Eye className="w-6 h-6" />
                    </div>
                  </div>

                  {/* Card Description at Bottom */}
                  <div className="absolute bottom-0 inset-x-0 p-5 z-10">
                    <h3 className="font-headline text-xl text-white group-hover:text-[#E5C77A] transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-white/70 text-xs line-clamp-2 mt-1 font-body">
                      {item.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </section>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedItemIndex !== null && currentItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 sm:p-8"
            onClick={() => setSelectedItemIndex(null)}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedItemIndex(null)}
              aria-label="Close image preview"
              className="absolute top-6 right-6 z-20 w-12 h-12 rounded-full bg-white/10 hover:bg-[#C8A96A] hover:text-[#071912] text-white flex items-center justify-center transition-all border border-white/20"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Prev Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              aria-label="Previous image"
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#071912]/80 hover:bg-[#C8A96A] hover:text-[#071912] text-white flex items-center justify-center transition-all border border-[#C8A96A]/40"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Next Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              aria-label="Next image"
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-[#071912]/80 hover:bg-[#C8A96A] hover:text-[#071912] text-white flex items-center justify-center transition-all border border-[#C8A96A]/40"
            >
              <ChevronRight className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-4xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden border border-[#C8A96A]/30 bg-[#071912] shadow-2xl"
            >
              <div className="relative w-full h-[55vh] sm:h-[65vh] bg-black">
                <Image
                  src={currentItem.image}
                  alt={currentItem.title}
                  fill
                  className="object-contain"
                  priority
                />
              </div>

              {/* Caption Footer */}
              <div className="p-6 bg-[#071912] border-t border-[#C8A96A]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] px-2.5 py-0.5 rounded bg-[#C8A96A]/20 text-[#E5C77A] border border-[#C8A96A]/30">
                      {currentItem.categoryLabel}
                    </span>
                    <span className="text-white/40 text-xs">
                      {selectedItemIndex + 1} of {filteredItems.length}
                    </span>
                  </div>
                  <h3 className="font-headline text-xl sm:text-2xl text-white">
                    {currentItem.title}
                  </h3>
                  <p className="text-white/70 text-sm mt-1 max-w-xl font-body">
                    {currentItem.description}
                  </p>
                </div>

                <a
                  href="/book-venue"
                  className="whitespace-nowrap bg-[#C8A96A] text-[#071912] px-6 py-2.5 rounded-full font-label text-[11px] uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all shadow-md shadow-[#C8A96A]/20"
                >
                  Reserve Experience
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
