import GamesListPage from "@/components/GamesListPage";

export default function ReleaseCalendarPage() {
  const date = new Date();
  const today = date.toISOString().split("T")[0];
  date.setDate(date.getDate() + 365);
  const nextYear = date.toISOString().split("T")[0];

  return (
    <GamesListPage
      title="Release calendar"
      subtitle="Upcoming releases and dates"
      params={{ dates: `${today},${nextYear}`, ordering: "released" }}
    />
  );
}
