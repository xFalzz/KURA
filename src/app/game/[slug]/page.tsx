import { getGameDetails, getGameScreenshots } from "@/services/api";
import Image from "next/image";
import { Star, ChevronLeft, Globe, ShoppingBag } from "lucide-react";
import Link from "next/link";
import AddToWishlistButton from "@/components/AddToWishlistButton";
import RatingsBar from "@/components/RatingsBar";
import type { Metadata } from "next";
import type { Platform, Genre, Tag, Developer, Publisher, StoreEntry, EsrbRating, Rating, Screenshot } from "@/lib/types";

interface Props {
  params: Promise<{ slug: string }>;
}

interface GameDetail {
  id: number;
  slug: string;
  name: string;
  released: string;
  background_image: string;
  metacritic: number;
  rating: number;
  added: number;
  playtime: number;
  reviews_count: number;
  ratings_count: number;
  description: string;
  description_raw: string;
  website: string;
  esrb_rating?: EsrbRating;
  genres: Genre[];
  platforms: Platform[];
  developers: Developer[];
  publishers: Publisher[];
  tags: Tag[];
  stores: StoreEntry[];
  ratings: Rating[];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const game = await getGameDetails(slug) as GameDetail;
    return {
      title: `${game.name} | KURA`,
      description: game.description_raw?.slice(0, 160) || `Discover ${game.name} on KURA`,
    };
  } catch {
    return { title: "Game | KURA" };
  }
}

