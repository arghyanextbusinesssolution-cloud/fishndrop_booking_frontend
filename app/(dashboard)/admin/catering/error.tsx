"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="p-8 text-center space-y-4">
      <p className="text-error font-medium">Failed to load restaurant & catering requests.</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-primary text-black font-bold text-xs uppercase tracking-wider rounded-full"
      >
        Try again
      </button>
    </div>
  );
}
