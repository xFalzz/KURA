import GamesListPage from "@/components/GamesListPage";
import CuratedBanner from "@/components/CuratedBanner";
import ActivityFeed from "@/components/ActivityFeed";

export default function Home() {
  return (
    <div className="space-y-8">
      <CuratedBanner />
      <ActivityFeed />
      <GamesListPage
        title="New and trending"
        subtitle="Based on player counts and release date"
      />
    </div>
  );
}
