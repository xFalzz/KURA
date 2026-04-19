import GamesListPage from "@/components/GamesListPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Games | KURA",
  description: "Browse all games on KURA.",
};
export default function AllGamesPage() {
  return (
    <GamesListPage
      title="All Games"
      subtitle="The complete KURA game database"
      params={{ ordering: "-added" }}
    />
  );
}
