"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment, limit, Timestamp } from "firebase/firestore";
import { Star, ThumbsUp, MessageSquare, Loader2, Sparkles } from "lucide-react";
import Image from "next/image";

interface Review {
  id: string;
  gameId: string;
  gameName: string;
  gameSlug: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  rating: number;
  text: string;
  likes: number;
  createdAt: Timestamp | null;
}

interface ReviewListProps {
  gameId: string;
  refreshTrigger?: number; // Used to re-fetch when a new review is submitted
}

export default function ReviewList({ gameId, refreshTrigger = 0 }: ReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Note: We need a composite index in Firestore for where("gameId") + orderBy("createdAt", "desc"). 
      // If index is missing, and we use real firestore, it will fail and provide a link to build the index in console log.
      // As a fallback, we fetch all for the game and sort in JS if we don't assume the index exists.
      const q = query(
        collection(db, "reviews"),
        where("gameId", "==", gameId),
        // orderBy("createdAt", "desc"), // Requires index
        limit(50)
      );
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Review));
      
      // Sort manually as fallback for missing index
      items.sort((a, b) => {
        const timeA = a.createdAt?.toMillis() || 0;
        const timeB = b.createdAt?.toMillis() || 0;
        return timeB - timeA;
      });

      setReviews(items);
    } catch (err) {
      console.error("Failed to fetch reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshTrigger]);

  const handleLike = async (reviewId: string) => {
    if (!auth.currentUser) return; // Must be logged in
    
    // In a real robust app, we should check a "review_likes" subcollection to prevent multiple likes from same user.
    // For now, we do a simple increment.
    setLikingId(reviewId);
    try {
      const reviewRef = doc(db, "reviews", reviewId);
      await updateDoc(reviewRef, {
        likes: increment(1)
      });
      // Optimistic UI update
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, likes: r.likes + 1 } : r));
    } catch (err) {
      console.error("Failed to like review:", err);
    } finally {
      setLikingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (reviews.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center justify-center text-center bg-card/50 border border-border border-dashed rounded-2xl">
        <Sparkles className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
        <h4 className="text-lg font-bold">No reviews yet</h4>
        <p className="text-muted-foreground text-sm max-w-sm mt-1">
          Be the first to share your experience and thoughts about this game!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      <h3 className="text-2xl font-bold font-outfit flex items-center gap-2">
        <MessageSquare className="w-6 h-6 text-violet-500" />
        Community Reviews <span className="text-muted-foreground text-lg ml-2">({reviews.length})</span>
      </h3>
      
      <div className="grid gap-4">
        {reviews.map(review => (
          <div key={review.id} className="bg-card border border-border rounded-2xl p-5 hover:border-violet-500/30 transition-colors">
            {/* Header: User & Rating */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden relative">
                  {review.userPhoto ? (
                    <Image src={review.userPhoto} alt={review.userName} fill className="object-cover" sizes="40px" />
                  ) : (
                    review.userName[0]?.toUpperCase() || "U"
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground">{review.userName}</div>
                  <div className="text-xs text-muted-foreground">
                    {review.createdAt ? new Date(review.createdAt.toMillis()).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : "Recently"}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">{review.rating}</span>
              </div>
            </div>

            {/* Review Body */}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {review.text}
            </p>

            {/* Actions */}
            <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border">
              <button 
                onClick={() => handleLike(review.id)}
                disabled={likingId === review.id || !auth.currentUser}
                className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                  !auth.currentUser ? 'opacity-50 cursor-not-allowed text-muted-foreground' : 'text-muted-foreground hover:text-violet-500'
                }`}
                title={!auth.currentUser ? "Log in to like" : "Like this review"}
              >
                {likingId === review.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ThumbsUp className="w-4 h-4" />
                )}
                Helpful {review.likes > 0 && `(${review.likes})`}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
