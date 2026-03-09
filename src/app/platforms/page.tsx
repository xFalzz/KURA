"use client";

import Image from "next/image";
import Link from "next/link";
import { Monitor, Gamepad2, Smartphone, Apple, Grid2X2 } from "lucide-react";
import { motion } from "framer-motion";
import { usePlatforms } from "@/hooks/useGames";

const PLATFORM_ICONS: Record<string, React.ReactNode> = {
  pc: <Monitor className="w-6 h-6" />,
  playstation: <Gamepad2 className="w-6 h-6" />,
  xbox: <Gamepad2 className="w-6 h-6" />,
  ios: <Smartphone className="w-6 h-6" />,
  android: <Smartphone className="w-6 h-6" />,
  mac: <Apple className="w-6 h-6" />,
  linux: <Monitor className="w-6 h-6" />,
  nintendo: <Grid2X2 className="w-6 h-6" />,
};

interface Platform {
  id: number;
  name: string;
  slug: string;
  games_count: number;
  image_background: string;
}

export default function PlatformsPage() {
  const { data, isLoading } = usePlatforms();
  const platforms: Platform[] = (data?.results || []);

  return (
    <div className="px-6 py-6 w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-outfit font-black text-foreground mb-1">Platforms</h1>
        <p className="text-muted-foreground text-sm">Browse games by gaming platform</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-40 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          {platforms.map((platform, idx) => (
            <motion.div
              key={platform.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Link
                href={`/platform/${platform.slug}`}
                className="group block relative overflow-hidden rounded-2xl border border-border hover:border-violet-500/40 transition-all aspect-video bg-muted"
              >
                {platform.image_background && (
                  <Image
                    src={platform.image_background}
                    alt={platform.name}
                    fill
                    className="object-cover opacity-50 group-hover:opacity-70 group-hover:scale-105 transition-all duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-4">
                  <div className="flex items-center gap-2 text-white mb-1">
                    {PLATFORM_ICONS[platform.slug] || <Grid2X2 className="w-5 h-5" />}
                    <span className="font-bold text-sm">{platform.name}</span>
                  </div>
                  <p className="text-xs text-white/60">{platform.games_count?.toLocaleString()} games</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
