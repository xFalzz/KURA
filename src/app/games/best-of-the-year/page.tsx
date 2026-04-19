import GamesListPage from "@/components/GamesListPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Best of the Year | KURA",
  description: "Top rated games this year.",
};
export default function BestOfYearPage() {
  const currentYear = new Date().getFullYear();

  return (
    <GamesListPage
      title="Best of the year"
      subtitle={`The best games released in ${currentYear}`}
      params={{ dates: `${currentYear}-01-01,${currentYear}-12-31`, ordering: "-rating" }}
    />
  );
}
