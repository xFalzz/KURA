"use client";

import { useEffect, useState } from "react";
import { Shield, Star, Award } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer } from "firebase/firestore";

interface UserBadgeProps {
  userId?: string;
  reviewCount?: number;
  className?: string;
}

// In-memory cache to prevent multiple getCountFromServer calls for the same user
const reviewCountCache: Record<string, number> = {};

export default function UserBadge({ userId, reviewCount: initialCount, className = "" }: UserBadgeProps) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);

  useEffect(() => {
    if (initialCount !== undefined) {
      setCount(initialCount);
      return;
    }

    if (!userId) return;

    if (reviewCountCache[userId] !== undefined) {
      setCount(reviewCountCache[userId]);
      return;
    }

    const fetchCount = async () => {
      try {
        const q = query(collection(db, "reviews"), where("userId", "==", userId));
        const snap = await getCountFromServer(q);
        const fetchedCount = snap.data().count;
        reviewCountCache[userId] = fetchedCount;
        setCount(fetchedCount);
      } catch (err) {
        console.error("Failed to fetch review count for badge:", err);
      }
    };

    fetchCount();
  }, [userId, initialCount]);

  if (count === null || count < 1) return null;

  let label = "";
  let icon = null;
  let colorClass = "";

  if (count >= 20) {
    label = "Veteran";
    icon = <Award className="w-3 h-3" />;
    colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  } else if (count >= 5) {
    label = "Critic";
    icon = <Star className="w-3 h-3" />;
    colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  } else {
    label = "Novice";
    icon = <Shield className="w-3 h-3" />;
    colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  }

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${colorClass} ${className}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
