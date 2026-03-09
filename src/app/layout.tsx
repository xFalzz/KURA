import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import ClientSEOWrapper from "@/components/ClientSEOWrapper";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "KURA — Game Discovery Platform",
  description: "Discover, track, and curate your ultimate video game collection. Browse 897,000+ games.",
  openGraph: {
    title: "KURA — Game Discovery Platform",
    description: "Discover, track, and curate your ultimate video game collection.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${outfit.variable} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <ClientSEOWrapper />
        <Providers>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </Providers>
      </body>
    </html>
  );
}
