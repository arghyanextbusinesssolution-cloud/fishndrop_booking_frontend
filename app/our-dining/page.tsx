"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import { NavSpinnerLink } from "@/components/shared/NavSpinnerLink";
import {
  Sparkles,
  Users,
  Music,
  Utensils,
  Wine,
  Clock,
  Star,
  ArrowRight,
  ChevronRight,
  Gem,
  PartyPopper,
  Heart,
  Crown,
  Flame,
} from "lucide-react";

const diningPackages = [
  {
    icon: Heart,
    title: "Intimate Dinner",
    guests: "2–6 Guests",
    description:
      "A romantic candlelit evening beneath our botanical canopy, ideal for proposals, anniversaries, and intimate celebrations.",
    features: [
      "Private garden alcove",
      "Personalized 4-course menu",
      "Curated wine pairing",
      "Custom floral arrangement",
    ],
    accent: "from-rose-500/20 to-[#C8A96A]/20",
  },
  {
    icon: PartyPopper,
    title: "Celebration Event",
    guests: "10–30 Guests",
    description:
      "Reserve our enchanting garden conservatory for birthdays, corporate dinners, and milestone events with full bespoke service.",
    features: [
      "Full sanctuary buyout",
      "Dedicated event coordinator",
      "4-hour DJ & sound system",
      "Custom lighting design",
    ],
    accent: "from-amber-500/20 to-[#C8A96A]/20",
    featured: true,
  },
  {
    icon: Crown,
    title: "Grand Gala",
    guests: "30–60 Guests",
    description:
      "The ultimate private venue experience for luxury gatherings, launches, and unforgettable galas in our complete sanctuary.",
    features: [
      "Entire venue exclusive",
      "Multi-course tasting menu",
      "Premium bar & mixologist",
      "Photographer on-site",
    ],
    accent: "from-violet-500/20 to-[#C8A96A]/20",
  },
];

const venueHighlights = [
  {
    icon: Utensils,
    title: "Partner Catering",
    description:
      "Choose from 3 award-winning NYC partner restaurants — Caribbean Jerk, Mexican Street Tacos, and Soul Food — each offering curated menus.",
  },
  {
    icon: Music,
    title: "Live Entertainment",
    description:
      "Enjoy a 4-hour professional DJ set with ambient soundscaping, or bring your own performer with our premium audio system.",
  },
  {
    icon: Wine,
    title: "Craft Bar Service",
    description:
      "Signature cocktail menu, premium spirits, and curated biodynamic wine selections crafted by our in-house mixologist.",
  },
  {
    icon: Sparkles,
    title: "Ambiance Design",
    description:
      "Bespoke floral installations, candlelit pathways, custom lighting schemes, and botanical decor tailored to your vision.",
  },
  {
    icon: Users,
    title: "Concierge Service",
    description:
      "A dedicated event coordinator from planning to execution — managing vendors, timelines, and every detail of your evening.",
  },
  {
    icon: Clock,
    title: "Flexible Scheduling",
    description:
      "Choose from afternoon garden brunches, sunset cocktail hours, or signature evening experiences across all seasons.",
  },
];

const testimonials = [
  {
    quote:
      "Our anniversary dinner at Tropica was nothing short of magical. The garden, the food, the attention to detail — absolutely flawless.",
    author: "Jessica & Marcus",
    event: "Anniversary Dinner",
  },
  {
    quote:
      "We booked the full venue for our company celebration. The team was blown away — best corporate event we've ever hosted.",
    author: "David Chen",
    event: "Corporate Gala",
  },
  {
    quote:
      "I proposed under the fairy lights in the garden conservatory. She said yes! Tropica made the night unforgettable.",
    author: "Robert K.",
    event: "Proposal Evening",
  },
];

