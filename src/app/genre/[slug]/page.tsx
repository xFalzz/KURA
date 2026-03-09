import GamesListPage from "@/components/GamesListPage";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
}

export default async function GenrePage({ params }: GenrePageProps) {
  const { slug } = await params;

  const formatted = slug
    .split("-")
    .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return (
    <GamesListPage
      title={formatted}
      subtitle={`Browse all ${formatted} games`}
      params={{ genres: slug }}
    />
  );
}
