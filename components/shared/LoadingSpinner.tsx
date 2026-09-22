"use client";

interface Props {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = "Loading...", fullPage = true }: Props) {
  const loaderContent = (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center select-none animate-in fade-in duration-500">
      {/* Outer spinning ring with inner glowing emblem */}
      <div className="relative flex items-center justify-center w-24 h-24">
        {/* Soft glowing ambient background */}
        <div className="absolute inset-0 rounded-full bg-[#C8A96A]/20 blur-xl animate-pulse" />
        {/* Gold spinning outer ring */}
        <div className="w-20 h-20 rounded-full border-2 border-[#C8A96A]/20 border-t-[#C8A96A] border-r-[#E5C77A] animate-spin shadow-[0_0_30px_rgba(200,169,106,0.25)]" />
        {/* Pulsing center gold dot */}
        <div className="absolute w-3.5 h-3.5 rounded-full bg-[#C8A96A] animate-ping opacity-80" />
        <div className="absolute w-2 h-2 rounded-full bg-[#E5C77A]" />
      </div>

      <div className="space-y-2 max-w-xs">
        <p className="font-headline text-2xl italic tracking-wider text-[#E5C77A] drop-shadow-sm font-semibold">
          TROPICA SANCTUARY
        </p>
        <div className="h-0.5 w-12 bg-gradient-to-r from-transparent via-[#C8A96A] to-transparent mx-auto opacity-60" />
        <p className="text-xs uppercase tracking-[0.3em] text-[#E5E7EB]/70 font-body font-light animate-pulse pt-1">
          {message}
        </p>
      </div>
    </div>
  );

  if (fullPage) {
    return (
      <div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-[#0F2D23]/95 backdrop-blur-xl transition-all duration-500"
        role="status"
        aria-live="polite"
      >
        {loaderContent}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
      {loaderContent}
    </div>
  );
}

