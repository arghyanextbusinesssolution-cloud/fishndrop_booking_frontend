export default function TourFailedPage() {
  return (
    <div className="min-h-screen bg-[#0F3D2E] flex items-center justify-center px-4">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Error Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/20 border border-red-500/30 flex items-center justify-center mx-auto">
          <svg className="w-12 h-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <span className="font-label text-[10px] uppercase tracking-[0.4em] text-red-400 font-bold">
            Payment Failed
          </span>
          <h1 className="font-headline text-4xl md:text-5xl italic text-white">
            Something Went Wrong
          </h1>
          <p className="font-body text-white/70 text-sm md:text-base leading-relaxed">
            Your tour booking payment could not be processed. No charges were made to your card. 
            Please try again or contact us for assistance.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <a
            href="/book-tour"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full bg-[#C8A96A] text-[#0F3D2E] font-label text-[11px] uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all"
          >
            Try Again
          </a>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-2 w-full py-4 rounded-full border border-[#C8A96A]/30 text-[#C8A96A] font-label text-[11px] uppercase tracking-[0.2em] font-bold hover:bg-[#C8A96A]/10 transition-all"
          >
            Return to Home
          </a>
        </div>
      </div>
    </div>
  );
}