export default function OurDiningPage() {
  return (
    <div className="min-h-screen bg-[#071912] text-[#E5E7EB] font-body selection:bg-[#C8A96A]/30 selection:text-[#C8A96A] overflow-x-hidden">
      <NavBar />

      {/* ── Hero Section ── */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center pt-28 md:pt-36 pb-20 px-4 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/venue_ambience.jpg"
            alt="Tropica Private Dining Venue"
            fill
            className="object-cover brightness-[0.3] scale-105"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#071912]/70 via-[#071912]/40 to-[#071912]" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#C8A96A]/8 blur-[150px] rounded-full pointer-events-none" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center gap-2 border border-[#C8A96A]/35 bg-[#C8A96A]/10 px-5 py-2 rounded-full mb-6 backdrop-blur-md"
          >
            <Flame className="w-4 h-4 text-[#E5C77A]" />
            <span className="font-label text-[10px] md:text-xs uppercase tracking-[0.25em] text-[#E5C77A] font-bold">
              Private Venue Dining
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="font-headline text-4xl sm:text-6xl md:text-8xl text-[#C8A96A] leading-[1.05] mb-6"
          >
            Our Private <br />
            <span className="italic font-light">Dining Experience</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="font-body text-[#C8A96A]/80 text-base md:text-xl max-w-2xl mx-auto italic leading-relaxed mb-10"
          >
            Reserve our enchanting botanical sanctuary for intimate dinners,
            celebrations, and unforgettable private gatherings. Every detail,
            meticulously curated for your occasion.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <NavSpinnerLink
              href="/book-venue"
              className="w-full sm:w-auto bg-[#C8A96A] text-[#0F3D2E] px-10 py-5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-xl shadow-[#C8A96A]/20 text-center"
            >
              Reserve Your Date
            </NavSpinnerLink>
            <NavSpinnerLink
              href="https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"
              external
              className="w-full sm:w-auto border border-[#C8A96A]/30 text-[#C8A96A] px-10 py-5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all text-center"
            >
              Schedule a Tour
            </NavSpinnerLink>
          </motion.div>
        </div>
      </section>

      {/* ── Venue Highlights Grid ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[#0F2D24]/40 border-y border-[#C8A96A]/15">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
              What We Offer
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl text-white mt-3 mb-4">
              A <span className="italic text-[#E5C77A]">Complete</span> Private
              Venue
            </h2>
            <p className="text-white/70 text-sm md:text-base font-body italic">
              From culinary excellence to ambient design, every element of your
              private event is crafted to perfection.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {venueHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.08 }}
                  className="bg-[#071912]/80 border border-[#C8A96A]/20 hover:border-[#C8A96A]/50 rounded-2xl p-7 transition-all duration-300 hover:shadow-[0_10px_30px_rgba(200,169,106,0.12)] group"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#C8A96A]/10 border border-[#C8A96A]/30 flex items-center justify-center mb-5 text-[#E5C77A] group-hover:scale-110 group-hover:bg-[#C8A96A] group-hover:text-[#071912] transition-all duration-500">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="font-headline text-xl text-white mb-2 group-hover:text-[#E5C77A] transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed font-body">
                    {item.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Dining Packages ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
              Dining Packages
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl text-white mt-3 mb-4">
              Tailored to Your{" "}
              <span className="italic text-[#E5C77A]">Vision</span>
            </h2>
            <p className="text-white/70 text-sm md:text-base font-body italic">
              Whether an intimate dinner for two or a grand gala, every package
              is fully customizable to match your occasion.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {diningPackages.map((pkg, idx) => {
              const Icon = pkg.icon;
              return (
                <motion.div
                  key={pkg.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: idx * 0.12 }}
                  className={`relative rounded-3xl overflow-hidden border transition-all duration-300 hover:shadow-[0_15px_40px_rgba(200,169,106,0.2)] group ${
                    pkg.featured
                      ? "border-[#C8A96A] bg-gradient-to-b from-[#C8A96A]/10 to-[#071912]"
                      : "border-[#C8A96A]/20 bg-[#071912]/80 hover:border-[#C8A96A]/50"
                  }`}
                >
                  {pkg.featured && (
                    <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-[#C8A96A] via-[#E5C77A] to-[#C8A96A] text-[#071912] text-center py-2 font-label text-[10px] uppercase tracking-[0.3em] font-black">
                      <div className="flex items-center justify-center gap-2">
                        <Star className="w-3 h-3" />
                        Most Popular
                        <Star className="w-3 h-3" />
                      </div>
                    </div>
                  )}

                  <div className={`p-8 ${pkg.featured ? "pt-14" : ""}`}>
                    <div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${pkg.accent} border border-[#C8A96A]/30 flex items-center justify-center mb-6 text-[#E5C77A] group-hover:scale-110 transition-transform`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>

                    <h3 className="font-headline text-2xl text-white mb-1 group-hover:text-[#E5C77A] transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="font-label text-xs uppercase tracking-[0.2em] text-[#C8A96A] font-bold mb-4">
                      {pkg.guests}
                    </p>
                    <p className="text-white/70 text-sm leading-relaxed font-body mb-6">
                      {pkg.description}
                    </p>

                    <ul className="space-y-3 mb-8">
                      {pkg.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-white/80 text-sm font-body"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A] flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>

                    <NavSpinnerLink
                      href="/book-venue"
                      className={`w-full flex items-center justify-center gap-2 py-4 rounded-xl font-label text-xs uppercase tracking-[0.2em] font-bold transition-all ${
                        pkg.featured
                          ? "bg-[#C8A96A] text-[#071912] hover:brightness-110 shadow-lg shadow-[#C8A96A]/20"
                          : "border border-[#C8A96A]/40 text-[#E5C77A] hover:bg-[#C8A96A]/10"
                      }`}
                    >
                      <span>Reserve Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </NavSpinnerLink>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Visual Showcase / Split Section ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12 bg-[#0F2D24]/30">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="relative h-[420px] sm:h-[520px] w-full rounded-3xl overflow-hidden border border-[#C8A96A]/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
              <Image
                src="/resturant_img1.png"
                alt="Tropica Dining Experience"
                fill
                className="object-cover hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#071912] via-transparent to-transparent opacity-70" />
              <div className="absolute bottom-6 left-6 right-6 p-5 rounded-xl bg-[#071912]/80 backdrop-blur-md border border-[#C8A96A]/20">
                <p className="font-headline text-lg text-[#C8A96A] italic">
                  "An evening at Tropica is not just dinner — it's a
                  transformative sensory journey."
                </p>
                <p className="text-white/50 text-xs tracking-wider uppercase mt-2">
                  Private Dining Conservatory
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-0.5 bg-[#C8A96A]" />
              <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
                The Venue
              </span>
            </div>

            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-white leading-tight">
              Your Personal <br />
              <span className="italic text-[#E5C77A]">Garden Sanctuary</span>
            </h2>

            <p className="text-white/75 text-base md:text-lg leading-relaxed font-body">
              Nestled behind lush botanical facades, our venue transforms into
              your exclusive sanctuary for the evening. Every corner is designed
              for intimate connection — from candlelit garden corridors to our
              signature glass conservatory.
            </p>

            <ul className="space-y-4 font-label text-[11px] uppercase tracking-[0.2em] text-[#C8A96A]/70 font-bold">
              {[
                "Full-venue private buyout available",
                "Customizable lighting & ambiance",
                "In-house catering from 3 partner restaurants",
                "Premium sound system & DJ booth",
                "Complimentary event coordination",
              ].map((item) => (
                <li key={item} className="flex items-center gap-4">
                  <div className="w-2 h-2 rounded-full bg-[#C8A96A]" />
                  {item}
                </li>
              ))}
            </ul>

            <div className="pt-4 flex flex-wrap gap-4">
              <NavSpinnerLink
                href="/book-venue"
                className="inline-flex items-center gap-2 bg-[#C8A96A] text-[#071912] px-8 py-4 rounded-full font-label text-xs uppercase tracking-[0.2em] font-black hover:brightness-110 transition-all shadow-lg shadow-[#C8A96A]/20"
              >
                <span>Book Your Private Event</span>
                <ArrowRight className="w-4 h-4" />
              </NavSpinnerLink>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 border border-[#C8A96A]/40 text-[#E5C77A] px-8 py-4 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all"
              >
                View Gallery
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 md:py-28 px-4 sm:px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="font-label text-xs uppercase tracking-[0.25em] text-[#C8A96A] font-bold">
              Guest Stories
            </span>
            <h2 className="font-headline text-3xl sm:text-5xl text-white mt-3 mb-4">
              Moments That{" "}
              <span className="italic text-[#E5C77A]">Linger</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <motion.div
                key={t.author}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-[#0F2D24]/60 border border-[#C8A96A]/20 hover:border-[#C8A96A]/40 transition-all group"
              >
                <div className="text-4xl text-[#C8A96A]/30 font-serif leading-none mb-4">
                  "
                </div>
                <p className="font-body text-white/80 text-sm leading-relaxed italic mb-6">
                  {t.quote}
                </p>
                <div className="pt-4 border-t border-[#C8A96A]/15">
                  <p className="font-headline text-base text-[#E5C77A]">
                    {t.author}
                  </p>
                  <p className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/60 mt-1">
                    {t.event}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-20 px-4 bg-gradient-to-b from-[#0F2D24]/50 to-[#071912]">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="p-10 sm:p-14 rounded-3xl bg-gradient-to-b from-[#0F3D2E]/60 to-[#071912] border border-[#C8A96A]/30 relative overflow-hidden"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[200px] bg-[#C8A96A]/5 blur-[100px] rounded-full pointer-events-none" />

            <Gem className="w-10 h-10 text-[#C8A96A]/40 mx-auto mb-6" />
            <h2 className="font-headline text-3xl sm:text-4xl md:text-5xl text-[#E5C77A] italic leading-snug mb-4 relative z-10">
              Ready to Create Your <br />
              Unforgettable Evening?
            </h2>
            <p className="text-white/70 text-sm md:text-base font-body italic max-w-lg mx-auto mb-8">
              Reserve Tropica's private sanctuary for your next celebration.
              Limited dates available — secure yours today.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <NavSpinnerLink
                href="/book-venue"
                className="w-full sm:w-auto bg-[#C8A96A] text-[#071912] px-10 py-5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-black hover:brightness-110 transition-all shadow-xl shadow-[#C8A96A]/25 text-center"
              >
                Book Private Venue
              </NavSpinnerLink>
              <NavSpinnerLink
                href="https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"
                external
                className="w-full sm:w-auto border border-[#C8A96A]/30 text-[#E5C77A] px-10 py-5 rounded-full font-label text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all text-center"
              >
                Schedule a Tour
              </NavSpinnerLink>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
