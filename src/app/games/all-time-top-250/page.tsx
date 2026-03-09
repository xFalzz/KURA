import GamesListPage from "@/components/GamesListPage";

export default function AllTimeTopPage() {
  return (
    <GamesListPage
      title="All time top 250"
      subtitle="The best games of all time"
      params={{ ordering: "-added", page_size: 250 }}
    />
  );
}
