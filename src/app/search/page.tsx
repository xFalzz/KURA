"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import GamesListPage from "@/components/GamesListPage";

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  return (
    <GamesListPage
      title={query ? `Results for "${query}"` : "Search Games"}
      subtitle={query ? `Showing games matching your search` : "Enter a query to search"}
      params={query ? { search: query, search_precise: true } : {}}
    />
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="px-6 py-6"><div className="h-10 w-60 bg-white/5 rounded-lg animate-pulse mb-6"/></div>}>
      <SearchContent />
    </Suspense>
  );
}
