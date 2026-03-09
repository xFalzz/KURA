import GamesListPage from "@/components/GamesListPage";

export default function LastThirtyDaysPage() {
  const date = new Date();
  const today = date.toISOString().split("T")[0];
  date.setDate(date.getDate() - 30);
  const thirtyDaysAgo = date.toISOString().split("T")[0];

  return (
    <GamesListPage
      title="Last 30 days"
      subtitle="Games released in the last month"
      params={{ dates: `${thirtyDaysAgo},${today}`, ordering: "-released" }}
    />
  );
}
