"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Monitor, Gamepad2, Smartphone, Apple, Grid2X2, Plus, Gift, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Game } from "@/lib/types";

const getPlatformIcon = (slug: string) => {
  const cls = "w-3.5 h-3.5 text-muted-foreground";
  switch (slug) {
    case "pc": return <Monitor className={cls} />;
    case "playstation": return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.984 2.596v17.547l3.915 1.243V6.688c0-.69.304-1.152.794-.996.636.2.76.89.76 1.58v5.508c2.378 1.186 4.145-.299 4.145-3.135 0-2.911-1.096-4.383-4.35-5.53-1.323-.456-3.747-1.188-5.264-1.519zM.816 17.360c-1.261.77-.926 2.32.804 2.738l5.403 1.354-.013-2.44-4.073-1.02c-.475-.118-.57-.354-.223-.56l4.3-2.52-.022-2.65-6.176 4.098zm15.957.952l-5.257 1.85.046 2.438 5.396-1.9c1.297-.457 1.481-1.537.43-2.377l-3.813-3.022-.013 2.485 3.211 2.526z"/>
      </svg>
    );
    case "xbox": return (
      <svg className={cls} viewBox="0 0 24 24" fill="currentColor">
        <path d="M6.093 3.027c-.099.1-.17.166-.17.166S3.766 4.83 2.49 8.4c-.786 2.205-.71 4.692-.41 5.994.065.28.22.538.39.76l9.53 8.846 9.53-8.846c.17-.222.325-.48.39-.76.3-1.302.376-3.789-.41-5.994-1.276-3.57-3.433-5.207-3.433-5.207s-.071-.066-.17-.166c-.508-.515-2.093-.866-3.387.226l-2.52 1.89-2.52-1.89C8.186 2.161 6.601 2.512 6.093 3.027z"/>
      </svg>
    );
    case "ios":
    case "android": return <Smartphone className={cls} />;
    case "mac": return <Apple className={cls} />;
    case "linux": return <Monitor className={cls} />;
    case "nintendo": return <Grid2X2 className={cls} />;
    default: return null;
  }
};

export interface GameCardProps {
  game: Game;
}

export default function GameCard({ game }: GameCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);
  
  return (
    <div
      className={`relative w-full transition-all duration-200 ${isHovered ? "z-30" : "z-10"}`}
      style={{ isolation: "isolate" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Actual card - stays in normal flow, expands downward */}
      <div
        className={`bg-card rounded-xl overflow-hidden cursor-pointer border transition-all duration-200 ${
          isHovered
            ? "shadow-2xl border-white/10 ring-1 ring-border"
            : "border-transparent"
        }`}
      >
        <Link href={`/game/${game.slug}`} className="block">
          {/* Game Cover Area */}
          <div className="relative w-full aspect-16/10 bg-muted overflow-hidden">
            {game.background_image && !imgError ? (
              <Image
                src={game.background_image}
                alt={game.name}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-muted">
                <Gamepad2 className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Card Body */}
          <div className="p-4 bg-card">
            {/* Platform Icons */}
            <div className="flex items-center gap-2 mb-2">
              {game.parent_platforms?.slice(0, 5).map((p) => {
                const icon = getPlatformIcon(p.platform.slug);
                return icon ? (
                  <span key={p.platform.id} title={p.platform.name}>{icon}</span>
                ) : null;
              })}
              {game.metacritic && (
                <span className={`ml-auto text-[11px] font-bold px-1.5 py-px rounded border ${
                  game.metacritic >= 75 ? "text-green-400 border-green-500/40" :
                  game.metacritic >= 50 ? "text-yellow-400 border-yellow-500/40" :
                  "text-red-400 border-red-500/40"
                }`}>
                  {game.metacritic}
                </span>
              )}
            </div>

            {/* Game Title */}
            <h3 className="text-xl md:text-2xl font-bold font-inter text-foreground leading-tight mb-2 hover:text-muted-foreground transition-colors line-clamp-2">
              {game.name}
            </h3>

            {/* Always visible quick info */}
            <div className="flex items-center gap-1">
              <button 
                onClick={(e) => { e.preventDefault(); }}
                className="flex items-center gap-1 text-[11px] font-medium text-foreground px-2 py-0.5 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors"
                title="Add to library"
              >
                <Plus className="w-3 h-3" />
                {game.added?.toLocaleString() || 0}
              </button>
              
              {isHovered && (
                <>
                  <button className="flex items-center justify-center w-6 h-6 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-foreground transition-colors" title="Gift to a friend">
                    <Gift className="w-3.5 h-3.5" />
                  </button>
                  <button className="flex items-center justify-center w-6 h-6 rounded bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-foreground transition-colors" title="More options">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </>
              )}

              {!isHovered && game.rating > 0 && (
                <div className="flex items-center gap-1 ml-auto text-xs font-semibold text-foreground">
                  <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                  {game.rating.toFixed(1)}
                </div>
              )}
            </div>

            {/* Hover-revealed Expandable details (RAWG style downwards expansion) */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="pt-4 mt-4 text-sm flex flex-col gap-2.5 opacity-90">
                    {game.released && (
                      <div className="flex justify-between items-center text-muted-foreground">
                        <span className="font-medium">Release date:</span>
                        <span className="text-foreground">{new Date(game.released).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    )}
                    {game.genres?.length > 0 && (
                      <div className="flex justify-between items-start text-muted-foreground">
                        <span className="font-medium shrink-0">Genres:</span>
                        <span className="text-foreground text-right max-w-[140px] leading-snug">
                          {game.genres.slice(0, 3).map((g, idx) => (
                            <span key={g.id}>
                              <span className="hover:underline cursor-pointer">{g.name}</span>
                              {idx < Math.min(game.genres.length, 3) - 1 ? ", " : ""}
                            </span>
                          ))}
                        </span>
                      </div>
                    )}

                    <div className="flex flex-col gap-1.5 mt-2">
                      <button 
                        onClick={(e) => e.preventDefault()}
                        className="w-full bg-secondary hover:bg-foreground hover:text-background text-foreground text-xs font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-between px-4"
                      >
                        Show more like this
                        <span className="text-lg leading-none mt-[-2px]">›</span>
                      </button>
                      <button 
                         onClick={(e) => e.preventDefault()}
                         className="w-full text-muted-foreground hover:text-foreground text-xs font-medium py-2 rounded-lg transition-colors text-center"
                      >
                        Hide this game
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </div>
    </div>
  );
}
