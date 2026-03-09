import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import GuestBanner from "@/components/GuestBanner";

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
        <Providers>
          <GuestBanner />
          <Navbar />
          <div className="flex min-h-[calc(100vh-64px)]">
            {/* Left Sidebar */}
            <div className="hidden lg:block sticky top-16 h-[calc(100vh-64px)] overflow-y-auto border-r border-black/5 dark:border-white/5 scrollbar-hide px-3">
              <Sidebar />
            </div>
            {/* Main Content */}
            <main className="flex-1 min-w-0 overflow-x-hidden">
              <div className="w-full max-w-[1600px] mx-auto">
                {children}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
