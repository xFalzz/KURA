"use client";

import { useEffect, useState, useCallback } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, increment, limit, Timestamp, addDoc, serverTimestamp } from "firebase/firestore";
import { Star, ThumbsUp, MessageSquare, Loader2, Sparkles, Flag, X } from "lucide-react";
import Image from "next/image";
import { useAuthState } from "react-firebase-hooks/auth";

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
  status?: string;
  isFeatured?: boolean;
  createdAt: Timestamp | null;
}

interface ReviewListProps {
  gameId: string;
  refreshTrigger?: number; // Used to re-fetch when a new review is submitted
}

export default function ReviewList({ gameId, refreshTrigger = 0 }: ReviewListProps) {
  const [user] = useAuthState(auth);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [likingId, setLikingId] = useState<string | null>(null);
  
  // Reporting state
  const [reportingReviewId, setReportingReviewId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    try {
      // Note: We need a composite index in Firestore for where("gameId") + where("status")
      // As a fallback, we fetch by gameId and filter in JS if the index doesn't exist.
      const q = query(
        collection(db, "reviews"),
        where("gameId", "==", gameId),
        limit(100) // Increase limit slightly because we are filtering client-side
      );
      const snap = await getDocs(q);
      
      // Filter out pending reviews
      const items = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Review))
        .filter(r => r.status === "published" || !r.status); // Fallback for old reviews without status
      
      // Sort manually: Featured first, then newest
      items.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        
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

  const handleReport = async (reviewId: string) => {
    if (!user) {
      alert("You must be logged in to report a review.");
      return;
    }
    
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting.");
      return;
    }

    setSubmittingReport(true);
    try {
      await addDoc(collection(db, "reports"), {
        reviewId,
        gameId,
        reporterUid: user.uid,
        reporterName: user.displayName || user.email || "Unknown User",
        reason: reportReason,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      alert("Report submitted successfully. Thank you for keeping KURA safe!");
      setReportingReviewId(null);
      setReportReason("");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setSubmittingReport(false);
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
                  <div className="flex items-center gap-2">
                    <div className="font-bold text-sm text-foreground">{review.userName}</div>
                    {/* Add Admin Badge if this user is the admin (matching our env config) */}
                    {review.userName.toLowerCase().includes("admin") && (
                       <span className="text-[10px] font-black bg-violet-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Admin</span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                    {review.createdAt ? new Date(review.createdAt.toMillis()).toLocaleDateString(undefined, {
                      year: 'numeric', month: 'long', day: 'numeric'
                    }) : "Recently"}
                    
                    {review.isFeatured && (
                      <span className="flex items-center gap-1 text-violet-500 font-bold bg-violet-500/10 px-1.5 py-0.5 rounded uppercase text-[10px]">
                        <Star className="w-3 h-3 fill-violet-500" /> KURA&apos;s Choice
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0">
                <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                <span className="text-sm font-bold text-yellow-500">{review.rating}</span>
              </div>
            </div>

            {/* Review Body */}
            <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed">
              {review.text}
            </p>

            {/* Actions */}
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
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

              <button
                onClick={() => setReportingReviewId(review.id)}
                className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors"
                title="Report Review"
              >
                <Flag className="w-3.5 h-3.5" />
                Report
              </button>
            </div>

            {/* Inline Report Form */}
            {reportingReviewId === review.id && (
              <div className="mt-4 p-4 bg-muted/30 border border-border rounded-xl animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" /> Report this review
                  </h4>
                  <button onClick={() => setReportingReviewId(null)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mb-3">Please provide details on why this review is inappropriate.</p>
                <textarea
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="e.g. Contains spoilers, spam, offensive language..."
                  className="w-full bg-background border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none min-h-[80px]"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button 
                    onClick={() => setReportingReviewId(null)}
                    disabled={submittingReport}
                    className="px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleReport(review.id)}
                    disabled={submittingReport || !reportReason.trim()}
                    className="px-3 py-1.5 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {submittingReport ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                    Submit Report
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
