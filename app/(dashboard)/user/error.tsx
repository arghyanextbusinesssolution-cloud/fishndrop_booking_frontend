"use client";
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <div className="rounded-xl bg-[var(--surface)] p-6"><p className="mb-3 text-[var(--error)]">Something went wrong.</p><button onClick={reset} className="rounded bg-[var(--accent)] px-3 py-2 text-black">Try again</button></div>;
}
