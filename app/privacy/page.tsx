import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#0F2D24] text-[#C8A96A] font-body selection:bg-[#C8A96A] selection:text-[#0F2D24]">
            {/* Header / Navigation Spacer */}
            <nav className="w-full py-8 px-6 md:px-12 flex justify-between items-center bg-[#0F2D24] border-b border-[#C8A96A]/10">
                <Link href="/" className="flex items-center gap-2 group">
                    <span className="text-2xl">🌴</span>
                    <span className="font-headline text-2xl uppercase tracking-wider group-hover:brightness-110 transition-all">TROPICA</span>
                </Link>
                <Link href="/" className="font-label text-xs uppercase tracking-[0.2em] hover:text-white transition-colors">
                    Back to Home
                </Link>
            </nav>

            <main className="max-w-4xl mx-auto py-20 px-6 md:px-12">
                <header className="mb-16 text-center">
                    <h1 className="font-headline text-4xl md:text-6xl mb-6">Privacy Policy</h1>
                    <p className="font-label text-xs uppercase tracking-[0.3em] opacity-60">Last Updated: October 2023</p>
                </header>

                <section className="space-y-12">
                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">1. Introduction</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Welcome to Tropica Sanctuary. We value your privacy and are committed to protecting your personal data. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website and use our booking services.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">2. Information We Collect</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            When you make a reservation, we may collect the following information:
                        </p>
                        <ul className="list-disc list-inside space-y-2 opacity-80 pl-4">
                            <li>Name and contact information (email address, phone number).</li>
                            <li>Booking details (date, time, number of guests).</li>
                            <li>Special requests or preferences.</li>
                            <li>Payment information (processed securely through our payment partners).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">3. How We Use Your Information</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            We use your information to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 opacity-80 pl-4">
                            <li>Process and confirm your reservations.</li>
                            <li>Send you updates and reminders regarding your booking.</li>
                            <li>Improve our services and personalize your experience.</li>
                            <li>Communicate with you regarding special offers and events (only with your consent).</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">4. Data Security</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            We implement a variety of security measures to maintain the safety of your personal information. Your personal data is contained behind secured networks and is only accessible by a limited number of persons who have special access rights to such systems.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">5. Third-Party Disclosure</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information unless we provide you with advance notice. This does not include website hosting partners and other parties who assist us in operating our website, conducting our business, or servicing you.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            No mobile information will be shared with third parties/affiliates for marketing/promotional purposes. Information sharing to subcontractors in support services, such as customer service is permitted. All other use case categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">6. Contact Us</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            If there are any questions regarding this privacy policy, you may contact us using the information below:
                        </p>
                        <div className="mt-4 p-6 bg-[#0F3D2E] rounded-lg border border-[#C8A96A]/10 italic">
                            <p>Tropica Sanctuary</p>
                            <p>Email: Bookings@tropica.nyc</p>
                            <p>Phone: 1 866-990-7422</p>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
