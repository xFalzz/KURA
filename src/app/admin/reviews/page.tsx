"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, query, limit } from "firebase/firestore";
import { Trash2, AlertTriangle, Loader2, Star, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reviews"), limit(100));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({id: d.id, ...d.data()}));
      
      // Fallback manual sort
      items.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setReviews(items);
    } catch (error: unknown) {
      console.error("Failed to fetch reviews for moderation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) {
      return;
    }

    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "reviews", id));
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Error deleting review.");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-black text-foreground">Content Moderation</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and manage all user-generated comments across KURA.</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium w-[150px]">Author</th>
                <th className="px-6 py-4 font-medium w-[200px]">Game</th>
                <th className="px-6 py-4 font-medium w-[100px]">Rating</th>
                <th className="px-6 py-4 font-medium">Review Content</th>
                <th className="px-6 py-4 font-medium text-right w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review) => (
                <tr key={review.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{review.userName}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-1" title="User ID">
                      {review.userId.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Link href={`/game/${review.gameSlug}`} className="text-violet-500 hover:underline flex items-center gap-1 font-medium">
                      {review.gameName} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold bg-yellow-500/10 px-2 py-1 rounded w-fit">
                      <Star className="w-3.5 h-3.5 fill-yellow-500" /> {review.rating}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-foreground text-sm line-clamp-3 leading-relaxed">
                      {review.text}
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                       {review.createdAt ? new Date(review.createdAt.toMillis()).toLocaleString() : 'N/A'} • {review.likes || 0} Likes
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDelete(review.id)}
                      disabled={deletingId === review.id}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </td>
                </tr>
              ))}
              {reviews.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
                    <AlertTriangle className="w-8 h-8 opacity-20" />
                    No reviews to moderate yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
