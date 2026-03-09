import GamesListPage from "@/components/GamesListPage";

export default function AllGamesPage() {
  return (
    <GamesListPage
      title="All Games"
      subtitle="The complete KURA game database"
      params={{ ordering: "-added" }}
    />
  );
}
