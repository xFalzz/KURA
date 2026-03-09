"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/admin";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAuthorized(false);
        router.push("/login?redirect=/admin");
        return;
      }

      // Check admin status
      if (isAdmin()) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <Loader2 className="w-10 h-10 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 text-center">
        <div className="bg-red-500/10 p-4 rounded-full mb-6">
          <ShieldAlert className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-outfit font-black mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md">
          This area is restricted to KURA administrators only. If you believe this is an error, please contact support.
        </p>
        <Link href="/">
          <Button variant="outline" className="rounded-xl px-8">Return to Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Admin Sidebar Navigation */}
      <aside className="w-64 border-r border-border bg-card/30 hidden md:flex flex-col">
        <div className="p-6 border-b border-border">
          <h2 className="font-outfit font-black text-xl text-violet-500 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5" /> KURA Admin
          </h2>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-violet-600/10 text-violet-500 font-medium">
            Overview
          </Link>
          <Link href="/admin/reviews" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground font-medium transition-colors">
            Content Moderation
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground font-medium transition-colors">
            User Directory
          </Link>
          <Link href="/admin/announcements" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground font-medium transition-colors">
            Announcements
          </Link>
        </nav>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="p-6 md:p-8 w-full max-w-6xl mx-auto">
           {children}
        </div>
      </main>
    </div>
  );
}
