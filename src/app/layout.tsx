import type { Metadata } from "next";
import { Fraunces, Inter, Source_Sans_3 } from "next/font/google";
import "./globals.css";

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source",
  weight: ["400", "600", "700"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  weight: ["700"],
});

export const metadata: Metadata = {
  title: {
    default: "Painel Fiara",
    template: "%s · Painel Fiara",
  },
  description: "Swipe file interno de ofertas digitais em escala.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sourceSans.variable} ${fraunces.variable} ${inter.variable} h-full`}>
      <body className="min-h-full bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
