"use client";

import { NavBar } from "@/components/shared/NavBar";
import { Footer } from "@/components/shared/Footer";
import {
    CheckCircle,
    AlertTriangle,
    Shield,
    Utensils,
    Wine,
    CalendarCheck,
    XCircle,
    UserMinus,
    Lock,
    Camera,
    CloudLightning,
    Scale,
    Handshake,
    Gavel,
    FileEdit,
    Smartphone,
    ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const sections = [
    {
        id: 1,
        title: "1. Acceptance of Terms",
        icon: <CheckCircle className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>By making a reservation or entering the premises, guests acknowledge that they have read, understood, and agreed to these Terms & Conditions.</p>
                <p>Tropica reserves the right to refuse service or remove any guest at any time for violations of house policies, disruptive behavior, illegal activity, intoxication, safety concerns, harassment, or failure to comply with staff instructions.</p>
            </div>
        ),
    },
    {
        id: 2,
        title: "2. Assumption of Risk",
        icon: <AlertTriangle className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-3">
                <p>Guests voluntarily assume all risks associated with attending Tropica, including but not limited to:</p>
                <ul className="list-disc pl-5 space-y-2 text-on-surface/70">
                    <li>Slips, trips, falls, or personal injury</li>
                    <li>Food-related allergic reactions</li>
                    <li>Alcohol consumption</li>
                    <li>Exposure to loud music, lighting effects, smoke, fog, or crowded conditions</li>
                    <li>Actions of other guests or third parties</li>
                    <li>Theft, loss, or damage to personal property</li>
                    <li>Parking or transportation-related incidents</li>
                </ul>
                <p className="font-medium text-[#C8A96A]">Attendance is entirely at the guest’s own risk.</p>
            </div>
        ),
    },
    {
        id: 3,
        title: "3. Release of Liability",
        icon: <Shield className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-3">
                <p>To the fullest extent permitted by law, Tropica Private Dining Lounge, its owners, staff, affiliates, contractors, entertainers, DJs, chefs, security personnel, vendors, and partners shall not be held liable for:</p>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 text-on-surface/70">
                    <li>• Personal injury</li>
                    <li>• Illness</li>
                    <li>• Death</li>
                    <li>• Property damage</li>
                    <li>• Emotional distress</li>
                    <li>• Lost or stolen items</li>
                    <li>• Food allergies or dietary reactions</li>
                    <li>• Accidents occurring on or near the premises</li>
                    <li>• Actions of third parties or other patrons</li>
                </ul>
                <p>Guests hereby release and discharge Tropica from any and all claims, demands, lawsuits, damages, liabilities, costs, or expenses arising from attendance or participation in any activity at the venue.</p>
            </div>
        ),
    },
    {
        id: 4,
        title: "4. Food Allergy & Dietary Disclaimer",
        icon: <Utensils className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Tropica prepares food in kitchens that may contain or process:</p>
                <div className="flex flex-wrap gap-2">
                    {["Fish", "Shellfish", "Peanuts", "Tree nuts", "Dairy", "Soy", "Wheat", "Eggs", "Other allergens"].map(item => (
                        <span key={item} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-[#C8A96A]">
                            {item}
                        </span>
                    ))}
                </div>
                <p>While reasonable efforts may be made to accommodate dietary requests, Tropica cannot guarantee that any food item is completely allergen-free or free from cross-contamination. Guests with allergies or medical dietary restrictions dine at their own risk.</p>
            </div>
        ),
    },
    {
        id: 5,
        title: "5. Alcohol Policy",
        icon: <Wine className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Guests consuming alcoholic beverages acknowledge and accept full responsibility for their actions and conduct. Tropica is not responsible for:</p>
                <ul className="list-disc pl-5 space-y-2 text-on-surface/70">
                    <li>Injuries resulting from intoxication</li>
                    <li>Guest conduct after leaving the premises</li>
                    <li>Transportation arrangements</li>
                    <li>Damages caused by intoxicated guests</li>
                </ul>
                <p>Management reserves the right to refuse alcohol service to any guest at any time. Guests must be 21 years of age or older to consume alcohol and may be required to present valid identification.</p>
            </div>
        ),
    },
    {
        id: 6,
        title: "6. Reservation & Deposit Policy",
        icon: <CalendarCheck className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Reservations may require:</p>
                <ul className="grid grid-cols-2 gap-2 text-on-surface/70">
                    <li>• A deposit</li>
                    <li>• Prepayment</li>
                    <li>• Card authorization</li>
                    <li>• Minimum spending requirements</li>
                </ul>
                <p>Deposits may be non-refundable depending on the timing of cancellation and event policies. Tropica reserves the right to charge cancellation fees, no-show fees, cleaning fees, damage fees, or minimum-spend shortages where applicable.</p>
            </div>
        ),
    },
    {
        id: 7,
        title: "7. Cancellation & No-Show Policy",
        icon: <XCircle className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Failure to arrive for a reservation without proper notice may result in:</p>
                <ul className="list-disc pl-5 space-y-2 text-on-surface/70">
                    <li>Loss of deposit</li>
                    <li>Automatic cancellation fees</li>
                    <li>Restrictions on future reservations</li>
                </ul>
                <p>Reservation times may be subject to seating limits and operational scheduling.</p>
            </div>
        ),
    },
    {
        id: 8,
        title: "8. Conduct & Removal",
        icon: <UserMinus className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Guests agree to behave respectfully toward staff and other guests. Tropica reserves the right to remove any individual without refund for:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ul className="space-y-1 text-on-surface/70">
                        <li>• Aggressive behavior</li>
                        <li>• Harassment</li>
                        <li>• Excessive intoxication</li>
                        <li>• Illegal substances</li>
                    </ul>
                    <ul className="space-y-1 text-on-surface/70">
                        <li>• Violence or threats</li>
                        <li>• Damage to property</li>
                        <li>• Violation of venue rules</li>
                    </ul>
                </div>
                <p>Any damages caused by a guest may result in financial liability and legal action.</p>
            </div>
        ),
    },
    {
        id: 9,
        title: "9. Personal Property",
        icon: <Lock className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Tropica is not responsible for:</p>
                <ul className="list-disc pl-5 space-y-2 text-on-surface/70">
                    <li>Lost items</li>
                    <li>Stolen belongings</li>
                    <li>Damaged property</li>
                    <li>Vehicles or contents of vehicles</li>
                </ul>
                <p>Guests are solely responsible for safeguarding their personal items.</p>
            </div>
        ),
    },
    {
        id: 10,
        title: "10. Photography & Media Release",
        icon: <Camera className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <p>By entering the premises, guests grant Tropica permission to photograph, record, or film them for promotional, marketing, social media, advertising, or commercial purposes without compensation or additional consent.</p>
        ),
    },
    {
        id: 11,
        title: "11. Force Majeure",
        icon: <CloudLightning className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Tropica shall not be held responsible for cancellations, delays, interruptions, or inability to perform services due to circumstances beyond its control, including but not limited to:</p>
                <div className="flex flex-wrap gap-2">
                    {["Weather", "Government restrictions", "Emergencies", "Utility failures", "Pandemics", "Labor shortages", "Acts of God", "Security or safety concerns"].map(item => (
                        <span key={item} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] uppercase tracking-wider text-[#C8A96A]">
                            {item}
                        </span>
                    ))}
                </div>
            </div>
        ),
    },
    {
        id: 12,
        title: "12. Limitation of Liability",
        icon: <Scale className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Under no circumstances shall Tropica’s total liability exceed the amount paid by the guest for the applicable reservation or service.</p>
                <p>Tropica shall not be liable for indirect, incidental, punitive, or consequential damages.</p>
            </div>
        ),
    },
    {
        id: 13,
        title: "13. Indemnification",
        icon: <Handshake className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <div className="space-y-4">
                <p>Guests agree to indemnify and hold harmless Tropica Private Dining Lounge, its owners, affiliates, employees, contractors, vendors, and agents from any claims, damages, losses, legal fees, or liabilities arising from:</p>
                <ul className="list-disc pl-5 space-y-2 text-on-surface/70">
                    <li>Guest conduct</li>
                    <li>Violation of these Terms</li>
                    <li>Damage caused by guests or invitees</li>
                    <li>Injury resulting from guest negligence or misconduct</li>
                </ul>
            </div>
        ),
    },
    {
        id: 14,
        title: "14. Governing Law",
        icon: <Gavel className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <p>These Terms & Conditions shall be governed and interpreted under the laws of the State of New York. Any disputes arising from attendance, reservations, services, or use of the premises shall be handled exclusively in the courts located in New York.</p>
        ),
    },
    {
        id: 15,
        title: "15. Right to Modify Terms",
        icon: <FileEdit className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <p>Tropica reserves the right to modify, update, or revise these Terms & Conditions at any time without prior notice. Continued use of the venue or services constitutes acceptance of any updated terms.</p>
        ),
    },
    {
        id: 16,
        title: "16. Electronic Agreement",
        icon: <Smartphone className="w-5 h-5 text-[#C8A96A]" />,
        content: (
            <p>By booking online, paying a deposit, checking a consent box, signing electronically, or entering the premises, guests acknowledge and agree to these Terms & Conditions in full.</p>
        ),
    },
];

