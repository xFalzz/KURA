"use client";

import { useEffect, useState, use } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, ArrowLeft, Star, Monitor, FolderOpen, AlertCircle } from "lucide-react";
import AddToLibraryDropdown from "@/components/AddToLibraryDropdown";
import AddToWishlistButton from "@/components/AddToWishlistButton";
import AddToCollectionDropdown from "@/components/AddToCollectionDropdown";
import { Game } from "@/lib/types";

interface CollectionData {
  id: string;
  name: string;
  description: string;
  userId: string;
}

export default function CollectionViewPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collectionData, setCollectionData] = useState<CollectionData | null>(null);
  const [games, setGames] = useState<Game[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) { router.push("/login?redirect=/collections/" + resolvedParams.id); }
    });
    return () => unsub();
  }, [router, resolvedParams.id]);

  useEffect(() => {
    const fetchCollection = async () => {
      if (!user) return;
      try {
        const colRef = doc(db, "collections", resolvedParams.id);
        const colSnap = await getDoc(colRef);
        
        if (!colSnap.exists()) {
           setLoading(false);
           return;
        }

        const data = colSnap.data();
        if (data.userId !== user.uid) {
           // Not authorized to view or it's private
           setLoading(false);
           return;
        }

        setCollectionData({ id: colSnap.id, ...data } as CollectionData);

        // Fetch games inside subcollection
        const gamesRef = collection(db, "collections", resolvedParams.id, "games");
        const gamesSnap = await getDocs(gamesRef);
        const gamesList = gamesSnap.docs.map(d => d.data() as Game & { addedAt: string });
        
        // Sort by dates added by default (descending)
        gamesList.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
        setGames(gamesList);

      } catch (e) {
        console.error("Error fetching collection details:", e);
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
        fetchCollection();
    }
  }, [user, resolvedParams.id]);

  if (loading) return (
    <div className="flex justify-center flex-col items-center min-h-[60vh] gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      <p className="text-sm text-muted-foreground animate-pulse">Loading collection...</p>
    </div>
  );

  if (!collectionData) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
      <AlertCircle className="w-16 h-16 text-muted-foreground/50" />
      <h1 className="text-2xl font-bold text-foreground">Collection not found</h1>
      <p className="text-muted-foreground max-w-sm">This collection may have been deleted or you don&apos;t have permission to view it.</p>
      <Link href="/collections" className="mt-4 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl transition-colors font-medium">
        Back to My Collections
      </Link>
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-7xl mx-auto">
      {/* Header section with back button */}
      <div className="mb-8">
        <Link href="/collections" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-6 group">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center group-hover:bg-black/10 dark:group-hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </div>
          Back to Collections
        </Link>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/20">
              <FolderOpen className="w-8 h-8 text-violet-500" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">{collectionData.name}</h1>
              {collectionData.description && (
                <p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base leading-relaxed">
                  {collectionData.description}
                </p>
              )}
              <div className="flex items-center gap-3 mt-3 text-xs font-medium text-muted-foreground">
                <span className="bg-secondary px-2.5 py-1 rounded-md">{games.length} Games</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {games.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center bg-card rounded-3xl border border-border mt-8">
          <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-foreground">This collection is empty</h2>
          <p className="text-muted-foreground max-w-md">Find games you like and use the &quot;Add to Collection&quot; button to place them here.</p>
          <Link href="/games" className="mt-2 px-6 py-2 border border-border hover:bg-black/5 dark:hover:bg-white/5 text-foreground rounded-xl transition-colors font-medium">
            Browse Games
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 mt-8">
          {games.map((g) => (
            <Link key={g.id} href={`/game/${g.slug}`} className="group relative rounded-2xl bg-card border border-border hover:border-violet-500/50 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] transition-all duration-300 overflow-hidden flex flex-col h-full">
              <div className="relative aspect-3/4 w-full overflow-hidden bg-muted">
                {g.background_image ? (
                  <Image src={g.background_image} alt={g.name} fill sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <Monitor className="w-8 h-8 text-muted-foreground/50" />
                  </div>
                )}
                <div className="absolute inset-0 bg-linear-to-t from-background/90 via-background/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="font-bold text-base text-foreground line-clamp-2 mb-2 group-hover:text-violet-500 transition-colors flex-1">{g.name}</h3>
                <div className="flex items-center justify-between gap-2 mt-auto">
                    <div className="flex items-center gap-1.5 bg-background border border-border px-2 py-1 rounded-lg">
                        <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold text-foreground">{g.rating.toFixed(1)}</span>
                    </div>
                </div>
              </div>

               {/* Quick Actions Hover */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-auto">
                <AddToLibraryDropdown game={g as Game} variant="card" />
                <AddToWishlistButton game={g as Game} variant="card" />
                <AddToCollectionDropdown game={g as Game} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
