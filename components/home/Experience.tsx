"use client";

export const Experience = () => {
    return (
        <section className="py-16 md:py-24 px-4 md:px-12 bg-[#0F3D2E]">
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
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

