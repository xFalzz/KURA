import GamesListPage from "@/components/GamesListPage";
import CuratedBanner from "@/components/CuratedBanner";

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
