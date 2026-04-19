"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Check, Loader2, FolderPlus, Grid2X2 } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, runTransaction } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Game } from "@/lib/types";
import { logActivity } from "@/lib/activityLogger";
import { motion, AnimatePresence } from "framer-motion";
import { usePlatformConfig } from "@/contexts/PlatformConfigContext";

interface Collection {
  id: string;
  name: string;
}

interface AddToCollectionDropdownProps {
  game: Game;
}

export default function AddToCollectionDropdown({ game }: AddToCollectionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [savedCollectionIds, setSavedCollectionIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { config } = usePlatformConfig();

  useEffect(() => {
    const fetchCollections = async (uid: string) => {
      // 1. Fetch user's collections
      const colQ = query(collection(db, "collections"), where("userId", "==", uid));
      const colSnap = await getDocs(colQ);
      const userCols = colSnap.docs.map(d => ({ id: d.id, name: d.data().name } as Collection));
      setCollections(userCols);

      // 2. See which collections contain this game
      const savedIn = new Set<string>();
      for (const col of userCols) {
        const gameDocRef = doc(db, "collections", col.id, "games", game.id.toString());
        const gameSnap = await getDoc(gameDocRef);
        if (gameSnap.exists()) {
          savedIn.add(col.id);
        }
      }
      setSavedCollectionIds(savedIn);
      setIsLoading(false);
    };

    const unsub = auth.onAuthStateChanged((u) => {
      if (u) fetchCollections(u.uid);
      else { setCollections([]); setSavedCollectionIds(new Set()); setIsLoading(false); }
    });
    return () => unsub();
  }, [game.id]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggleCollection = async (collectionId: string, collectionName: string) => {
    const user = auth.currentUser;
    if (!user) { router.push("/login"); return; }

    setIsSaving(true);
    const isCurrentlySaved = savedCollectionIds.has(collectionId);
    const colRef = doc(db, "collections", collectionId);
    const gameRef = doc(db, "collections", collectionId, "games", game.id.toString());

    try {
      await runTransaction(db, async (transaction) => {
        const colDoc = await transaction.get(colRef);
        if (!colDoc.exists()) throw "Collection does not exist!";
        
        const newCount = Math.max(0, (colDoc.data().gamesCount || 0) + (isCurrentlySaved ? -1 : 1));

        if (isCurrentlySaved) {
            transaction.delete(gameRef);
        } else {
            transaction.set(gameRef, {
                id: game.id,
                name: game.name,
                slug: game.slug,
                background_image: game.background_image || "",
                rating: game.rating || 0,
                metacritic: game.metacritic || 0,
                addedAt: new Date().toISOString()
            });
        }
        transaction.update(colRef, { gamesCount: newCount });
      });

      // Update Local State
      setSavedCollectionIds(prev => {
        const newSet = new Set(prev);
        if (isCurrentlySaved) newSet.delete(collectionId);
        else newSet.add(collectionId);
        return newSet;
      });

      // Log activity if adding
      if (!isCurrentlySaved) {
        await logActivity({
          userId: user.uid,
          userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
          userImage: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
          type: "COLLECTION_ADD",
          gameId: game.id,
          gameName: game.name,
          gameSlug: game.slug,
          gameImage: game.background_image || "",
          collectionName: collectionName
        });
      }

    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  if (!config.features.collections) return null;

  return (
    <div className="relative z-50" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground text-sm font-semibold transition-colors border border-transparent"
        title="Add to Collection"
      >
        <FolderPlus className="w-4 h-4" /> Add to Collection
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 w-56 bg-card dark:bg-zinc-900 border border-border shadow-2xl rounded-xl p-1.5 backdrop-blur-md"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : collections.length === 0 ? (
                <div className="px-3 py-4 text-center">
                    <Grid2X2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-sm font-medium text-foreground">No Collections</p>
                    <p className="text-xs text-muted-foreground mt-1">Create one first!</p>
                    <button 
                        onClick={() => router.push("/collections")}
                        className="mt-3 text-xs w-full py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg transition-colors"
                    >
                        Go to Collections
                    </button>
                </div>
            ) : (
                <div className="max-h-60 overflow-y-auto scrollbar-hide space-y-0.5 pr-0.5">
                    {collections.map(col => {
                        const inCol = savedCollectionIds.has(col.id);
                        return (
                            <button
                                key={col.id}
                                disabled={isSaving}
                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleToggleCollection(col.id, col.name); }}
                                className={`flex items-center justify-between w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 ${
                                inCol ? "bg-violet-500/10 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                }`}
                            >
                                <span className="truncate pr-3">{col.name}</span>
                                {inCol ? <Check className="w-4 h-4 text-violet-500 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
                            </button>
                        );
                    })}
                </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
