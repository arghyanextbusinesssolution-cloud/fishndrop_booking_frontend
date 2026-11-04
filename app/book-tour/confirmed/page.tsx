import { Suspense } from "react";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function TourConfirmedPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <TourConfirmedContent />
    </Suspense>
  );
}

function TourConfirmedContent() {
  return (
    <div className="min-h-screen bg-[#0F3D2E] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Success Icon */}
        <div className="w-24 h-24 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <span className="font-label text-[10px] uppercase tracking-[0.4em] text-[#C8A96A] font-bold">
            Tour Confirmed
          </span>
          <h1 className="font-headline text-4xl md:text-5xl italic text-[#C8A96A]">
            You&apos;re All Set!
          </h1>
          <p className="font-body text-white/70 text-sm md:text-base leading-relaxed">
            Your physical tour of Tropica Sanctuary has been booked and your $25 deposit has been received. 
            Our team will reach out shortly to confirm the tour details.
          </p>
        </div>

        {/* Info Card */}
        <div className="rounded-2xl border border-[#C8A96A]/20 bg-[#1a1c1b] p-6 text-left space-y-4">
          <h3 className="font-label text-xs uppercase tracking-widest text-[#C8A96A] font-bold">What Happens Next</h3>
          <div className="space-y-3">
            {[
              { icon: "📧", text: "You'll receive a confirmation email with your tour receipt" },
              { icon: "📞", text: "Our team will call you to confirm the tour schedule" },
              { icon: "🌿", text: "Arrive at Tropica Sanctuary and experience the magic in person" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <span className="text-xl mt-0.5">{item.icon}</span>
                <p className="text-white/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#C8A96A] text-[#0F3D2E] font-label text-[11px] uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all"
        >
          Return to Home
        </a>
      </div>
    </div>
  );
}

