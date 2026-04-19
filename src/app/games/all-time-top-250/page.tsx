import GamesListPage from "@/components/GamesListPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Time Top 250 | KURA",
  description: "The 250 highest-rated games of all time.",
};
export default function AllTimeTopPage() {
  return (
    <GamesListPage
      title="All time top 250"
      subtitle="The best games of all time"
      params={{ ordering: "-added", page_size: 250 }}
    />
  );
}
