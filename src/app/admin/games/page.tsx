"use client";

import { useEffect, useState, useCallback } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { searchGames } from "@/services/api";
import { useDebounce } from "@/hooks/useDebounce";
import { Gamepad2, Search, Loader2, Star, ExternalLink, Plus, Copy, Check, TrendingUp, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";
import Image from "next/image";
import Link from "next/link";

interface GameResult {
  id: number;
  slug: string;
  name: string;
  background_image: string | null;
  rating: number;
  released: string | null;
  genres: { id: number; name: string }[];
  metacritic: number | null;
}

interface TopReviewedGame {
  gameId: string;
  gameName: string;
  gameSlug: string;
  count: number;
}

export default function AdminGamesPage() {
  const [searchInput, setSearchInput] = useState("");
  const [results, setResults] = useState<GameResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [curationGameIds, setCurationGameIds] = useState<number[]>([]);
  const [topGames, setTopGames] = useState<TopReviewedGame[]>([]);
  const [loadingTop, setLoadingTop] = useState(true);

  const debouncedSearch = useDebounce(searchInput, 400);

  // Fetch curation config
  useEffect(() => {
    const fetchCuration = async () => {
      try {
        const docRef = doc(db, "settings", "curation_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists() && docSnap.data()?.curation?.gameIds) {
          setCurationGameIds(docSnap.data().curation.gameIds);
        }
      } catch {
        // ignore
      }
    };
    fetchCuration();
  }, []);

  // Fetch top reviewed games
  useEffect(() => {
    const fetchTopGames = async () => {
      setLoadingTop(true);
      try {
        const reviewsQ = query(collection(db, "reviews"), limit(200));
        const snap = await getDocs(reviewsQ);
        const counts: Record<string, TopReviewedGame> = {};
        snap.docs.forEach(d => {
          const data = d.data();
          const key = data.gameId?.toString() || data.gameSlug;
          if (!key) return;
          if (!counts[key]) {
            counts[key] = { gameId: key, gameName: data.gameName || "Unknown", gameSlug: data.gameSlug || key, count: 0 };
          }
          counts[key].count++;
        });
        const sorted = Object.values(counts).sort((a, b) => b.count - a.count).slice(0, 10);
        setTopGames(sorted);
      } catch (error) {
        console.error("Failed to fetch top games:", error);
      } finally {
        setLoadingTop(false);
      }
    };
    fetchTopGames();
  }, []);

  // Search RAWG
  const doSearch = useCallback(async (term: string) => {
    if (!term || term.length < 2) { setResults([]); return; }
    setSearching(true);
    try {
      const data = await searchGames(term);
      setResults(data.results?.slice(0, 12) || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => { doSearch(debouncedSearch); }, [debouncedSearch, doSearch]);

  const copyId = (id: number) => {
    navigator.clipboard.writeText(id.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const addToCuration = async (gameId: number) => {
    if (curationGameIds.includes(gameId)) return;
    setAddingId(gameId);
    try {
      const newIds = [...curationGameIds, gameId];
      const docRef = doc(db, "settings", "curation_config");
      const docSnap = await getDoc(docRef);
      const existing = docSnap.exists() ? docSnap.data().curation || {} : {};
      await setDoc(docRef, {
        curation: { ...existing, gameIds: newIds, updatedAt: new Date() }
      }, { merge: true });
      setCurationGameIds(newIds);
      await logAdminAction({ action: "ADDED_TO_CURATION", targetId: gameId.toString(), details: `Added game ${gameId} to curation list` });
    } catch (error) {
      console.error("Failed to add to curation:", error);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Gamepad2 className="w-7 h-7 text-primary" /> Game Manager
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Search the RAWG database, preview games, and add them to curated collections.
        </p>
      </div>

      {/* Search */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-base font-bold font-outfit text-foreground">Search RAWG Database</h2>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search games by name... (e.g. The Witcher 3)"
            className="w-full bg-background border border-border rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          />
          {searching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 animate-spin text-muted-foreground" />}
        </div>

        {/* Results Grid */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {results.map(game => {
              const inCuration = curationGameIds.includes(game.id);
              return (
                <div key={game.id} className="bg-background border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors group">
                  {/* Game Image */}
                  <div className="relative h-32 bg-muted">
                    {game.background_image ? (
                      <Image src={game.background_image} alt={game.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">No Image</div>
                    )}
                    {/* RAWG ID Badge */}
                    <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-1 rounded-md flex items-center gap-1">
                      <Hash className="w-3 h-3" /> {game.id}
                    </div>
                    {game.metacritic && (
                      <div className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-md ${game.metacritic >= 75 ? "bg-green-500 text-white" : game.metacritic >= 50 ? "bg-amber-500 text-white" : "bg-red-500 text-white"}`}>
                        {game.metacritic}
                      </div>
                    )}
                  </div>

                  {/* Game Info */}
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1">{game.name}</h3>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                      {game.released && <span>{new Date(game.released).getFullYear()}</span>}
                      {game.rating > 0 && (
                        <span className="flex items-center gap-0.5 text-amber-500">
                          <Star className="w-3 h-3 fill-amber-500" /> {game.rating.toFixed(1)}
                        </span>
                      )}
                      {game.genres?.slice(0, 2).map(g => (
                        <span key={g.id} className="bg-muted px-1.5 py-0.5 rounded text-[10px]">{g.name}</span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/game/${game.slug}`} target="_blank">
                        <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg gap-1">
                          <ExternalLink className="w-3 h-3" /> View
                        </Button>
                      </Link>
                      <Button variant="outline" size="sm" className="text-xs h-7 rounded-lg gap-1"
                        onClick={() => copyId(game.id)}>
                        {copiedId === game.id ? <><Check className="w-3 h-3 text-green-500" /> Copied</> : <><Copy className="w-3 h-3" /> ID</>}
                      </Button>
                      <Button size="sm"
                        className={`text-xs h-7 rounded-lg gap-1 ml-auto ${inCuration ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-violet-500"} text-white`}
                        onClick={() => addToCuration(game.id)}
                        disabled={inCuration || addingId === game.id}>
                        {addingId === game.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                          inCuration ? <><Check className="w-3 h-3" /> Curated</> : <><Plus className="w-3 h-3" /> Curate</>}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {searchInput.length >= 2 && !searching && results.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No games found for &quot;{searchInput}&quot;
          </div>
        )}
      </div>

      {/* Top Reviewed Games on KURA */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-border flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          <h2 className="text-base font-bold font-outfit text-foreground">Most Reviewed on KURA</h2>
        </div>
        {loadingTop ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : topGames.length > 0 ? (
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3 text-left font-medium">#</th>
                <th className="px-5 py-3 text-left font-medium">Game</th>
                <th className="px-5 py-3 text-right font-medium">Reviews</th>
                <th className="px-5 py-3 text-right font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {topGames.map((game, i) => (
                <tr key={game.gameId} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-medium text-foreground">{game.gameName}</td>
                  <td className="px-5 py-3.5 text-right">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-lg">{game.count} reviews</span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Link href={`/game/${game.gameSlug}`} target="_blank" className="text-xs text-primary hover:underline font-medium">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">No reviewed games found yet.</div>
        )}
      </div>
    </div>
  );
}
