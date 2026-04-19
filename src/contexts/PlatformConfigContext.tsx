"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { isAdmin } from "@/lib/admin";
import { Wrench } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// Define the shape of our configs
interface PlatformConfig {
  general: {
    platformName: string;
    tagline: string;
    footerText: string;
  };
  registration: {
    enabled: boolean;
    requireEmailVerification: boolean;
  };
  content: {
    defaultReviewsPerPage: number;
    enableReviewLikes: boolean;
    minReviewLength: number;
    maxReviewLength: number;
  };
  rateLimiting: {
    maxReviewsPerUserPerDay: number;
    maxReportsPerUserPerDay: number;
  };
  features: {
    collections: boolean;
    leaderboard: boolean;
    wishlist: boolean;
    chat: boolean;
    feedback: boolean;
    rateGames: boolean;
  };
}

interface MaintenanceConfig {
  enabled: boolean;
  message: string;
  scheduledStart: string;
  scheduledEnd: string;
  allowAdminAccess: boolean;
}

const DEFAULT_PLATFORM_CONFIG: PlatformConfig = {
  general: { platformName: "KURA", tagline: "The Ultimate Game Discovery Platform", footerText: "© 2026 KURA" },
  registration: { enabled: true, requireEmailVerification: false },
  content: { defaultReviewsPerPage: 10, enableReviewLikes: true, minReviewLength: 10, maxReviewLength: 2000 },
  rateLimiting: { maxReviewsPerUserPerDay: 10, maxReportsPerUserPerDay: 5 },
  features: { collections: true, leaderboard: true, wishlist: true, chat: true, feedback: true, rateGames: true },
};

interface PlatformConfigContextType {
  config: PlatformConfig;
  isLoading: boolean;
}

const PlatformConfigContext = createContext<PlatformConfigContextType>({
  config: DEFAULT_PLATFORM_CONFIG,
  isLoading: true,
});

export function usePlatformConfig() {
  return useContext(PlatformConfigContext);
}

export function PlatformConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_PLATFORM_CONFIG);
  const [maintenance, setMaintenance] = useState<MaintenanceConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // 1. Check Auth Status to determine if user is admin
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setIsUserAdmin(user ? isAdmin() : false);
    });

    // 2. Listen to Platform Config
    const unsubPlatform = onSnapshot(
      doc(db, "settings", "platform_config"),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            general: { ...DEFAULT_PLATFORM_CONFIG.general, ...data.general },
            registration: { ...DEFAULT_PLATFORM_CONFIG.registration, ...data.registration },
            content: { ...DEFAULT_PLATFORM_CONFIG.content, ...data.content },
            rateLimiting: { ...DEFAULT_PLATFORM_CONFIG.rateLimiting, ...data.rateLimiting },
            features: { ...DEFAULT_PLATFORM_CONFIG.features, ...data.features },
          });
        }
      },
      (error) => {
        // Silently ignore permission errors for guest users (if rules are strict)
        if (error.code !== "permission-denied") console.error("Platform config error:", error);
      }
    );

    // 3. Listen to Maintenance Config
    const unsubMaintenance = onSnapshot(
      doc(db, "settings", "maintenance_config"),
      (docSnap) => {
        if (docSnap.exists()) {
          setMaintenance(docSnap.data() as MaintenanceConfig);
        }
        setIsLoading(false);
      },
      (error) => {
        if (error.code !== "permission-denied") console.error("Maintenance config error:", error);
        setIsLoading(false);
      }
    );

    return () => {
      unsubAuth();
      unsubPlatform();
      unsubMaintenance();
    };
  }, []);

  // --- Maintenance Shield Logic ---
  const isMaintenanceActive = maintenance?.enabled;
  const adminBypass = isUserAdmin && maintenance?.allowAdminAccess;
  const isLoginRoute = pathname === "/login";

  if (isMaintenanceActive && !adminBypass && !isLoginRoute && !isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />
          <div className="bg-amber-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-amber-500/5">
            <Wrench className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-outfit font-black text-foreground mb-3">
            Under Maintenance
          </h1>
          <p className="text-muted-foreground mb-6">
            {maintenance?.message || "We're performing scheduled maintenance. KURA will be back shortly!"}
          </p>
          {maintenance?.scheduledEnd && (
            <div className="bg-muted/50 rounded-xl p-4 mb-6 border border-border inline-block">
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Expected Return</p>
              <p className="text-foreground font-medium">
                {new Date(maintenance.scheduledEnd).toLocaleString()}
              </p>
            </div>
          )}
          <div className="pt-6 border-t border-border flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">Are you an administrator?</p>
            <Link 
              href="/login" 
              className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
            >
              Admin Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Normal App Render
  return (
    <PlatformConfigContext.Provider value={{ config, isLoading }}>
      {children}
    </PlatformConfigContext.Provider>
  );
}
