"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Flame, Zap, Calendar, Monitor, ChevronDown, ChevronUp,
  Gamepad2, Smartphone, Apple, Grid2X2, Sword, Target,
  Trophy, Puzzle, Music, Car, Plane, Map, Bot, Wand2, Star
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import { useGenres, usePlatforms } from "@/hooks/useGames";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { Heart, BookOpen, Users, Bell, PlusCircle, AlertCircle } from "lucide-react";

const genreIconMap: Record<string, React.ReactNode> = {
  action: <Sword className="w-4 h-4" />,
  shooter: <Target className="w-4 h-4" />,
  sports: <Trophy className="w-4 h-4" />,
  puzzle: <Puzzle className="w-4 h-4" />,
  racing: <Car className="w-4 h-4" />,
  "music": <Music className="w-4 h-4" />,
  adventure: <Map className="w-4 h-4" />,
  rpg: <Wand2 className="w-4 h-4" />,
  "indie": <Bot className="w-4 h-4" />,
  simulation: <Plane className="w-4 h-4" />,
};

function NavItem({ href, icon, label, active }: { href: string; icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-xl text-base font-normal transition-all duration-200 group",
        active
          ? "font-bold text-foreground bg-black/10 dark:bg-white/10"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <span className={cn(
        "flex items-center justify-center w-8 h-8 rounded-lg transition-colors bg-card group-hover:bg-foreground text-foreground group-hover:text-background",
        active && "bg-foreground text-background"
      )}>
        {icon}
      </span>
      {label}
    </Link>
  );
}

