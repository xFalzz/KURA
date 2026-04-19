import GamesListPage from "@/components/GamesListPage";
import CuratedBanner from "@/components/CuratedBanner";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KURA - Game Discovery Platform",
  description: "Discover, review, and track the best video games.",
};

export default function Home() {
  return (
    <div className="space-y-8">
      <CuratedBanner />
      <GamesListPage
        title="New and trending"
        subtitle="Based on player counts and release date"
      />
    </div>
  );
}
