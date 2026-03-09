"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, ChevronLeft, ChevronRight, Gamepad2, Trophy, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

interface RateGame {
  id: number;
  name: string;
  slug: string;
  background_image: string | null;
  rating: number;
  metacritic: number | null;
  genres: { name: string }[];
  released: string | null;
  ratings_count: number;
}

interface UserRating {
  rating: number;
  emoji: string;
}

const RATING_OPTIONS = [
  { value: 5, emoji: "🤩", label: "Exceptional" },
  { value: 4, emoji: "😊", label: "Recommended" },
  { value: 3, emoji: "🙂", label: "Meh" },
  { value: 2, emoji: "😞", label: "Skip it" },
  { value: 1, emoji: "💀", label: "Avoid" },
];

export default function RateTopGamesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [games, setGames] = useState<RateGame[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRatings, setUserRatings] = useState<Record<number, UserRating>>({});
  const [totalRated, setTotalRated] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    const fetchGames = async () => {
      try {
        const res = await fetch(
          `https://api.rawg.io/api/games?key=${RAWG_KEY}&ordering=-rating&page_size=30&metacritic=85,100`
        );
        const data = await res.json();
        setGames(data.results || []);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
      }
    };
    fetchGames();
  }, []);

  const loadUserRating = useCallback(async (gameId: number) => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(db, "gameRatings", `${user.uid}_${gameId}`));
      if (snap.exists()) {
        const d = snap.data();
        setUserRatings(prev => ({ ...prev, [gameId]: { rating: d.rating, emoji: d.emoji } }));
      }
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => {
    if (games[currentIdx]) loadUserRating(games[currentIdx].id);
  }, [currentIdx, games, loadUserRating]);

  const currentGame = games[currentIdx];
  const currentRating = currentGame ? userRatings[currentGame.id] : null;

  const handleRate = async (ratingOpt: typeof RATING_OPTIONS[0]) => {
    if (!user || !currentGame) return;
    setSaving(true);
    const newRating = { rating: ratingOpt.value, emoji: ratingOpt.emoji };
    setUserRatings(prev => ({ ...prev, [currentGame.id]: newRating }));
    try {
      await setDoc(doc(db, "gameRatings", `${user.uid}_${currentGame.id}`), {
        userId: user.uid,
        gameId: currentGame.id,
        gameName: currentGame.name,
        gameSlug: currentGame.slug,
        rating: ratingOpt.value,
        emoji: ratingOpt.emoji,
        label: ratingOpt.label,
        ratedAt: serverTimestamp(),
      });
      setTotalRated(n => n + 1);
    } catch { /* ignore */ }
    setSaving(false);
    // Auto-advance after rating
    setTimeout(() => {
      if (currentIdx < games.length - 1) setCurrentIdx(i => i + 1);
    }, 600);
  };

  const skip = () => {
    if (currentIdx < games.length - 1) setCurrentIdx(i => i + 1);
  };

  const prev = () => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-2 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-black text-foreground">Rate Top Games</h1>
        </div>
        <p className="text-muted-foreground text-xs sm:text-sm max-w-md px-2">
          Rate the all-time greats. Your taste shapes KURA&apos;s personalised recommendations.
        </p>
        {totalRated > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-green-500/10 border border-green-500/20 rounded-full px-3 py-1">
            <Trophy className="w-3.5 h-3.5 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400 font-semibold">{totalRated} rated this session</span>
          </div>
        )}
      </div>

      {/* Card */}
      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Loading top games…</span>
        </div>
      ) : !currentGame ? (
        <div className="text-center py-16">
          <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">You&apos;ve rated everything!</h2>
          <p className="text-muted-foreground text-sm mb-6">Impressive. Check your profile to see all your ratings.</p>
          <Link href="/profile" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">
            View Profile
          </Link>
        </div>
      ) : (
        <div className="w-full max-w-lg">
          {/* Progress */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <span>{currentIdx + 1} of {games.length}</span>
            <span>{Math.round(((currentIdx) / games.length) * 100)}% complete</span>
          </div>
          <div className="w-full h-1.5 bg-muted rounded-full mb-5 overflow-hidden">
            <div
              className="h-full bg-violet-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentIdx) / games.length) * 100}%` }}
            />
          </div>

          {/* Game card */}
          <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
            {/* Cover image */}
            {currentGame.background_image ? (
              <div className="relative w-full h-56 overflow-hidden">
                <Image
                  src={currentGame.background_image}
                  alt={currentGame.name}
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/70 via-black/10 to-transparent" />
                {/* Genre tags over image */}
                <div className="absolute bottom-3 left-4 flex gap-1.5 flex-wrap">
                  {currentGame.genres.slice(0, 3).map(g => (
                    <span key={g.name} className="text-[10px] bg-black/60 text-white px-2 py-0.5 rounded-full border border-white/10">
                      {g.name}
                    </span>
                  ))}
                </div>
                {/* Metacritic badge */}
                {currentGame.metacritic && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-black px-2 py-0.5 rounded-lg shadow">
                    {currentGame.metacritic}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full h-56 bg-muted flex items-center justify-center">
                <Gamepad2 className="w-12 h-12 text-muted-foreground/30" />
              </div>
            )}

            <div className="p-4 sm:p-5">
              <h2 className="text-lg sm:text-xl font-outfit font-black text-foreground mb-1 line-clamp-2">{currentGame.name}</h2>
              <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-muted-foreground mb-4 sm:mb-5">
                {currentGame.released && <span>{new Date(currentGame.released).getFullYear()}</span>}
                {currentGame.rating > 0 && (
                  <span className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {currentGame.rating.toFixed(1)}
                  </span>
                )}
                <span>{currentGame.ratings_count.toLocaleString()} ratings</span>
              </div>

              {/* Rating options */}
              {!user ? (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">Log in to rate games and get personalised recommendations</p>
                  <div className="flex gap-2 justify-center">
                    <Link href="/login" className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors">
                      Log in
                    </Link>
                    <Link href="/register" className="px-5 py-2 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-foreground text-sm font-semibold rounded-xl transition-colors">
                      Sign up
                    </Link>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-4">
                    {RATING_OPTIONS.map((opt) => {
                      const isSelected = currentRating?.rating === opt.value;
                      return (
                        <button
                          key={opt.value}
                          onClick={() => handleRate(opt)}
                          disabled={saving}
                          title={opt.label}
                          className={`flex flex-col items-center gap-1 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${
                            isSelected
                              ? "bg-violet-500/15 border-violet-500/50 shadow-inner"
                              : "bg-black/5 dark:bg-white/5 border-transparent hover:border-violet-500/30"
                          }`}
                        >
                          <span className="text-2xl">{opt.emoji}</span>
                          <span className="text-[9px] text-muted-foreground font-medium leading-tight text-center">{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {currentRating && (
                    <div className="text-center text-[10px] sm:text-xs text-violet-500 font-semibold mb-1 sm:mb-2">
                      You rated: {currentRating.emoji} — moving to next…
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={prev}
              disabled={currentIdx === 0}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>
            <button
              onClick={skip}
              disabled={currentIdx === games.length - 1}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
            >
              Skip
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
