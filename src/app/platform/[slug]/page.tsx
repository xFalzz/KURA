import GamesListPage from "@/components/GamesListPage";

interface PlatformPageProps {
  params: Promise<{ slug: string }>;
}

const PLATFORM_SLUG_TO_ID: Record<string, number> = {
  pc: 1,
  playstation: 2,
  xbox: 3,
  ios: 4,
  mac: 5,
  linux: 6,
  nintendo: 7,
  android: 8,
  atari: 9,
  "commodore-amiga": 10,
  sega: 11,
  "3do": 12,
  "neo-geo": 13,
  web: 14,
};

export default async function PlatformPage({ params }: PlatformPageProps) {
  const { slug } = await params;
  const platformId = PLATFORM_SLUG_TO_ID[slug];

  const formatted = slug
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <GamesListPage
      title={formatted}
      subtitle={`Browse all games available on ${formatted}`}
      params={platformId ? { parent_platforms: platformId } : {}}
    />
  );
}
