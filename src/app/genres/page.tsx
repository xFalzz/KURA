"use client";

import Image from "next/image";
import Link from "next/link";

import { motion } from "framer-motion";
import { useGenres } from "@/hooks/useGames";

interface Genre {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export default function GenresPage() {
  const { data, isLoading } = useGenres();
  const genres: Genre[] = (data?.results || []);

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-outfit font-black text-foreground mb-1">Genres</h1>
        <p className="text-muted-foreground text-sm">Browse games by category and genre</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {genres.map((genre, idx) => (
            <motion.div
              key={genre.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
            >
              <Link
                href={`/genre/${genre.slug}`}
                className="group block relative overflow-hidden rounded-2xl border border-border hover:border-violet-500/40 transition-all aspect-video bg-muted"
              >
                {genre.image_background && (
                  <Image
                    src={genre.image_background}
                    alt={genre.name}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <span className="font-bold text-sm text-white">{genre.name}</span>
                  <p className="text-xs text-white/60">{genre.games_count?.toLocaleString()} games</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
