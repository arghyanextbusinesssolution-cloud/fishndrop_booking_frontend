import type { Metadata } from "next";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { SeoTopBar } from "@/components/seo/SeoTopBar";

export const metadata: Metadata = {
  title: "Blog Manager | Tropica SEO",
  robots: { index: false, follow: false }
};

/** SEO area: blog manager only — no admin menu, no access to bookings or other admin tools. */
export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="theme-astral min-h-screen bg-background">
        <SeoTopBar />
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </ProtectedRoute>
  );
}
