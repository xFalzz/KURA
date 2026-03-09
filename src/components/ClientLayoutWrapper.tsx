"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import GuestBanner from "@/components/GuestBanner";
import GlobalBanner from "@/components/GlobalBanner";

export default function ClientLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  if (pathname?.startsWith("/admin")) {
    return <>{children}</>;
  }

  return (
    <>
      <GlobalBanner />
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
    </>
  );
}
