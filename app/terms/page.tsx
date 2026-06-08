import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/shared/Footer';

export default function TermsAndConditions() {
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
                    <h1 className="font-headline text-4xl md:text-6xl mb-6">Terms & Conditions</h1>
                    <p className="font-label text-xs uppercase tracking-[0.3em] opacity-60 italic mb-2">Tropica Private Dining Lounge</p>
                    <p className="font-label text-xs uppercase tracking-[0.3em] opacity-60">Reservation Terms & Conditions</p>
                </header>

                <section className="space-y-12">
                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">1. Acceptance of Terms</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            By making a reservation or entering the premises, guests acknowledge that they have read, understood, and agreed to these Terms & Conditions.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Tropica reserves the right to refuse service or remove any guest at any time for violations of house policies, disruptive behavior, illegal activity, intoxication, safety concerns, harassment, or failure to comply with staff instructions.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">2. Assumption of Risk</h2>
                        <p className="opacity-80 leading-relaxed mb-4 font-semibold italic">
                            Guests voluntarily assume all risks associated with attending Tropica, including but not limited to:
                        </p>
                        <ul className="list-disc list-inside space-y-2 opacity-80 pl-4 mb-4">
                            <li>Slips, trips, falls, or personal injury</li>
                            <li>Food-related allergic reactions</li>
                            <li>Alcohol consumption</li>
                            <li>Exposure to loud music, lighting effects, smoke, fog, or crowded conditions</li>
                            <li>Actions of other guests or third parties</li>
                            <li>Theft, loss, or damage to personal property</li>
                            <li>Parking or transportation-related incidents</li>
                        </ul>
                        <p className="opacity-80 leading-relaxed italic">Attendance is entirely at the guest’s own risk.</p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">3. Release of Liability</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            To the fullest extent permitted by law, Tropica Private Dining Lounge, its owners, staff, affiliates, contractors, entertainers, DJs, chefs, security personnel, vendors, and partners shall not be held liable for:
                        </p>
                        <ul className="list-disc list-inside space-y-2 opacity-80 pl-4 mb-4">
                            <li>Personal injury, Illness, or Death</li>
                            <li>Property damage or Emotional distress</li>
                            <li>Lost or stolen items</li>
                            <li>Food allergies or dietary reactions</li>
                            <li>Accidents occurring on or near the premises</li>
                            <li>Actions of third parties or other patrons</li>
                        </ul>
                        <p className="opacity-80 leading-relaxed">
                            Guests hereby release and discharge Tropica from any and all claims, demands, lawsuits, damages, liabilities, costs, or expenses arising from attendance or participation in any activity at the venue.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">4. Food Allergy & Dietary Disclaimer</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Tropica prepares food in kitchens that may contain or process: Fish, Shellfish, Peanuts, Tree nuts, Dairy, Soy, Wheat, Eggs, and other allergens.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            While reasonable efforts may be made to accommodate dietary requests, Tropica cannot guarantee that any food item is completely allergen-free or free from cross-contamination. Guests with allergies or medical dietary restrictions dine at their own risk.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">5. Alcohol Policy</h2>
                        <p className="opacity-80 leading-relaxed mb-4 font-semibold italic">
                            Guests consuming alcoholic beverages acknowledge and accept full responsibility for their actions and conduct.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Tropica is not responsible for injuries resulting from intoxication, guest conduct after leaving the premises, transportation arrangements, or damages caused by intoxicated guests.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Management reserves the right to refuse alcohol service to any guest at any time. Guests must be 21 years of age or older to consume alcohol and may be required to present valid identification.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">6. Reservation & Deposit Policy</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Reservations may require a deposit, prepayment, card authorization, or minimum spending requirements.
                        </p>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Deposits may be non-refundable depending on the timing of cancellation and event policies. Tropica reserves the right to charge cancellation fees, no-show fees, cleaning fees, damage fees, or minimum-spend shortages where applicable.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">7. Cancellation & No-Show Policy</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Failure to arrive for a reservation without proper notice may result in the loss of deposit, automatic cancellation fees, or restrictions on future reservations. Reservation times may be subject to seating limits and operational scheduling.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">8. Conduct & Removal</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Guests agree to behave respectfully toward staff and other guests. Tropica reserves the right to remove any individual without refund for aggressive behavior, harassment, excessive intoxication, illegal substances, violence or threats, damage to property, or violation of venue rules.
                        </p>
                        <p className="opacity-80 leading-relaxed">
                            Any damages caused by a guest may result in financial liability and legal action.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">9. Personal Property</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            Tropica is not responsible for lost items, stolen belongings, damaged property, or vehicles and their contents. Guests are solely responsible for safeguarding their personal items.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">10. Photography & Media Release</h2>
                        <p className="opacity-80 leading-relaxed mb-4">
                            By entering the premises, guests grant Tropica permission to photograph, record, or film them for promotional, marketing, social media, advertising, or commercial purposes without compensation or additional consent.
                        </p>
                    </div>

                    <div>
                        <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">11. Force Majeure</h2>
                        <p className="opacity-80 leading-relaxed mb-4 italic">
                            Tropica shall not be held responsible for cancellations, delays, interruptions, or inability to perform services due to circumstances beyond its control, including but not limited to weather, government restrictions, emergencies, utility failures, pandemics, labor shortages, acts of God, or security concerns.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">12. Limitation of Liability</h2>
                            <p className="opacity-80 leading-relaxed mb-4">
                                Under no circumstances shall Tropica’s total liability exceed the amount paid by the guest for the applicable reservation or service. Tropica shall not be liable for indirect, incidental, punitive, or consequential damages.
                            </p>
                        </div>
                        <div>
                            <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">13. Indemnification</h2>
                            <p className="opacity-80 leading-relaxed mb-4">
                                Guests agree to indemnify and hold harmless Tropica, its owners, staff, and agents from any claims, damages, or liabilities arising from guest conduct, violation of these terms, or damage caused by guests.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">14. Governing Law</h2>
                            <p className="opacity-80 leading-relaxed mb-4">
                                These Terms & Conditions shall be governed under the laws of the State of New York. Any disputes shall be handled exclusively in the courts located in New York.
                            </p>
                        </div>
                        <div>
                            <h2 className="font-headline text-2xl mb-4 border-b border-[#C8A96A]/20 pb-2">15. Right to Modify</h2>
                            <p className="opacity-80 leading-relaxed mb-4">
                                Tropica reserves the right to modify these Terms at any time without prior notice. Continued use of the venue constitutes acceptance of updated terms.
                            </p>
                        </div>
                    </div>

                    <div className="mt-12 p-8 bg-[#0F3D2E] rounded-xl border border-[#C8A96A]/20 text-center shadow-2xl">
                        <h2 className="font-headline text-2xl mb-4">16. Electronic Agreement</h2>
                        <p className="opacity-90 leading-relaxed italic max-w-2xl mx-auto">
                            By booking online, paying a deposit, checking a consent box, signing electronically, or entering the premises, guests acknowledge and agree to these Terms & Conditions in full.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
