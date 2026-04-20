"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, SearchX, BookOpen } from "lucide-react";
import GameCard from "@/components/GameCard";
import Link from "next/link";
import { Game } from "@/lib/types";



type LibraryStatus = "playing" | "beaten" | "dropped" | "plan" | "wishlist" | "on_hold" | "completed_100";

interface LibraryItem {
  docId: string;
  game: Game;
  status: LibraryStatus;
  addedAt: string;
}

const STATUS_LABELS: Record<LibraryStatus, { label: string; color: string }> = {
  playing: { label: "Playing", color: "text-green-500 bg-green-500/10 border-green-500/20" },
  beaten: { label: "Beaten", color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
  completed_100: { label: "100% Achieved", color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  on_hold: { label: "On Hold", color: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  dropped: { label: "Dropped", color: "text-red-500 bg-red-500/10 border-red-500/20" },
  plan: { label: "Plan to Play", color: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  wishlist: { label: "Wishlist", color: "text-pink-500 bg-pink-500/10 border-pink-500/20" },
};

export default function LibraryPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState<LibraryStatus | "all">("all");
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoadingUser(false);
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    if (!user) return;

    const getLibrary = async () => {
      const q = query(collection(db, "library"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      if (isMounted) {
        const items = snap.docs.map(d => ({ docId: d.id, ...d.data() } as LibraryItem));
        setLibrary(items);
        setLoading(false);
      }
    };

    getLibrary();

    return () => { isMounted = false; };
  }, [user]);

  const removeFromLibrary = async (docId: string) => {
    await deleteDoc(doc(db, "library", docId));
    setLibrary(prev => prev.filter(i => i.docId !== docId));
  };

  if (loadingUser || loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  if (!user) return null;

  const filtered = activeStatus === "all" ? library : library.filter(i => i.status === activeStatus);

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 w-full max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-violet-500" />
          <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">My Library</h1>
        </div>
        <p className="text-muted-foreground text-sm">{library.length} games in your collection</p>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-nowrap sm:flex-wrap items-center gap-1 bg-black/5 dark:bg-white/5 rounded-xl p-1 w-full sm:w-fit mb-6 sm:mb-8 overflow-x-auto scrollbar-hide">
        {([["all", "All"], ...Object.entries(STATUS_LABELS)] as [string, { label: string } | string][]).map(([status, meta]) => {
          const label = typeof meta === "string" ? meta : (meta as { label: string }).label;
          const count = status === "all" ? library.length : library.filter(i => i.status === status).length;
          return (
            <button
              key={status}
              onClick={() => setActiveStatus(status as LibraryStatus | "all")}
              className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                activeStatus === status
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {label} <span className="text-xs opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <SearchX className="w-16 h-16 text-muted-foreground/40" />
          <h2 className="text-2xl font-bold text-foreground">No games here yet</h2>
          <p className="text-muted-foreground max-w-md">
            {activeStatus === "all"
              ? "Your library is empty. Start adding games from any game page!"
              : `No games marked as "${STATUS_LABELS[activeStatus as LibraryStatus]?.label ?? activeStatus}".`
            }
          </p>
          <Link href="/" className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Explore Games
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
          {filtered.map((item) => (
            <div key={item.docId} className="relative group">
              <GameCard game={item.game} />
              {/* Status Badge */}
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold border z-10 backdrop-blur-md ${STATUS_LABELS[item.status]?.color ?? "bg-muted text-foreground"}`}>
                {STATUS_LABELS[item.status]?.label}
              </div>
              {/* Remove button */}
              <button
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
                onClick={() => removeFromLibrary(item.docId)}
                title="Remove from library"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