export default async function GameDetailPage({ params }: Props) {
  const { slug } = await params;

  let game: GameDetail;
  let screenshots: Screenshot[] = [];

  try {
    game = await getGameDetails(slug) as GameDetail;
    const ssData = await getGameScreenshots(slug) as { results: Screenshot[] };
    screenshots = ssData?.results || [];
  } catch {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <h1 className="text-2xl font-bold text-zinc-400">Game not found</h1>
        <Link href="/" className="text-violet-400 hover:text-violet-300 transition-colors">← Back to home</Link>
      </div>
    );
  }

  const metacriticColor = game.metacritic >= 75 ? "#66cc33" : game.metacritic >= 50 ? "#ffbd3f" : "#ff6161";

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <div className="relative w-full h-[55vh] min-h-[450px] overflow-hidden">
        {/* Deep gradient overlays for premium cinema-style bleed */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/80 to-background/30 z-10" />
        <div className="absolute inset-0 bg-linear-to-r from-background via-background/60 to-transparent z-10" />
        {/* Vignette shadow */}
        <div className="absolute inset-0 shadow-[inset_0_0_150px_rgba(0,0,0,0.9)] z-10" />

        {game.background_image && (
          <Image
            src={game.background_image}
            alt={game.name}
            fill
            priority
            className="object-cover"
          />
        )}

        <div className="absolute top-6 left-6 z-20">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 -mt-32 relative z-20 max-w-[1400px]">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — main info */}
          <div className="lg:col-span-2">
            {/* Title Block */}
            <div className="mb-8">
              {/* Badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {game.esrb_rating && (
                  <span className="text-xs px-2 py-0.5 rounded border border-border text-muted-foreground bg-muted">
                    {game.esrb_rating.name}
                  </span>
                )}
                {game.released && (
                  <span className="text-xs text-muted-foreground">
                    {new Date(game.released).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </div>

              <h1 className="text-5xl md:text-6xl font-outfit font-black text-foreground mb-4 leading-tight">
                {game.name}
              </h1>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <AddToWishlistButton game={game as Parameters<typeof AddToWishlistButton>[0]["game"]} />
                <a
                  href={game.website || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-foreground text-sm font-medium transition-colors"
                >
                  <Globe className="w-4 h-4" /> Website
                </a>
              </div>

              {/* Stats row */}
              <div className="flex flex-wrap items-center gap-5 mb-6">
                {game.metacritic && (
                  <div className="flex flex-col items-center">
                    <div
                      className="text-2xl font-black px-3 py-1 rounded-lg border-2"
                      style={{ color: metacriticColor, borderColor: metacriticColor }}
                    >
                      {game.metacritic}
                    </div>
                    <span className="text-xs text-zinc-500 mt-1">Metascore</span>
                  </div>
                )}
                {game.rating > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-1 text-2xl font-black text-foreground">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      {game.rating.toFixed(1)}
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">Rating</span>
                  </div>
                )}
                {game.added > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-black text-foreground">{(game.added / 1000).toFixed(1)}k</div>
                    <span className="text-xs text-muted-foreground mt-1">Added</span>
                  </div>
                )}
                {game.playtime > 0 && (
                  <div className="flex flex-col items-center">
                    <div className="text-2xl font-black text-foreground">{game.playtime}h</div>
                    <span className="text-xs text-muted-foreground mt-1">Avg playtime</span>
                  </div>
                )}
              </div>

              {/* About */}
              <section className="mb-10">
                <h2 className="text-xl font-outfit font-bold text-foreground mb-4">About</h2>
                <div
                  className="text-muted-foreground leading-relaxed text-sm space-y-3 [&_p]:mb-3 [&_a]:text-violet-500 dark:[&_a]:text-violet-400 [&_a:hover]:underline"
                  dangerouslySetInnerHTML={{ __html: game.description || "<p>No description available.</p>" }}
                />
              </section>
            </div>

            {/* Screenshots Gallery */}
            {screenshots.length > 0 && (
              <section className="mb-10">
                <h2 className="text-xl font-outfit font-bold text-foreground mb-4">Screenshots</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {screenshots.slice(0, 6).map((shot: Screenshot) => (
                    <div key={shot.id} className="relative aspect-video rounded-xl overflow-hidden group cursor-zoom-in bg-muted">
                      <Image
                        src={shot.image}
                        alt="Game screenshot"
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Ratings breakdown using new interactive component */}
            {game.ratings?.length > 0 && (
              <RatingsBar ratings={game.ratings} />
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6 pt-4">
            <div className="bg-secondary rounded-2xl p-5 space-y-4 border border-border">
              {/* Platforms */}
              {game.platforms?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Platforms</h3>
                  <div className="flex flex-wrap gap-2">
                    {game.platforms.map((p: Platform) => (
                      <span key={p.platform.id} className="text-sm bg-background border border-border text-foreground px-3 py-1.5 rounded-lg font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                        {p.platform.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Stores */}
              {game.stores?.length > 0 && (
                <div className="pt-2">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">Where to buy</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {game.stores.map((s: StoreEntry) => (
                      <a
                        key={s.id}
                        href={`https://${s.store.domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-background hover:bg-black/5 dark:hover:bg-white/5 border border-border text-foreground hover:text-violet-500 dark:hover:text-violet-400 px-3 py-2 rounded-lg transition-all"
                      >
                        <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-xs font-semibold truncate">{s.store.name}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Genres */}
              {game.genres?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Genre</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {game.genres.map((g: Genre) => (
                      <Link key={g.id} href={`/genre/${g.slug}`} className="text-xs text-violet-500 dark:text-violet-400 hover:text-violet-600 dark:hover:text-violet-300 hover:underline transition-colors">
                        {g.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Developer */}
              {game.developers?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Developer</h3>
                  <p className="text-sm text-foreground">{game.developers.map((d: Developer) => d.name).join(", ")}</p>
                </div>
              )}

              {/* Publisher */}
              {game.publishers?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Publisher</h3>
                  <p className="text-sm text-foreground">{game.publishers.map((p: Publisher) => p.name).join(", ")}</p>
                </div>
              )}

              {/* Release date */}
              {game.released && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Release date</h3>
                  <p className="text-sm text-foreground">
                    {new Date(game.released).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              )}

              {/* Tags */}
              {game.tags?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {game.tags.slice(0, 10).map((tag: Tag) => (
                      <span key={tag.id} className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">
                        {tag.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Website */}
              {game.website && (
                <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Website</h3>
                  <a href={game.website} target="_blank" rel="noopener noreferrer" className="text-sm text-violet-400 hover:underline break-all">
                    {game.website}
                  </a>
                </div>
              )}
            </div>

            {/* Overview stats */}
            {game.ratings_count > 0 && (
              <div className="bg-secondary rounded-2xl p-5 border border-white/5">
                <h3 className="text-sm font-semibold text-white mb-4">Overview</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Reviews</span>
                    <span className="text-zinc-300">{game.reviews_count?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Added by</span>
                    <span className="text-zinc-300">{game.added?.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Avg playtime</span>
                    <span className="text-zinc-300">{game.playtime}h</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="h-16" />
    </div>
  );
}
