import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "KURA | Game Discovery Platform",
  description: "Discover, track, and curate your ultimate video game collection. Browse 897,000+ games with reviews, wishlists, community posts, and personalized recommendations.",
  keywords: ["game discovery", "video games", "game reviews", "game tracker", "game library", "KURA", "gaming community"],
  authors: [{ name: "KURA" }],
  robots: { index: true, follow: true },
  openGraph: {
    title: "KURA | Game Discovery Platform",
    description: "Discover, track, and curate your ultimate video game collection. Browse 897,000+ games.",
    type: "website",
    url: "https://kura.app",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "KURA - Game Discovery Platform" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "KURA | Game Discovery Platform",
    description: "Discover, track, and curate your ultimate video game collection.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
