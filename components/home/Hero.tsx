"use client";

import React, { useState } from 'react';
import { NavSpinnerLink, SpinnerButton } from '@/components/shared/NavSpinnerLink';

interface HeroProps {
    onTableReservationClick?: () => void;
}

export const Hero = ({ onTableReservationClick }: HeroProps) => {
    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden pt-24 md:pt-32">
            {/* Background Media */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="w-full h-full object-cover brightness-[0.5]"
                >
                    <source src="/banner_video.mp4" type="video/mp4" />
                    <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBSXkv1bUTfT0-n4B887NnK9lcdaAiQyHPUtwpI2g6sJ0UQBso7OcEN2Dg3borLpRXTCX2tJ-QL503TjPzXaaN4Z6fFCSUQ-Dr3HOAJsaVPtXr4cT5ZEfkq-P4ymleX1dq06oIwT4y_m3FyXZJrO8OfUo3fYpHWFs-NeCormJTzH7wip230wKeAzC5uLw5oIT9-3tMWHffcAe8evlWkHjo1MRqSZZHcn695Ha5hmSI21seRVrl4KiuT-H_og6c0QrVR_ssiG2g3Oxo"
                        alt="Tropica Sanctuary Banner"
                        className="w-full h-full object-cover"
                    />
                </video>
                <div className="absolute inset-0 bg-black/40" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center px-4 max-w-5xl mt-12 md:mt-0">
                <h1 className="font-headline text-4xl md:text-8xl text-[#C8A96A] mb-4 md:mb-6 leading-tight animate-fade-in-up">
                    Your Private <br />
                    <span className="italic">Garden Sanctuary</span>
                </h1>
                <p className="font-body text-[#C8A96A]/80 text-sm md:text-xl mb-8 md:mb-10 max-w-2xl mx-auto italic animate-fade-in-up delay-200 px-4">
                    A hidden gem crafted for intimate dining, celebrations, and unforgettable evenings in the heart of the city.
                </p>
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up delay-500 w-full md:w-auto px-6 md:px-0">
                    <NavSpinnerLink
                        href="/book-venue"
                        className="w-full md:w-auto bg-[#C8A96A] text-[#0F3D2E] px-8 md:px-10 py-4 md:py-5 rounded-full font-label text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:scale-105 transition-all shadow-xl shadow-[#C8A96A]/20"
                    >
                        RESERVE THE PRIVATE SPACE
                    </NavSpinnerLink>
                    <NavSpinnerLink
                        href="https://api.leadconnectorhq.com/widget/booking/hh2gGpKwljrlKAb3FzN1"
                        external
                        className="w-full md:w-auto border border-[#C8A96A]/30 text-[#C8A96A] px-8 md:px-10 py-4 md:py-5 rounded-full font-label text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all font-body text-center"
                    >
                        BOOK A TOUR
                    </NavSpinnerLink>
                    {onTableReservationClick ? (
                        <SpinnerButton
                            onClickAsync={onTableReservationClick}
                            className="w-full md:w-auto border border-[#C8A96A]/30 text-[#C8A96A] px-8 md:px-10 py-4 md:py-5 rounded-full font-label text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all font-body"
                        >
                            TABLE RESERVATION
                        </SpinnerButton>
                    ) : (
                        <a
                            href="#reservations"
                            className="w-full md:w-auto border border-[#C8A96A]/30 text-[#C8A96A] px-8 md:px-10 py-4 md:py-5 rounded-full font-label text-[10px] md:text-xs uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all"
                        >
                            TABLE RESERVATION
                        </a>
                    )}
                </div>
            </div>

            {/* Scroll Indicator */}
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-40 animate-bounce">
                <span className="font-label text-[8px] uppercase tracking-[0.3em] text-[#C8A96A]">Scroll</span>
                <div className="w-[1px] h-12 bg-gradient-to-b from-[#C8A96A] to-transparent" />
            </div>
        </section>
    );
};