function SectionTitle({ children, href }: { children: React.ReactNode; href?: string }) {
  const content = (
    <h3 className="text-2xl font-bold text-foreground px-3 py-2 mt-4 mb-2 hover:text-violet-500 dark:hover:text-violet-400 transition-colors">
      {children}
    </h3>
  );
  
  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [showAllGenres, setShowAllGenres] = useState(false);
  const [showAllPlatforms, setShowAllPlatforms] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const { data: genresData } = useGenres();
  const { data: platformsData } = usePlatforms();

  useEffect(() => {
    return onAuthStateChanged(auth, setUser);
  }, []);

  const genres = genresData?.results || [];
  const platforms = platformsData?.results || [];

  const platformIconMap: Record<string, React.ReactNode> = {
    pc: <Monitor className="w-4 h-4" />,
    playstation: <Gamepad2 className="w-4 h-4" />,
    xbox: <Gamepad2 className="w-4 h-4" />,
    ios: <Smartphone className="w-4 h-4" />,
    android: <Smartphone className="w-4 h-4" />,
    mac: <Apple className="w-4 h-4" />,
    linux: <Monitor className="w-4 h-4" />,
    nintendo: <Grid2X2 className="w-4 h-4" />,
  };

  const visibleGenres = showAllGenres ? genres : genres.slice(0, 3);
  const visiblePlatforms = showAllPlatforms ? platforms : platforms.slice(0, 3);

  return (
    <aside className="w-[240px] shrink-0 h-full overflow-y-auto scrollbar-hide py-4 pr-3 font-inter">
      <div className="space-y-1">
        <SectionTitle href="/">Home</SectionTitle>
        <SectionTitle href="/reviews">Reviews</SectionTitle>
        <div className="md:hidden mt-2 ml-1 space-y-0.5">
          <NavItem href="/rate/thebest" icon={<Star className="w-4 h-4" />} label="Rate Games" active={pathname === "/rate/thebest"} />
          <NavItem href="/docs" icon={<BookOpen className="w-4 h-4" />} label="Docs" active={pathname.startsWith("/docs")} />
        </div>
      </div>

      {/* Profile embed — shown when logged in */}
      {user && (
        <div className="mt-4 mb-2">
          <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
            </div>
            <span className="font-bold text-foreground text-sm truncate group-hover:text-violet-500 transition-colors">
              {user.displayName || user.email?.split("@")[0] || "My Profile"}
            </span>
          </Link>
          <div className="ml-1 mt-1 space-y-0.5">
            <NavItem href="/wishlist" icon={<Heart className="w-4 h-4" />} label="Wishlist" active={pathname === "/wishlist"} />
            <NavItem href="/library" icon={<BookOpen className="w-4 h-4" />} label="My Library" active={pathname === "/library"} />
            <NavItem href="/following" icon={<Users className="w-4 h-4" />} label="People you follow" active={pathname === "/following"} />
          </div>
          <div className="sm:hidden ml-1 mt-0.5 space-y-0.5">
            <NavItem href="/notifications" icon={<Bell className="w-4 h-4" />} label="Notifications" active={pathname === "/notifications"} />
            <div className="h-px bg-border my-2 mx-3" />
            <NavItem href="/library" icon={<PlusCircle className="w-4 h-4" />} label="Add Game to Library" />
            <NavItem href="/search" icon={<AlertCircle className="w-4 h-4" />} label="Add missing game" />
            <NavItem href="/collections" icon={<Grid2X2 className="w-4 h-4" />} label="New Collection" />
          </div>
        </div>
      )}

      <div className="mt-6 space-y-1">
        <SectionTitle>New Releases</SectionTitle>
        <NavItem href="/games/last-30-days" icon={<Star className="w-4 h-4" />} label="Last 30 days" active={pathname === "/games/last-30-days"} />
        <NavItem href="/games/this-week" icon={<Flame className="w-4 h-4" />} label="This week" active={pathname === "/games/this-week"} />
        <NavItem href="/games/next-week" icon={<Zap className="w-4 h-4" />} label="Next week" active={pathname === "/games/next-week"} />
        <NavItem href="/games/calendar" icon={<Calendar className="w-4 h-4" />} label="Release calendar" active={pathname === "/games/calendar"} />
      </div>

      <div className="mt-8 space-y-1">
        <SectionTitle>Top</SectionTitle>
        <NavItem href="/games/best-of-the-year" icon={<Trophy className="w-4 h-4" />} label="Best of the year" active={pathname === "/games/best-of-the-year"} />
        <NavItem href="/games/popular-in-2025" icon={<Monitor className="w-4 h-4" />} label="Popular in 2025" active={pathname === "/games/popular-in-2025"} />
        <NavItem href="/games/all-time-top-250" icon={<Grid2X2 className="w-4 h-4" />} label="All time top 250" active={pathname === "/games/all-time-top-250"} />
      </div>

      <div className="mt-8 space-y-1">
        <SectionTitle href="/games">All Games</SectionTitle>
      </div>

      <div className="mt-6 space-y-1">
        <SectionTitle href="/platforms">Platforms</SectionTitle>
        {visiblePlatforms.map((platform: { id: number; name: string; slug: string }) => (
          <NavItem
            key={platform.id}
            href={`/platform/${platform.slug}`}
            icon={platformIconMap[platform.slug] || <Monitor className="w-4 h-4" />}
            label={platform.name}
            active={pathname === `/platform/${platform.slug}`}
          />
        ))}
        {platforms.length > 3 && (
          <button
            onClick={() => setShowAllPlatforms(!showAllPlatforms)}
            className="flex items-center gap-2 px-12 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showAllPlatforms ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {showAllPlatforms ? "Show less" : "Show all"}
          </button>
        )}
      </div>

      {genres.length > 0 && (
        <div className="mt-8 space-y-1">
          <SectionTitle href="/genres">Genres</SectionTitle>
          {visibleGenres.map((genre: { id: number; name: string; slug: string; image_background?: string }) => (
            <NavItem
              key={genre.id}
              href={`/genre/${genre.slug}`}
              icon={
                genre.image_background ? (
                  <div
                    className="w-8 h-8 rounded-lg overflow-hidden bg-cover bg-center shrink-0 border border-border"
                    style={{ backgroundImage: `url(${genre.image_background})` }}
                  />
                ) : (
                  genreIconMap[genre.slug] || <Grid2X2 className="w-4 h-4" />
                )
              }
              label={genre.name}
              active={pathname === `/genre/${genre.slug}`}
            />
          ))}
          {genres.length > 3 && (
            <button
              onClick={() => setShowAllGenres(!showAllGenres)}
              className="flex items-center gap-2 px-12 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showAllGenres ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {showAllGenres ? "Show less" : "Show all"}
            </button>
          )}
        </div>
      )}
      
      <div className="h-12" />
    </aside>
  );
}