export default function TermsAndConditions() {
    return (
        <div className="theme-astral min-h-screen bg-[#0F3D2E] text-on-surface selection:bg-primary/30 selection:text-primary font-body flex flex-col">
            <NavBar />

            <main className="flex-grow pt-32 pb-20 px-4 md:px-8 max-w-6xl mx-auto w-full">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 mb-8 animate-fade-in">
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A]/40 uppercase">Home</span>
                    <ChevronRight className="w-3 h-3 text-[#C8A96A]/20" />
                    <span className="font-label text-[10px] uppercase tracking-[0.2em] text-[#C8A96A] uppercase font-bold">Terms & Conditions</span>
                </div>

                {/* Hero Header */}
                <div className="mb-16 text-center md:text-left animate-fade-in-slow">
                    <h1 className="font-headline text-4xl md:text-7xl text-on-surface mb-6 font-semibold tracking-tight">
                        Terms & <span className="text-gold-gradient">Conditions</span>
                    </h1>
                    <p className="font-body text-on-surface/60 text-sm md:text-lg max-w-2xl leading-relaxed">
                        Please read these terms carefully before making a reservation or visiting Tropica Private Dining Lounge. Your agreement to these terms ensures a premium and safe experience for all our guests.
                    </p>
                </div>

                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-fade-in">
                    <div className="space-y-8">
                        {sections.map((section) => (
                            <div
                                key={section.id}
                                className="glass-card rounded-2xl p-6 md:p-8 border border-[#C8A96A]/10 hover:border-[#C8A96A]/30 transition-all duration-500 group"
                            >
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-10 h-10 rounded-full bg-[#C8A96A]/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                        {section.icon}
                                    </div>
                                    <h2 className="font-headline text-2xl md:text-3xl text-on-surface group-hover:text-[#E3C281] transition-colors">{section.title}</h2>
                                </div>
                                <div className="font-body text-on-surface/80 leading-relaxed text-sm md:text-base pl-2 border-l border-[#C8A96A]/20">
                                    {section.content}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Reassurance Footer */}
                <div className="mt-20 p-8 md:p-12 text-center bg-white/5 rounded-3xl border border-[#C8A96A]/20 animate-fade-in">
                    <h3 className="font-headline italic text-2xl md:text-4xl text-[#C8A96A] mb-4">Any Questions?</h3>
                    <p className="font-body text-on-surface/60 text-sm md:text-base max-w-lg mx-auto mb-8">
                        If you have any questions regarding these terms or your upcoming visit, please don't hesitate to contact our concierge.
                    </p>
                    <button className="px-8 py-3 bg-[#C8A96A] text-[#0F3D2E] font-label text-[10px] uppercase tracking-[0.25em] rounded-full hover:brightness-110 transition-all font-bold shadow-[0_0_20px_rgba(200,169,106,0.3)]">
                        Contact Concierge
                    </button>
                </div>
            </main>

            <Footer />
        </div>
    );
}
