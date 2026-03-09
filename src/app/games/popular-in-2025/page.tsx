import GamesListPage from "@/components/GamesListPage";

export default function PopularInYearPage() {
  const year = 2025; // Matches the sidebar text "Popular in 2025"

  return (
    <GamesListPage
      title={`Popular in ${year}`}
      subtitle={`The most anticipated and popular games in ${year}`}
      params={{ dates: `${year}-01-01,${year}-12-31`, ordering: "-added" }}
    />
  );
}
