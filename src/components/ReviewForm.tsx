"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Star, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewFormProps {
  gameId: string;
  gameName: string;
  gameSlug: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ gameId, gameName, gameSlug, onReviewSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewText, setReviewText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const user = auth.currentUser;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("You must be logged in to write a review.");
      return;
    }
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (reviewText.trim().length < 10) {
      setError("Review must be at least 10 characters long.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await addDoc(collection(db, "reviews"), {
        gameId,
        gameName,
        gameSlug,
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        rating,
        text: reviewText.trim(),
        likes: 0,
        createdAt: serverTimestamp(),
      });

      setRating(0);
      setReviewText("");
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to submit review.");
      } else {
        setError("Failed to submit review.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold mb-2">Write a Review</h3>
        <p className="text-muted-foreground text-sm mb-4">You need to log in to share your thoughts on {gameName}.</p>
        <Button variant="outline" onClick={() => window.location.href = "/login"}>
          Log In to Review
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        Write a Review for {gameName}
      </h3>
      
      {error && (
        <div className="p-3 mb-4 text-sm bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform hover:scale-110 focus:outline-none"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
            >
              <Star
                className={`w-8 h-8 ${
                  (hoverRating || rating) >= star
                    ? "fill-yellow-500 text-yellow-500"
                    : "text-muted-foreground"
                } transition-colors`}
              />
            </button>
          ))}
          <span className="ml-3 text-sm font-medium text-muted-foreground">
            {rating > 0 ? `${rating} / 5 Stars` : "Select a rating"}
          </span>
        </div>

        {/* Text Area */}
        <div className="relative">
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="What did you think about this game? (min. 10 characters)"
            className="w-full h-32 p-4 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-y"
            maxLength={1000}
          />
          <div className="absolute bottom-3 right-3 text-xs text-muted-foreground pointer-events-none">
            {reviewText.length}/1000
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || rating === 0 || reviewText.trim().length < 10}
            className="bg-violet-600 hover:bg-violet-700 text-white gap-2 px-6 rounded-xl"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Publish Review
          </Button>
        </div>
      </form>
    </div>
  );
}
