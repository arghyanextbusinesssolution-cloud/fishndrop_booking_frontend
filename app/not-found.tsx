import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-bold">Page not found</h1>
      <Link href="/" className="text-[var(--accent)]">Go Home</Link>
    </div>
  );
}
