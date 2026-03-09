"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useInfiniteGames } from "@/hooks/useGames";
import GameCard from "@/components/GameCard";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronDown, LayoutGrid, LayoutList, Loader2 } from "lucide-react";
import { Game } from "@/lib/types";
import { motion, Variants } from "framer-motion";
import Image from "next/image";

const ORDERING_OPTIONS = [
  { label: "Relevance", value: "-added" },
  { label: "Date added", value: "-created" },
  { label: "Name", value: "name" },
  { label: "Release date", value: "-released" },
  { label: "Popularity", value: "-rating" },
  { label: "Average rating", value: "-metacritic" },
];

function OrderDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = ORDERING_OPTIONS.find(o => o.value === value);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative z-40">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-black/5 hover:bg-black/10 dark:bg-white/5 dark:hover:bg-white/10 text-foreground text-sm font-medium px-4 py-2 rounded-xl transition-colors"
      >
        Order by: <span className="font-semibold">{current?.label}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full mt-2 w-52 bg-card border border-border rounded-xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.2)] z-50">
          {ORDERING_OPTIONS.map(option => (
            <button
              key={option.value}
              onClick={() => { onChange(option.value); setOpen(false); }}
              className={`flex items-center w-full px-4 py-2.5 text-sm text-left transition-colors ${value === option.value ? "bg-black/10 dark:bg-white/10 text-foreground font-medium" : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"}`}
            >
              {option.label}
              {value === option.value && <span className="ml-auto text-violet-500 dark:text-violet-400">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function GameGrid({ games, viewMode }: { games: Game[]; viewMode: "grid" | "list" }) {
  const container: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.1 }
    }
  };

  const item: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { type: "tween", ease: "easeOut", duration: 0.5 } }
  };

  if (viewMode === "list") {
    return (
      <motion.div 
        variants={container} 
        initial="hidden" 
        animate="show" 
        className="space-y-3"
      >
        {games.map((game) => (
          <motion.div key={game.id} variants={item}>
            <GameListItem game={game} />
          </motion.div>
        ))}
      </motion.div>
    );
  }
  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5"
    >
      {games.map((game) => (
        <GameCard key={game.id} game={game} />
      ))}
    </motion.div>
  );
}

function GameListItem({ game }: { game: Game }) {
  return (
    <a href={`/game/${game.slug}`} className="flex items-center gap-4 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors group">
      <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-muted shrink-0">
        {game.background_image ? (
          <Image 
            src={game.background_image} 
            alt={game.name} 
            fill
            sizes="(max-width: 768px) 100vw, 30vw"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground text-xs">No Image</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors truncate">{game.name}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{game.genres?.slice(0, 2).map(g => g.name).join(", ")}</p>
      </div>
      <div className="flex items-center gap-4 shrink-0">
        {game.metacritic && (
          <span className={`text-xs font-bold px-1.5 py-0.5 rounded border ${game.metacritic >= 75 ? "text-green-500 border-green-500/40" : "text-yellow-500 border-yellow-500/40"}`}>
            {game.metacritic}
          </span>
        )}
        <span className="text-xs text-muted-foreground">{game.released}</span>
      </div>
    </a>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5">
      {Array.from({ length: 15 }).map((_, i) => (
        <div key={i} className="bg-card rounded-2xl overflow-hidden border border-border">
          <Skeleton className="aspect-16/10 w-full rounded-none" />
          <div className="p-4 space-y-3">
            <div className="flex gap-2">
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="w-4 h-4 rounded" />
              <Skeleton className="w-4 h-4 rounded" />
            </div>
            <Skeleton className="h-5 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

interface GamesListPageProps {
  title: string;
  subtitle?: string;
  params?: Record<string, unknown>;
}

export default function GamesListPage({ title, subtitle, params = {} }: GamesListPageProps) {
  const [ordering, setOrdering] = useState("-added");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteGames({ ...params, ordering });

  const allGames = data?.pages.flatMap((page) => page.results) || [];

  // Intersection Observer for infinite scroll
  const handleObserver = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    [fetchNextPage, hasNextPage, isFetchingNextPage]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleObserver, { threshold: 0.1 });
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [handleObserver]);

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 w-full">
      {/* Page Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground mb-1">{title}</h1>
          {subtitle && <p className="text-muted-foreground text-sm">{subtitle}</p>}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <OrderDropdown value={ordering} onChange={setOrdering} />
            {data && (
              <span className="text-sm text-muted-foreground font-medium">
                {data.pages[0]?.count?.toLocaleString()} games
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-black/10 dark:bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-black/10 dark:bg-white/10 text-foreground" : "text-muted-foreground hover:text-foreground"}`}
              title="List view"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Games */}
      {isLoading ? (
        <SkeletonGrid />
      ) : error ? (
        <div className="py-24 text-center text-muted-foreground">
          <p className="text-lg mb-2">Failed to load games.</p>
          <p className="text-sm">Please check your RAWG API key in .env.local</p>
        </div>
      ) : (
        <>
          <GameGrid games={allGames} viewMode={viewMode} />

          {/* Infinite scroll sentinel */}
          <div ref={loadMoreRef} className="py-8 flex justify-center">
            {isFetchingNextPage && (
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                <Loader2 className="w-4 h-4 animate-spin text-violet-500" />
                Loading more games...
              </div>
            )}
            {!hasNextPage && allGames.length > 0 && (
              <p className="text-muted-foreground text-sm font-medium opacity-60">You&apos;ve seen all {allGames.length} games</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
