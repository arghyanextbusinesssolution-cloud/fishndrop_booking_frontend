import type { Metadata } from "next";
import { Newsreader, Manrope } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { AuthInitializer } from "@/components/shared/AuthInitializer";

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Fishndrop | Table Reservations",
  description: "Reserve your table, arrive in style.",
  icons: {
    icon: "https://www.fishndrop.com/wp-content/uploads/2026/01/cropped-logo-1-1.png",
    shortcut: "https://www.fishndrop.com/wp-content/uploads/2026/01/cropped-logo-1-1.png",
    apple: "https://www.fishndrop.com/wp-content/uploads/2026/01/cropped-logo-1-1.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning className="min-h-full flex flex-col bg-[#faf9f5]">
        <AuthInitializer />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
