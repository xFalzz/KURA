"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, ArrowRightCircle, Target, SkipForward } from "lucide-react";

interface Rating {
  id: number;
  title: string;
  count: number;
  percent: number;
}

const RATING_COLORS: Record<string, string> = {
  exceptional: "#6dc849",  // RAWG green
  recommended: "#4a76dd",  // RAWG blue
  meh: "#f4b93b",          // RAWG yellow
  skip: "#ff3e3e",         // RAWG red
};

const RATING_ICONS: Record<string, React.ReactNode> = {
  exceptional: <Target className="w-5 h-5" />,
  recommended: <CheckCircle2 className="w-5 h-5" />,
  meh: <ArrowRightCircle className="w-5 h-5" />,
  skip: <SkipForward className="w-5 h-5" />,
};

export default function RatingsBar({ ratings }: { ratings: Rating[] }) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  if (!ratings || ratings.length === 0) return null;

  // Ensure ratings are sorted by id to maintain RAWG order (exceptional -> recommended -> meh -> skip)
  const sortedRatings = [...ratings].sort((a, b) => a.id - b.id);

  // Find the dominant rating for the title
  const dominant = sortedRatings.reduce((prev, current) => (prev.count > current.count) ? prev : current);

  return (
    <div className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-xl font-outfit font-bold text-foreground">Player ratings</h2>
        {dominant && (
           <span className="text-xl font-bold uppercase tracking-widest" style={{ color: RATING_COLORS[dominant.title] || "#fff" }}>
               {dominant.title} <span className="text-muted-foreground font-medium text-lg ml-1">{dominant.count}</span>
           </span>
        )}
      </div>

      {/* The Bar */}
      <div className="flex w-full h-12 rounded-xl overflow-hidden shadow-inner mb-4">
        {sortedRatings.map((rating) => {
          if (rating.percent === 0) return null;
          const color = RATING_COLORS[rating.title] || "#555";
          const isHovered = hoveredId === rating.id;
          
          return (
            <motion.div
              key={rating.id}
              className="h-full relative cursor-pointer"
              style={{ width: `${rating.percent}%`, backgroundColor: color }}
              onHoverStart={() => setHoveredId(rating.id)}
              onHoverEnd={() => setHoveredId(null)}
              animate={{
                opacity: hoveredId === null || hoveredId === rating.id ? 1 : 0.4,
              }}
              transition={{ duration: 0.2 }}
            >
              {/* Inner subtle gradient for 3D bar effect */}
              <div className="absolute inset-0 bg-linear-to-b from-black/20 dark:from-white/20 to-transparent" />
              
              <AnimatePresence>
                 {isHovered && (
                    <motion.div
                       initial={{ opacity: 0, y: 10, scale: 0.9 }}
                       animate={{ opacity: 1, y: 0, scale: 1 }}
                       exit={{ opacity: 0, y: 10, scale: 0.9 }}
                       className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-popover border border-border text-popover-foreground text-xs font-bold px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10 flex items-center gap-2"
                    >
                       <span style={{ color }}>{RATING_ICONS[rating.title]}</span>
                       <span className="capitalize">{rating.title}</span>
                       <span className="text-muted-foreground">{rating.count}</span>
                    </motion.div>
                 )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* Legend below bar */}
      <div className="flex flex-wrap items-center gap-4">
        {sortedRatings.map((rating) => {
          if (rating.percent === 0) return null;
          const color = RATING_COLORS[rating.title] || "#555";
          const isHovered = hoveredId === rating.id;

          return (
            <div 
               key={`legend-${rating.id}`} 
               className="flex items-center gap-2 cursor-pointer transition-opacity duration-200"
               style={{ opacity: hoveredId === null || isHovered ? 1 : 0.4 }}
               onMouseEnter={() => setHoveredId(rating.id)}
               onMouseLeave={() => setHoveredId(null)}
            >
              <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: color }} />
              <span className="text-sm text-foreground font-medium capitalize">{rating.title}</span>
              <span className="text-sm text-muted-foreground">{rating.percent.toFixed(0)}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
