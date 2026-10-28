"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { Sparkles, Compass, HeartHandshake, Wine, ArrowRight } from "lucide-react";

export default function AboutPage() {
  const pillars = [
    {
      icon: Sparkles,
      title: "Botanical Sanctuary",
      description:
        "Surrounded by over 150 rare tropical species, our glass conservatory provides a serene, verdant oasis sheltered from the bustling city rhythm."
    },
    {
      icon: Wine,
      title: "Artisanal Gastronomy",
      description:
        "Every menu is crafted with meticulous seasonal ingredients, organic farm-fresh produce, and curated biodynamic wine pairings."
    },
    {
      icon: Compass,
      title: "Intimate Seclusion",
      description:
        "Designed strictly for privacy. Whether booking a single romantic table or reserving the entire private space, every moment is exclusively yours."
    },
    {
      icon: HeartHandshake,
      title: "Bespoke Hospitality",
      description:
        "From personalized floral arrangements to custom chef tasting menus and ambient lighting, our concierges tailor every detail."
    }
  ];

  const milestones = [
    { number: "1,200+", label: "Celebrations Hosted" },
    { number: "150+", label: "Rare Botanical Flora" },
    { number: "100%", label: "Private & Intimate" },
    { number: "5.0 ★", label: "Guest Satisfaction" }
  ];

  return (
    <div className="min-h-screen bg-[#071912] text-[#E5E7EB] font-body selection:bg-[#C8A96A]/30 selection:text-[#C8A96A] overflow-x-hidden">
      <NavBar />

      {/* Hero Section */}
      <section className="relative w-full min-h-[75vh] flex items-center justify-center pt-28 md:pt-36 pb-20 px-4 overflow-hidden">
        {/* Ambient background glows & image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/venue_ambience.jpg"
            alt="Tropica Sanctuary Ambience"
            fill
            className="object-cover brightness-[0.35] scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071912]/80 via-[#071912]/60 to-[#071912]" />
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#C8A96A]/10 blur-[130px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 border border-[#C8A96A]/35 bg-[#C8A96A]/10 px-4 py-1.5 rounded-full mb-6 backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-[#E5C77A] text-sm">spa</span>
            <span className="font-label text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#E5C77A] font-bold">
              The Story of Tropica
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-headline text-4xl sm:text-6xl md:text-7xl text-[#C8A96A] leading-[1.1] mb-6"
          >
            A Living Haven of <br />
            <span className="italic font-light">Elegance & Intimacy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-body text-[#C8A96A]/80 text-base md:text-xl max-w-2xl mx-auto italic leading-relaxed"
          >
            Founded with a singular vision: to craft a transcendent urban sanctuary where private dining, botanical wonder, and unforgettable gatherings meet.
          </motion.p>
        </div>
      </section>

      {/* Narrative Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Narrative Text */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-0.5 bg-[#C8A96A]" />
              <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                Our Genesis
              </span>
            </div>

            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Reinventing How the City Celebrates
            </h2>

            <p className="text-white/75 text-base md:text-lg leading-relaxed font-body">
              In a metropolis defined by noise and constant movement, Tropica was conceived as an antidote—a secret glasshouse sanctuary where time slows down. Hidden behind discreet botanical facades, our sanctuary brings together lush living greenery, romantic candlelit atmospheres, and world-class gastronomy.
            </p>

            <p className="text-white/70 text-sm md:text-base leading-relaxed font-body">
              Every evening at Tropica is meticulously curated. We do not operate like conventional crowded restaurants; instead, our tables and private garden rooms provide undisturbed sanctuary. Whether marking a momentous proposal, celebrating an anniversary, or gathering your closest inner circle, we ensure your occasion remains deeply personal.
            </p>

            <div className="pt-4 flex flex-wrap gap-4">
              <Link
                href="/book-venue"
                className="inline-flex items-center gap-2 bg-[#C8A96A] text-[#071912] px-7 py-3.5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-black hover:brightness-110 transition-all shadow-lg shadow-[#C8A96A]/20"
              >
                Reserve Sanctuary
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 border border-[#C8A96A]/40 text-[#E5C77A] px-7 py-3.5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all"
              >
                Explore Gallery
              </Link>
            </div>
          </motion.div>

          {/* Visual Showcase */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-[420px] sm:h-[500px] w-full rounded-2xl overflow-hidden border border-[#C8A96A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <Image
                src="/resturant_img1.png"
                alt="Tropica Dining Area"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071912] via-transparent to-transparent opacity-80" />
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-[#071912]/80 backdrop-blur-md border border-[#C8A96A]/20">
                <p className="font-headline text-lg text-[#C8A96A] italic">
                  “The most enchanting dining sanctuary in New York.”
                </p>
                <p className="text-white/60 text-xs tracking-wider uppercase mt-1">
                  Private Garden Conservatory
                </p>
              </div>
            </div>

            {/* Accent Gold Badge */}
            <div className="hidden sm:flex absolute -bottom-6 -right-6 w-32 h-32 rounded-full bg-gradient-to-br from-[#E5C77A] to-[#C8A96A] text-[#071912] flex-col items-center justify-center p-3 text-center shadow-xl font-label">
              <span className="text-[10px] uppercase tracking-widest font-black">Private</span>
              <span className="font-headline text-lg font-bold">100%</span>
              <span className="text-[9px] uppercase tracking-wider">Reserved</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="py-20 bg-[#0F2D24]/60 border-y border-[#C8A96A]/15 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
              Our Core Experience
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl text-white mt-3 mb-4">
              Crafted with Intention
            </h2>
            <p className="text-white/70 text-sm md:text-base font-body italic">
              Every detail—from the acoustic ambiance to botanical aromas—is orchestrated to elevate your senses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <motion.div
                  key={pillar.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-[#071912]/80 border border-[#C8A96A]/20 hover:border-[#C8A96A]/50 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(200,169,106,0.15)] group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center mb-5 text-[#E5C77A] group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline text-xl text-white mb-2 group-hover:text-[#E5C77A] transition-colors">
                    {pillar.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed font-body">
                    {pillar.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Counter Bar */}
      <section className="py-16 bg-[#071912]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-[#C8A96A]/15">
            {milestones.map((m, idx) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="pt-6 md:pt-0 md:px-6"
              >
                <p className="font-headline text-3xl sm:text-5xl text-[#E5C77A] font-bold mb-2">
                  {m.number}
                </p>
                <p className="font-label text-[11px] sm:text-xs uppercase tracking-[0.2em] text-white/60">
                  {m.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote Banner */}
      <section className="py-20 px-4 max-w-4xl mx-auto text-center">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-b from-[#0F3D2E]/60 to-[#071912] border border-[#C8A96A]/30 relative overflow-hidden">
          <div className="absolute top-4 left-6 text-6xl text-[#C8A96A]/20 font-serif leading-none">“</div>
          <p className="font-headline text-2xl sm:text-3xl md:text-4xl text-[#E5C77A] italic leading-snug mb-6 relative z-10">
            We don’t just serve dinner. We curate an emotional retreat where love stories unfold, milestones are celebrated, and memories linger for a lifetime.
          </p>
          <p className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
            The Founders of Tropica Sanctuary
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <Footer />
    </div>
  );
}
