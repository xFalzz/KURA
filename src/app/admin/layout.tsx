"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getCountFromServer } from "firebase/firestore";
import { isAdmin } from "@/lib/admin";
import { useTheme } from "next-themes";
import {
  Loader2, ShieldAlert, LayoutDashboard, MessageSquare, Users,
  Flag, ScrollText, Megaphone, Sparkles, Globe,
  Search, Bell, Menu, X, Home, Sun, Moon, Gamepad2,
  BarChart3, Settings2, Wrench, MessageCircle, ChevronRight, PanelLeftClose, PanelLeft
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Sidebar Navigation Config
interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: "MAIN MENU",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    ],
  },
  {
    label: "MANAGEMENT",
    items: [
      { href: "/admin/reviews", label: "Content Moderation", icon: MessageSquare },
      { href: "/admin/community", label: "Community Moderation", icon: Globe },
      { href: "/admin/users", label: "User Directory", icon: Users },
      { href: "/admin/reports", label: "User Reports", icon: Flag, badge: "reports" },
      { href: "/admin/feedback", label: "User Feedback", icon: MessageCircle, badge: "feedback" },
    ],
  },
  {
    label: "TOOLS",
    items: [
      { href: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { href: "/admin/curations", label: "Curation Engine", icon: Sparkles },
      { href: "/admin/games", label: "Game Manager", icon: Gamepad2 },
      { href: "/admin/seo", label: "Global SEO", icon: Globe },
    ],
  },
  {
    label: "ANALYTICS",
    items: [
      { href: "/admin/analytics", label: "Platform Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "SYSTEM",
    items: [
      { href: "/admin/logs", label: "Audit Logs", icon: ScrollText },
      { href: "/admin/maintenance", label: "Maintenance Mode", icon: Wrench },
      { href: "/admin/platform-settings", label: "Platform Settings", icon: Settings2 },
    ],
  },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingReports, setPendingReports] = useState(0);
  const [unreadFeedback, setUnreadFeedback] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Separate effect for mounting to avoid synchronous setState in effect
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setIsAuthorized(false);
        router.push("/login?redirect=/admin");
        return;
      }
      setCurrentUser(user);
      if (isAdmin()) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
      }
    });
    return () => unsub();
  }, [router]);

  // Fetch badge counts
  useEffect(() => {
    if (!isAuthorized) return;
    const fetchCounts = async () => {
      try {
        const reportQ = query(collection(db, "reports"), where("status", "==", "pending"));
        const reportSnap = await getCountFromServer(reportQ);
        setPendingReports(reportSnap.data().count);
      } catch {
        // silently ignore
      }
      try {
        const feedbackQ = query(collection(db, "feedback"), where("status", "==", "new"));
        const feedbackSnap = await getCountFromServer(feedbackQ);
        setUnreadFeedback(feedbackSnap.data().count);
      } catch {
        // silently ignore — collection might not exist yet
      }
    };
    fetchCounts();
  }, [isAuthorized]);

  if (isAuthorized === null) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium animate-pulse">Verifying access...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-background px-4 text-center">
        <div className="bg-red-500/10 p-5 rounded-full mb-6">
          <ShieldAlert className="w-14 h-14 text-red-500" />
        </div>
        <h1 className="text-3xl font-outfit font-black text-foreground mb-3">Access Denied</h1>
        <p className="text-muted-foreground mb-8 max-w-md text-sm">
          This area is restricted to KURA administrators only. If you believe this is an error, please contact support.
        </p>
        <Link
          href="/"
          className="px-8 py-3 bg-primary hover:bg-violet-500 text-white font-semibold rounded-lg transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(href + "/");
  };

  // Get current page title for breadcrumb
  const getCurrentPageTitle = () => {
    for (const section of NAV_SECTIONS) {
      for (const item of section.items) {
        if (isActive(item.href, item.exact)) return item.label;
      }
    }
    return "Dashboard";
  };

  const getBadgeCount = (badge?: string) => {
    if (badge === "reports") return pendingReports;
    if (badge === "feedback") return unreadFeedback;
    return 0;
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`fixed lg:sticky top-0 left-0 h-screen ${sidebarCollapsed ? "lg:w-[72px]" : "lg:w-[270px]"} w-[270px] bg-card border-r border-border flex flex-col z-50 transition-all duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Logo Header */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-border min-h-[68px]">
          <Link href="/admin" className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-primary/20">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            {!sidebarCollapsed && (
              <div className="transition-opacity duration-200">
                <h1 className="font-outfit font-extrabold text-lg text-foreground tracking-tight leading-none">
                  KURA
                </h1>
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  Admin Panel
                </span>
              </div>
            )}
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6 scrollbar-hide">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label}>
              {!sidebarCollapsed && (
                <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest px-3 mb-2">
                  {section.label}
                </h3>
              )}
              {sidebarCollapsed && <div className="h-px bg-border mx-2 mb-2" />}
              <ul className="space-y-0.5">
                {section.items.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  const badgeCount = getBadgeCount(item.badge);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setSidebarOpen(false)}
                        title={sidebarCollapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative ${
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                        } ${sidebarCollapsed ? "justify-center" : ""}`}
                      >
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <Icon className={`w-[20px] h-[20px] shrink-0 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 truncate">{item.label}</span>
                            {badgeCount > 0 && (
                              <span className="ml-auto bg-red-500 text-white text-[10px] font-bold min-w-[20px] h-5 flex items-center justify-center rounded-full px-1.5">
                                {badgeCount}
                              </span>
                            )}
                          </>
                        )}
                        {sidebarCollapsed && badgeCount > 0 && (
                          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
                            {badgeCount > 9 ? "9+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Bottom Section */}
        <div className="border-t border-border p-3 space-y-1">
          {/* Collapse Toggle (Desktop Only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft className="w-5 h-5 shrink-0" /> : <PanelLeftClose className="w-5 h-5 shrink-0" />}
            {!sidebarCollapsed && <span>Collapse</span>}
          </button>

          <Link
            href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-muted/60 hover:text-foreground transition-colors ${sidebarCollapsed ? "justify-center" : ""}`}
            title={sidebarCollapsed ? "Back to KURA" : undefined}
          >
            <Home className="w-[20px] h-[20px] shrink-0" />
            {!sidebarCollapsed && <span>Back to KURA</span>}
          </Link>

          {/* Admin User Info */}
          {currentUser && !sidebarCollapsed && (
            <div className="flex items-center gap-3 px-3 py-3 rounded-xl bg-muted/40">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shrink-0">
                {currentUser.photoURL ? (
                  <Image
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Admin"}
                    width={36}
                    height={36}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {currentUser.displayName?.[0]?.toUpperCase() || "A"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground truncate">
                  {currentUser.displayName || "Admin"}
                </p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {currentUser.email}
                </p>
              </div>
            </div>
          )}
          {currentUser && sidebarCollapsed && (
            <div className="flex justify-center py-2">
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                {currentUser.photoURL ? (
                  <Image
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || "Admin"}
                    width={36}
                    height={36}
                    className="object-cover rounded-full"
                  />
                ) : (
                  <span className="text-sm font-bold text-primary">
                    {currentUser.displayName?.[0]?.toUpperCase() || "A"}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========== MAIN CONTENT ========== */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-4 flex items-center justify-between gap-4">
          {/* Left — Hamburger + Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <Link href="/admin" className="text-muted-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              {pathname !== "/admin" && (
                <>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground font-medium">{getCurrentPageTitle()}</span>
                </>
              )}
            </div>
          </div>

          {/* Right — Search + Theme + Notifications + Avatar */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center relative">
              <Search className="absolute left-3.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search anything..."
                className="w-[240px] bg-muted/50 border border-border rounded-xl pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/30 transition-all"
              />
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative flex items-center justify-center w-10 h-10"
              title="Toggle theme"
            >
              {mounted && resolvedTheme === "dark" ? (
                <Moon className="w-[18px] h-[18px]" />
              ) : mounted ? (
                <Sun className="w-[18px] h-[18px]" />
              ) : (
                <div className="w-[18px] h-[18px]" />
              )}
            </button>

            {/* Notifications */}
            <Link
              href="/admin/reports"
              className="relative p-2.5 rounded-xl border border-border hover:bg-muted transition-colors"
            >
              <Bell className="w-[18px] h-[18px] text-muted-foreground" />
              {pendingReports > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
                  {pendingReports}
                </span>
              )}
            </Link>

            {/* Profile */}
            {currentUser && (
              <div className="flex items-center gap-3 pl-2 ml-1 border-l border-border">
                <div className="hidden sm:block text-right">
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {currentUser.displayName || "Admin"}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Administrator</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
                  {currentUser.photoURL ? (
                    <Image
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || "Admin"}
                      width={40}
                      height={40}
                      className="object-cover rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-bold text-primary">
                      {currentUser.displayName?.[0]?.toUpperCase() || "A"}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 lg:p-8 w-full max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
