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
  title: "Tropica | Table Reservations",
  description: "Reserve your table, arrive in style.",
  icons: {
    icon: "/tropica-logo.png",
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
      className={`${newsreader.variable} ${manrope.variable} h-full antialiased theme-astral`}
      suppressHydrationWarning
    >
      <head>
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" />
      </head>
      <body suppressHydrationWarning className="min-h-full flex flex-col">
        <AuthInitializer />
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
