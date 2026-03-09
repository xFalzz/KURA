"use client";

import { useState, useEffect } from "react";
import { Heart, Loader2, Check } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Game } from "@/lib/types";
import { logActivity } from "@/lib/activityLogger";

export default function AddToWishlistButton({ game }: { game: Game }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [docId, setDocId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const checkWishlist = async (uid: string) => {
      const q = query(
        collection(db, "wishlists"),
        where("userId", "==", uid),
        where("game.id", "==", game.id)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setIsSaved(true);
        setDocId(snapshot.docs[0].id);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) checkWishlist(user.uid);
      else { setIsSaved(false); setDocId(null); }
    });

    return () => unsubscribe();
  }, [game.id]);

  const handleToggle = async () => {
    const user = auth.currentUser;
    if (!user) { router.push("/login"); return; }

    setIsLoading(true);
    try {
      if (isSaved && docId) {
        await deleteDoc(doc(db, "wishlists", docId));
        setIsSaved(false);
        setDocId(null);
      } else {
        const ref = await addDoc(collection(db, "wishlists"), {
          userId: user.uid,
          game: {
            id: game.id,
            name: game.name,
            slug: game.slug,
            background_image: game.background_image,
            metacritic: game.metacritic,
            rating: game.rating,
            genres: game.genres || [],
            parent_platforms: game.parent_platforms || [],
            released: game.released || null,
            playtime: game.playtime || 0,
          },
          addedAt: new Date().toISOString(),
        });

        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
          userImage: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
          type: "WISHLIST_ADD",
          gameId: game.id,
          gameName: game.name,
          gameSlug: game.slug,
          gameImage: game.background_image || "",
        });

        setIsSaved(true);
        setDocId(ref.id);
      }
    } catch (e) {
      console.error("Wishlist error", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
        isSaved
          ? "bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-red-500/20 hover:text-red-400 hover:border-red-500/30"
          : "bg-violet-600 hover:bg-violet-500 text-primary-foreground shadow-[0_0_20px_rgba(124,58,237,0.3)]"
      }`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isSaved ? (
        <Check className="w-4 h-4" />
      ) : (
        <Heart className="w-4 h-4" />
      )}
      {isSaved ? "In Wishlist" : "Add to Wishlist"}
    </button>
  );
}
