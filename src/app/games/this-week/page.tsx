import GamesListPage from "@/components/GamesListPage";

export default function ThisWeekPage() {
  const date = new Date();
  const end = date.toISOString().split("T")[0];
  date.setDate(date.getDate() - 7);
  const start = date.toISOString().split("T")[0];

  return (
    <GamesListPage
      title="This week"
      subtitle="Games released this week"
      params={{ dates: `${start},${end}`, ordering: "-released" }}
    />
  );
}
