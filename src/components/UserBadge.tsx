"use client";

import { useEffect, useState } from "react";
import { Shield, Star, Award, Crown, Wrench, ShieldAlert } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getCountFromServer, doc, getDoc } from "firebase/firestore";

interface UserBadgeProps {
  userId?: string;
  reviewCount?: number;
  role?: "user" | "staff" | "admin" | "owner";
  className?: string;
}

// In-memory cache to prevent multiple getCountFromServer calls for the same user
const reviewCountCache: Record<string, number> = {};

export default function UserBadge({ userId, reviewCount: initialCount, role = "user", className = "" }: UserBadgeProps) {
  const [count, setCount] = useState<number | null>(initialCount ?? null);
  const [fetchedRole, setFetchedRole] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchMetadata = async () => {
      try {
        // 1. Fetch Role if not provided
        if (role === "user" && !fetchedRole) {
          const userDoc = await getDoc(doc(db, "users", userId));
          if (userDoc.exists()) {
            setFetchedRole(userDoc.data().role || "user");
          }
        }

        // 2. Fetch Review Count if not provided
        if (initialCount === undefined && count === null) {
          if (reviewCountCache[userId] !== undefined) {
            setCount(reviewCountCache[userId]);
          } else {
            const q = query(collection(db, "reviews"), where("userId", "==", userId));
            const snap = await getCountFromServer(q);
            const fetchedCount = snap.data().count;
            reviewCountCache[userId] = fetchedCount;
            setCount(fetchedCount);
          }
        }
      } catch (err) {
        console.error("Failed to fetch user metadata for badge:", err);
      }
    };

    fetchMetadata();
  }, [userId, initialCount, role, count, fetchedRole]);

  const activeRole = role !== "user" ? role : ((fetchedRole || "user") as "user" | "staff" | "admin" | "owner");
  
  let label = "";
  let icon = null;
  let colorClass = "";

  // 1. Check RBAC Roles first
  if (activeRole === "owner") {
    label = "Owner";
    icon = <Crown className="w-3 h-3" />;
    colorClass = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20";
  } else if (role === "admin") {
    label = "Admin";
    icon = <ShieldAlert className="w-3 h-3" />;
    colorClass = "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20";
  } else if (role === "staff") {
    label = "Staff";
    icon = <Wrench className="w-3 h-3" />;
    colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  } 
  // 2. Fallback to review count badges
  else if (count !== null && count >= 20) {
    label = "Veteran";
    icon = <Award className="w-3 h-3" />;
    colorClass = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
  } else if (count !== null && count >= 5) {
    label = "Critic";
    icon = <Star className="w-3 h-3" />;
    colorClass = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
  } else if (count !== null && count >= 1) {
    label = "Novice";
    icon = <Shield className="w-3 h-3" />;
    colorClass = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
  } else {
    return null; // No badge
  }

  return (
    <div className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${colorClass} ${className}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
}
