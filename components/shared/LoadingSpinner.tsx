"use client";

interface Props {
  message?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ message = "Loading...", fullPage = false }: Props) {
  return (
    <div
      className={`flex items-center justify-center ${fullPage ? "min-h-screen" : "py-10"}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#E5E7EB]/20 border-t-[#E5E7EB]" />
        <p className="text-sm text-[#E5E7EB]/60 font-body italic">{message}</p>
      </div>
    </div>
  );
}
