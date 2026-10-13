"use client";

import React, { useState } from 'react';
import { Sparkles, Utensils, Music, Users, ExternalLink, Eye, Star, ChevronRight } from 'lucide-react';
import { CATERING_RESTAURANTS, CateringRestaurant } from '@/lib/cateringRestaurants';
import { CateringRestaurantModal } from '@/components/booking/CateringRestaurantModal';
import Link from 'next/link';

const features = [
    {
        icon: <Utensils className="w-6 h-6" />,
        title: "Culinary Partners",
        description: "Curated catering from 3 top NYC partner restaurants: Caribbean Jerk, Mexican Street Tacos, and Soul Food."
    },
    {
        icon: <Sparkles className="w-6 h-6" />,
        title: "Intimate Atmosphere",
        description: "Our garden sanctuary offers a private and serene environment for your special moments."
    },
    {
        icon: <Music className="w-6 h-6" />,
        title: "Vibes & Audio",
        description: "Experience a perfect blend of ambient soundscapes and optional 4-hour live DJ service."
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Private Gatherings",
        description: "The ideal venue for private parties, corporate events, and intimate celebrations."
    }
];

export const Experience = () => {
    const [selectedRestaurant, setSelectedRestaurant] = useState<CateringRestaurant | null>(null);

    return (
        <section className="py-16 md:py-24 px-4 md:px-12 bg-[#0F3D2E]">
            {/* Interactive Restaurant Menu Modal */}
            <CateringRestaurantModal
                restaurant={selectedRestaurant}
                isOpen={Boolean(selectedRestaurant)}
                onClose={() => setSelectedRestaurant(null)}
            />

            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12 md:mb-16">
                    <span className="font-label text-[8px] md:text-[10px] uppercase tracking-[0.4em] text-[#C8A96A] font-bold">The Experience</span>
                    <h2 className="font-headline text-3xl md:text-6xl text-[#C8A96A] mt-4 mb-6 leading-tight">A Sanctuary for the Senses</h2>
                    <div className="h-[1px] w-16 md:w-24 bg-[#C8A96A]/30 mx-auto" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    {features.map((feature, index) => (
                        <div key={index} className="flex flex-col items-center text-center group">
                            <div className="w-16 h-16 rounded-2xl bg-[#0F2D24] border border-[#C8A96A]/20 flex items-center justify-center text-[#C8A96A] mb-6 group-hover:bg-[#C8A96A] group-hover:text-[#0F3D2E] transition-all duration-500 shadow-lg">
                                {feature.icon}
                            </div>
                            <h3 className="font-headline text-2xl text-[#C8A96A] mb-3">{feature.title}</h3>
                            <p className="font-body text-[#C8A96A]/60 text-sm leading-relaxed max-w-xs italic">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>

                {/* ─── 3 Partner Catering Restaurants Section ─── */}
                <div className="mt-24 pt-16 border-t border-[#C8A96A]/20">
                    <div className="text-center mb-12">
                        <span className="font-label text-[9px] uppercase tracking-[0.3em] text-[#C8A96A] font-bold">Private Event Dining</span>
                        <h3 className="font-headline text-3xl md:text-5xl text-white mt-2">Partner Catering Menus</h3>
                        <p className="text-[#C8A96A]/70 text-sm max-w-xl mx-auto mt-3 font-body font-light">
                            Every private event reservation includes curated dining from our 3 partner restaurants. Click any restaurant below to view their full catering menu and specialty dishes.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {CATERING_RESTAURANTS.filter(r => r.id !== "custom_catering").map((rest) => (
                            <div
                                key={rest.id}
                                className="rounded-3xl overflow-hidden bg-[#0A261D] border border-[#C8A96A]/30 flex flex-col justify-between group hover:border-[#C8A96A] transition-all duration-300 shadow-xl"
                            >
                                <div className="relative h-52 overflow-hidden">
                                    <img
                                        src={rest.image}
                                        alt={rest.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 brightness-[0.75]"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A261D] via-transparent to-black/40" />

                                    <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/70 border border-white/20 text-[#C8A96A] backdrop-blur-sm">
                                            {rest.cuisine}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#C8A96A] text-black">
                                            {rest.emoji}
                                        </span>
                                    </div>

                                    <div className="absolute bottom-3 left-4 right-4">
                                        <h4 className="font-headline text-2xl text-white font-bold drop-shadow">
                                            {rest.name}
                                        </h4>
                                    </div>
                                </div>

                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                    <div>
                                        <p className="text-xs text-white/70 font-body leading-relaxed">
                                            {rest.shortDesc}
                                        </p>

                                        <div className="flex flex-wrap gap-1.5 mt-4">
                                            {rest.highlightDishes.slice(0, 3).map((dish, i) => (
                                                <span key={i} className="text-[10px] px-2 py-0.5 rounded-md bg-[#C8A96A]/10 text-[#C8A96A] border border-[#C8A96A]/20">
                                                    ✨ {dish}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-white/10 flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setSelectedRestaurant(rest)}
                                            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider bg-[#C8A96A] text-[#0d1612] hover:bg-[#D6B97A] transition-all shadow-md"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>View Menu</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            href="/book-venue"
                            className="inline-flex items-center gap-3 px-8 py-4 bg-[#C8A96A] text-[#0F3D2E] hover:bg-[#D6B97A] font-black text-xs uppercase tracking-[0.2em] rounded-xl shadow-xl transition-all hover:scale-105"
                        >
                            <span>Book Private Venue with Catering</span>
                            <ChevronRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>

                <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl border border-[#C8A96A]/10">
                        <img
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD4qH16qwWZ8umR_Zj--U_ihIIxlL9L707YZ20Ml3SkjLt2Mx8WTmhxAfeL7KFjr71UBXr0FH84TXwsJBLFoDS1PNpA8WNWQ7Fdhld9S301PZJkyr4II6cTTQ-dmFO6l-3UY33Yf4SdWGqBosz6VwKzL5pxlAhJTbpCyWb6mnLR4iTlozoV-Jxz-aDytNZk2w_PH4x30nwPIcUubQzcHd2bysEM8-E36G4O4ILDEcvOCOvmXErwS1xDk5vyOeXJGgYe1RxwyNSsMN0"
                            alt="Private Space Experience"
                            className="w-full h-full object-cover hover:scale-110 transition-transform duration-1000"
                        />
                    </div>
                    <div className="space-y-8">
                        <h3 className="font-headline text-3xl md:text-5xl text-[#C8A96A] leading-tight">
                            Crafted with <br /> Passion and <span className="italic text-[#C8A96A]/60">Elegance</span>
                        </h3>
                        <p className="font-body text-[#C8A96A]/80 leading-relaxed italic">
                            Step into a world where every detail is meticulously planned to provide you with the ultimate dining experience. Our lush garden oasis provides a stunning backdrop for memories that will last a lifetime.
                        </p>
                        <ul className="space-y-4 font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/60 font-bold">
                            <li className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                                Curated NYC Partner Menus
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                                Handcrafted Seasonal Cocktails
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                                Live DJ &amp; Sound Production
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};

