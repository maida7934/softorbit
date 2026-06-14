import type { Metadata } from "next";
import { Cormorant_Garamond, Pinyon_Script, Azeret_Mono } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const pinyon = Pinyon_Script({
  variable: "--font-pinyon",
  subsets: ["latin"],
  weight: ["400"],
});

const azeretMono = Azeret_Mono({
  variable: "--font-azeret-mono",
  subsets: ["latin"],
});

const rocGrotesk = localFont({
  src: "../public/Fontspring-DEMO-rocgrotesk-regular.otf",
  variable: "--font-roc",
});

export const metadata: Metadata = {
  title: "Moon Hero — Scroll-Driven 3D Experience",
  description:
    "A fullscreen scroll-driven hero section with a 3D moon, orbiting text, and cinematic animations.",
};

import Navbar from "@/components/Navbar/Navbar";

import LenisProvider from "@/components/LenisProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${pinyon.variable} ${azeretMono.variable} ${rocGrotesk.variable}`}>
      <body>
        <LenisProvider>
          <Navbar />
          {children}
        </LenisProvider>
      </body>
    </html>
  );
}
