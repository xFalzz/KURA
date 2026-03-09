"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Trophy, Star, TrendingUp, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

interface LeaderboardGame {
  id: number;
  name: string;
  slug: string;
  background_image: string;
  rating: number;
  ratings_count: number;
  added: number;
  metacritic: number;
  released: string;
  genres: { name: string }[];
  platforms: { platform: { name: string; slug: string } }[];
}

type LeaderTab = "added" | "rating" | "metacritic";

const MEDAL_EMOJIS = ["🥇", "🥈", "🥉"];

export default function LeaderboardPage() {
  const [games, setGames] = useState<LeaderboardGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<LeaderTab>("added");

  const orderingMap: Record<LeaderTab, string> = {
    added: "-added",
    rating: "-rating",
    metacritic: "-metacritic",
  };

  const tabLabels: Record<LeaderTab, { label: string; icon: React.ReactNode }> = {
    added: { label: "Most Popular", icon: <TrendingUp className="w-4 h-4" /> },
    rating: { label: "Highest Rated", icon: <Star className="w-4 h-4" /> },
    metacritic: { label: "Best Metacritic", icon: <Trophy className="w-4 h-4" /> },
  };

  useEffect(() => {
    const ordering = orderingMap[tab];
    const controller = new AbortController();
    setLoading(true);
    fetch(
      `https://api.rawg.io/api/games?key=${RAWG_KEY}&ordering=${ordering}&page_size=50`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((d) => { setGames(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  return (
    <div className="px-4 sm:px-6 py-5 sm:py-6 w-full">
      {/* Header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-linear-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
          <Trophy className="w-7 h-7 text-white" />
        </div>
        <div>
          <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">Leaderboard</h1>
          <p className="text-muted-foreground text-sm">The greatest games across all time</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1 w-full sm:w-fit mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        {(Object.keys(tabLabels) as LeaderTab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap flex-1 sm:flex-none justify-center ${
              tab === t
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tabLabels[t].icon}
            <span className="hidden sm:inline">{tabLabels[t].label}</span>
            <span className="sm:hidden">{tabLabels[t].label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <motion.ol initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
          {games.map((game, idx) => (
            <motion.li
              key={game.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
            >
              <Link
                href={`/game/${game.slug}`}
                className="flex items-center gap-4 p-3 bg-card border border-border rounded-2xl hover:border-violet-500/30 transition-all group"
              >
                {/* Rank */}
                <div className="w-10 text-center shrink-0">
                  {idx < 3 ? (
                    <span className="text-2xl">{MEDAL_EMOJIS[idx]}</span>
                  ) : (
                    <span className="text-lg font-black text-muted-foreground">#{idx + 1}</span>
                  )}
                </div>

                {/* Cover */}
                <div className="relative w-16 h-11 rounded-lg overflow-hidden shrink-0 bg-muted">
                  {game.background_image && (
                    <Image src={game.background_image} alt={game.name} fill className="object-cover" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground group-hover:text-violet-500 dark:group-hover:text-violet-400 transition-colors truncate">
                    {game.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {game.genres?.slice(0, 2).map((g) => g.name).join(", ")}
                  </p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right hidden sm:block">
                    <div className="flex items-center gap-1">
                      <Gamepad2 className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{game.added?.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-xs text-muted-foreground">{game.rating?.toFixed(1)}</span>
                    </div>
                  </div>
                  {game.metacritic && (
                    <span
                      className={`text-sm font-black px-2 py-1 rounded-lg border ${
                        game.metacritic >= 75
                          ? "text-green-500 border-green-500/40 bg-green-500/5"
                          : game.metacritic >= 50
                          ? "text-yellow-500 border-yellow-500/40 bg-yellow-500/5"
                          : "text-red-500 border-red-500/40 bg-red-500/5"
                      }`}
                    >
                      {game.metacritic}
                    </span>
                  )}
                </div>
              </Link>
            </motion.li>
          ))}
        </motion.ol>
      )}
    </div>
  );
}
