import GamesListPage from "@/components/GamesListPage";

export default function NextWeekPage() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  const start = date.toISOString().split("T")[0];
  date.setDate(date.getDate() + 7);
  const end = date.toISOString().split("T")[0];

  return (
    <GamesListPage
      title="Next week"
      subtitle="Upcoming games releasing next week"
      params={{ dates: `${start},${end}`, ordering: "released" }}
    />
  );
}
