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

interface WishlistItem {
  docId: string;
  game: Game;
  addedAt: string;
}

export default function WishlistPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoadingUser(false);
      if (!currentUser) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      try {
        const q = query(collection(db, "wishlists"), where("userId", "==", user.uid));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ docId: d.id, ...d.data() } as WishlistItem));
        setWishlist(items);
      } finally {
        setLoadingData(false);
      }
    };
    fetch();
  }, [user]);

  if (loadingUser || loadingData) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 w-full max-w-[1400px] mx-auto">
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-1">
          <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-violet-500" />
          <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">My Wishlist</h1>
        </div>
        <p className="text-muted-foreground text-sm">{wishlist.length} games saved to your library</p>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <SearchX className="w-16 h-16 text-muted-foreground/40" />
          <h2 className="text-2xl font-bold text-foreground">Your wishlist is empty</h2>
          <p className="text-muted-foreground max-w-md">
            You haven&apos;t added any games yet. Explore KURA to find your next gaming obsession.
          </p>
          <Link href="/" className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
            Explore Games
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-5">
          {wishlist.map((item) => (
            <div key={item.docId} className="relative group">
              <GameCard game={item.game} />
              <button
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-red-500/80 hover:bg-red-500 text-white text-sm font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 backdrop-blur-sm"
                onClick={async () => {
                  await deleteDoc(doc(db, "wishlists", item.docId));
                  setWishlist(prev => prev.filter(w => w.docId !== item.docId));
                }}
                title="Remove from wishlist"
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
