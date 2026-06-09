import React from 'react';
import { Sparkles, Utensils, Music, Users } from 'lucide-react';

const features = [
    {
        icon: <Utensils className="w-6 h-6" />,
        title: "Culinary Excellence",
        description: "Indulge in a curated menu of seasonal delights prepared by our master chefs."
    },
    {
        icon: <Sparkles className="w-6 h-6" />,
        title: "Intimate Atmosphere",
        description: "Our garden sanctuary offers a private and serene environment for your special moments."
    },
    {
        icon: <Music className="w-6 h-6" />,
        title: "Vibes & Audio",
        description: "Experience a perfect blend of ambient soundscapes and premium private space music."
    },
    {
        icon: <Users className="w-6 h-6" />,
        title: "Private Gatherings",
        description: "The ideal venue for private parties, corporate events, and intimate celebrations."
    }
];

export const Experience = () => {
    return (
        <section className="py-16 md:py-24 px-4 md:px-12 bg-[#0F3D2E]">
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
                                Handcrafted Seasonal Cocktails
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                                Organic & Locally Sourced Ingredients
                            </li>
                            <li className="flex items-center gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#C8A96A]" />
                                Bespoke Interior Design
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
};
