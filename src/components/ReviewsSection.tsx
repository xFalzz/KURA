"use client";

import { useState } from "react";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";

interface ReviewsSectionProps {
  gameId: string;
  gameName: string;
  gameSlug: string;
}

export default function ReviewsSection({ gameId, gameName, gameSlug }: ReviewsSectionProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleReviewSubmitted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="mt-12 space-y-8">
      <ReviewForm
        gameId={gameId}
        gameName={gameName}
        gameSlug={gameSlug}
        onReviewSubmitted={handleReviewSubmitted}
      />
      <ReviewList gameId={gameId} refreshTrigger={refreshTrigger} />
    </div>
  );
}
