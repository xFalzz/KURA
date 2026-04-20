"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Check, Loader2, Play, Trophy, XCircle, Clock, PauseCircle, Medal } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Game } from "@/lib/types";
import { logActivity } from "@/lib/activityLogger";
import { motion, AnimatePresence } from "framer-motion";

type LibraryStatus = "playing" | "beaten" | "dropped" | "plan" | "on_hold" | "completed_100";

const STATUSES: { id: LibraryStatus; label: string; icon: React.ReactNode; color: string }[] = [
  { id: "playing", label: "Playing", icon: <Play className="w-3.5 h-3.5" />, color: "text-green-500" },
  { id: "beaten", label: "Beaten", icon: <Trophy className="w-3.5 h-3.5" />, color: "text-blue-500" },
  { id: "completed_100", label: "100% Achieved", icon: <Medal className="w-3.5 h-3.5" />, color: "text-amber-500" },
  { id: "on_hold", label: "On Hold", icon: <PauseCircle className="w-3.5 h-3.5" />, color: "text-orange-500" },
  { id: "dropped", label: "Dropped", icon: <XCircle className="w-3.5 h-3.5" />, color: "text-red-500" },
  { id: "plan", label: "Plan to Play", icon: <Clock className="w-3.5 h-3.5" />, color: "text-yellow-500" },
];

interface AddToLibraryDropdownProps {
  game: Game;
  variant?: "card" | "full";
}

export default function AddToLibraryDropdown({ game, variant = "card" }: AddToLibraryDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<LibraryStatus | null>(null);
  const [docId, setDocId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const checkLibrary = async (uid: string) => {
      const q = query(
        collection(db, "library"),
        where("userId", "==", uid),
        where("game.id", "==", game.id)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const data = snap.docs[0].data();
        // Ignore wishlist item here since wishlist has its own dedicated button
        if (data.status !== "wishlist") {
           setCurrentStatus(data.status as LibraryStatus);
           setDocId(snap.docs[0].id);
        }
      }
    };

    const unsub = auth.onAuthStateChanged((u) => {
      if (u) checkLibrary(u.uid);
      else { setCurrentStatus(null); setDocId(null); }
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

  const handleSelect = async (status: LibraryStatus) => {
    const user = auth.currentUser;
    if (!user) { router.push("/login"); return; }

    setIsLoading(true);
    setIsOpen(false);

    try {
      if (docId) {
         if (status === currentStatus) {
           // Toggle off
           await deleteDoc(doc(db, "library", docId));
           setCurrentStatus(null);
           setDocId(null);
         } else {
           // Update status
           // Firebase requires updateDoc to change existing, but we can also just delete and add to keep it simple and clean
           await deleteDoc(doc(db, "library", docId));
           const ref = await addDoc(collection(db, "library"), {
             userId: user.uid,
             game: {
               id: game.id,
               name: game.name,
               slug: game.slug,
               background_image: game.background_image || "",
               rating: game.rating || 0,
               metacritic: game.metacritic || 0,
             },
             status,
             addedAt: new Date().toISOString(),
           });
           setCurrentStatus(status);
           setDocId(ref.id);
         }
      } else {
         const ref = await addDoc(collection(db, "library"), {
           userId: user.uid,
           game: {
             id: game.id,
             name: game.name,
             slug: game.slug,
             background_image: game.background_image || "",
             rating: game.rating || 0,
             metacritic: game.metacritic || 0,
           },
           status,
           addedAt: new Date().toISOString(),
         });
         setCurrentStatus(status);
         setDocId(ref.id);
         
         await logActivity({
           userId: user.uid,
           userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
           userImage: user.photoURL || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.uid}`,
           type: "LIBRARY_ADD",
           gameId: game.id,
           gameName: game.name,
           gameSlug: game.slug,
           gameImage: game.background_image || "",
           libraryStatus: status
         });
      }
    } catch (error) {
       console.error("Failed to update library", error);
    } finally {
       setIsLoading(false);
    }
  };

  const isFull = variant === "full";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsOpen(!isOpen); }}
        disabled={isLoading}
        className={
          isFull 
            ? `flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                currentStatus 
                 ? "bg-violet-600 border border-violet-500 shadow-[0_0_20px_rgba(124,58,237,0.3)] text-white"
                 : "bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground"
              }`
            : `flex items-center gap-1 text-[11px] font-medium text-foreground px-2 py-0.5 rounded transition-colors ${
                currentStatus 
                 ? "bg-violet-500/20 text-violet-500 hover:bg-violet-500/30" 
                 : "bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20"
              }`
        }
        title="Add to library"
      >
        {isLoading ? (
          <Loader2 className={`${isFull ? "w-4 h-4" : "w-3 h-3"} animate-spin`} />
        ) : currentStatus ? (
          <Check className={`${isFull ? "w-4 h-4" : "w-3 h-3"}`} />
        ) : (
          <Plus className={`${isFull ? "w-4 h-4" : "w-3 h-3"}`} />
        )}
        {isFull ? (currentStatus ? STATUSES.find(s => s.id === currentStatus)?.label : "Add to Library") : (game.added?.toLocaleString() || 0)}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-100 ${isFull ? "top-full left-0 mt-2" : "bottom-full mb-2 left-0"} w-48 bg-card dark:bg-zinc-900 border border-border shadow-2xl rounded-xl p-1.5 backdrop-blur-md`}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          >
            {STATUSES.map(s => (
              <button
                key={s.id}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleSelect(s.id); }}
                className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  currentStatus === s.id ? "bg-violet-500/10 text-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <div className={s.color}>{s.icon}</div>
                {s.label}
                {currentStatus === s.id && <Check className="w-4 h-4 ml-auto text-violet-500" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
