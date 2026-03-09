

import Link from "next/link";
import { ChevronRight } from "lucide-react";

const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const NUMBERS = "0123456789#".split("");

interface SitemapGame {
  id: number;
  name: string;
  slug: string;
}

async function fetchGamesForLetter(letter: string): Promise<SitemapGame[]> {
  if (!RAWG_KEY) return [];
  const isNumber = letter === "#";
  const searchTerm = isNumber ? "1" : letter.toLowerCase();

  // Fetch 2 pages of name-searched results
  const pages = await Promise.all([1, 2].map(page =>
    fetch(
      `https://api.rawg.io/api/games?key=${RAWG_KEY}&search=${searchTerm}&ordering=name&page=${page}&page_size=40`,
      { next: { revalidate: 86400 } }
    ).then(r => r.json()).catch(() => ({ results: [] }))
  ));
  const all: SitemapGame[] = pages.flatMap(d => d.results || []);
  // Deduplicate
  const seen = new Set<number>();
  return all.filter(g => { if (seen.has(g.id)) return false; seen.add(g.id); return true; });
}

interface PageProps {
  params: Promise<{ letter: string }>;
}

export default async function SitemapLetterPage({ params }: PageProps) {
  const { letter } = await params;
  const activeLetter = letter.toUpperCase();
  const games = await fetchGamesForLetter(activeLetter);

  return (
    <div className="px-6 py-6 w-full">
      {/* Letter Navigation Bar */}
      <div className="flex flex-wrap items-center gap-1 mb-8 pb-4 border-b border-border">
        {[...ALPHABET, ...NUMBERS].map((l) => (
          <Link
            key={l}
            href={`/sitemap/${l.toLowerCase()}`}
            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-bold transition-all ${
              l === activeLetter
                ? "bg-foreground text-background"
                : "text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5"
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {/* Title */}
      <h1 className="text-4xl font-outfit font-black text-foreground mb-8">
        Games starting with {activeLetter}
      </h1>

      {games.length === 0 ? (
        <p className="text-muted-foreground">No games found for this letter.</p>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-x-8 space-y-0">
          {games.map((game) => (
            <div key={game.id} className="break-inside-avoid mb-1">
              <Link
                href={`/game/${game.slug}`}
                className="group flex items-center gap-1.5 py-1 text-sm text-foreground hover:text-violet-500 dark:hover:text-violet-400 transition-colors leading-tight"
              >
                <ChevronRight className="w-3 h-3 text-muted-foreground/40 group-hover:text-violet-400 shrink-0" />
                <span className="truncate">{game.name}</span>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
