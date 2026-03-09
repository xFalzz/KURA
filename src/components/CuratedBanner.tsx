"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Sparkles, Star } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface Game {
  id: number;
  slug: string;
  name: string;
  background_image: string;
  rating: number;
  released: string;
  detail?: string;
}

interface CurationConfig {
  title: string;
  subtitle: string;
  gameIds: number[];
  active: boolean;
}

export default function CuratedBanner() {
  const [config, setConfig] = useState<CurationConfig | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCuration = async () => {
      try {
        const docRef = doc(db, "settings", "curation_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data().curation?.active) {
          const cfg = docSnap.data().curation as CurationConfig;
          setConfig(cfg);

          // Fetch the details for all games from RAWG concurrently
          if (cfg.gameIds && cfg.gameIds.length > 0) {
             const apiKey = process.env.NEXT_PUBLIC_RAWG_API_KEY;
             if (!apiKey) return;
             
             const fetchPromises = cfg.gameIds.map(id => 
               fetch(`https://api.rawg.io/api/games/${id}?key=${apiKey}`).then(res => res.json())
             );
             const results = await Promise.all(fetchPromises);
             // Filter out any errored or 'detail: "Not found"' responses
             const validGames = results.filter(g => g && g.slug && !g.detail);
             setGames(validGames);
          }
        }
      } catch (error) {
        console.error("Error fetching curation banner data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCuration();
  }, []);

  if (loading) return null; // Don't show loading state to avoid layout shift, just mount silently
  if (!config || !config.active || games.length === 0) return null;

  return (
    <div className="mb-12 relative overflow-hidden rounded-3xl border border-yellow-500/30 bg-linear-to-br from-yellow-500/10 via-background to-background">
      {/* Decorative Glow elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-500/20 blur-[100px] pointer-events-none rounded-full shrink-0" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 blur-[100px] pointer-events-none rounded-full shrink-0" />

      <div className="relative p-6 md:p-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-yellow-500 font-bold mb-3 uppercase tracking-wider text-xs bg-yellow-500/10 w-fit px-3 py-1.5 rounded-full">
              <Sparkles className="w-4 h-4" /> KURA&apos;s Featured Collection
            </div>
            <h2 className="text-3xl md:text-5xl font-black font-outfit text-foreground tracking-tight">
              {config.title}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-2xl text-lg">
              {config.subtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {games.map((game, i) => (
            <Link 
              href={`/game/${game.slug}`} 
              key={game.id}
              className="group relative h-64 rounded-2xl overflow-hidden border border-border/50 hover:border-yellow-500/50 transition-all duration-300"
            >
              <Image
                src={game.background_image || "https://placehold.co/600x400/1a1a1a/FFF?text=No+Image"}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-5">
                {/* Ranking Badge if it's the first few */}
                {i < 3 && (
                   <div className="absolute top-4 left-4 bg-yellow-500 text-black font-black text-xs w-6 h-6 rounded-full flex items-center justify-center">
                     {i + 1}
                   </div>
                )}
                <h3 className="text-white font-bold text-lg line-clamp-1 mb-1 group-hover:text-yellow-400 transition-colors">
                  {game.name}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs font-bold text-yellow-400">
                    <Star className="w-3.5 h-3.5 fill-yellow-400" /> {game.rating}
                  </div>
                  {game.released && (
                    <div className="text-[10px] text-gray-300 font-mono">
                      {new Date(game.released).getFullYear()}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
