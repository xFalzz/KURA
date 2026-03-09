"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ThumbsUp, MessageSquare, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

interface ReviewGame {
  id: number;
  name: string;
  slug: string;
  background_image: string;
  rating: number;
  ratings_count: number;
  metacritic: number;
  released: string;
  genres: { name: string }[];
}

const RATING_LABELS: Record<number, { label: string; color: string; emoji: string }> = {
  5: { label: "Exceptional", color: "text-green-500", emoji: "🏆" },
  4: { label: "Recommended", color: "text-blue-400", emoji: "👍" },
  3: { label: "Meh", color: "text-yellow-500", emoji: "😐" },
  1: { label: "Skip", color: "text-red-500", emoji: "👎" },
};

type SortTab = "popular" | "recent" | "top";

export default function ReviewsPage() {
  const [games, setGames] = useState<ReviewGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<SortTab>("popular");

  const orderingMap: Record<SortTab, string> = {
    popular: "-added",
    recent: "-released",
    top: "-rating",
  };

  useEffect(() => {
    const ordering = orderingMap[activeTab];
    const controller = new AbortController();
    setLoading(true);
    fetch(
      `https://api.rawg.io/api/games?key=${RAWG_KEY}&ordering=${ordering}&page_size=20&ratings_count=10`,
      { signal: controller.signal }
    )
      .then((r) => r.json())
      .then((d) => { setGames(d.results || []); setLoading(false); })
      .catch(() => setLoading(false));
    return () => controller.abort();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const tabs: { id: SortTab; label: string; icon: React.ReactNode }[] = [
    { id: "popular", label: "Popular", icon: <TrendingUp className="w-4 h-4" /> },
    { id: "recent", label: "Recent", icon: <MessageSquare className="w-4 h-4" /> },
    { id: "top", label: "Top Rated", icon: <ThumbsUp className="w-4 h-4" /> },
  ];

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-outfit font-black text-foreground mb-1">Reviews</h1>
        <p className="text-muted-foreground text-sm">Community ratings from the KURA player base</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1 w-fit mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-28 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col gap-4"
        >
          {games.map((game, idx) => {
            const topRating = game.rating >= 4.5 ? 5 : game.rating >= 3.5 ? 4 : game.rating >= 2.5 ? 3 : 1;
            const ratingInfo = RATING_LABELS[topRating];
            return (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <Link
                  href={`/game/${game.slug}`}
                  className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-violet-500/30 hover:bg-black/3 dark:hover:bg-white/3 transition-all group"
                >
                  {/* Cover */}
                  <div className="relative w-20 h-14 rounded-xl overflow-hidden shrink-0 bg-muted">
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
                      {game.genres?.slice(0, 2).map((g) => g.name).join(", ")} · {game.released?.slice(0, 4)}
                    </p>
                  </div>

                  {/* Rating badge */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <div className={`text-sm font-bold ${ratingInfo?.color}`}>
                        {ratingInfo?.emoji} {ratingInfo?.label}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5 justify-end">
                        <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                        <span className="text-xs text-muted-foreground">{game.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{game.ratings_count?.toLocaleString()} ratings</span>
                      </div>
                    </div>
                    {game.metacritic && (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded border ${
                          game.metacritic >= 75
                            ? "text-green-500 border-green-500/40"
                            : game.metacritic >= 50
                            ? "text-yellow-500 border-yellow-500/40"
                            : "text-red-500 border-red-500/40"
                        }`}
                      >
                        {game.metacritic}
                      </span>
                    )}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
