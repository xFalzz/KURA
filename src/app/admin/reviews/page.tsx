"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, deleteDoc, doc, updateDoc, query, limit } from "firebase/firestore";
import { Trash2, AlertTriangle, Loader2, Star, ExternalLink, Pin, CheckCircle, Search, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

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
  createdAt: { toMillis?: () => number } | null;
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "published">("all");

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reviews"), limit(100));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({id: d.id, ...d.data()} as Review));
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setReviews(items);
    } catch (error: unknown) {
      console.error("Failed to fetch reviews for moderation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this review? This action cannot be undone.")) return;
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "reviews", id));
      await logAdminAction({ action: "DELETED_REVIEW", targetId: id, details: "Permanently deleted a community review." });
      setReviews(prev => prev.filter(r => r.id !== id));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Error deleting review.");
    } finally {
      setDeletingId(null);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    setProcessingId(id);
    const newStatus = currentStatus === "pending" ? "published" : "pending";
    try {
      await updateDoc(doc(db, "reviews", id), { status: newStatus });
      await logAdminAction({ action: newStatus === "published" ? "APPROVED_REVIEW" : "REJECTED_REVIEW", targetId: id, details: `Changed status to ${newStatus}` });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (error) {
      console.error("Failed to update status:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const togglePin = async (id: string, isFeatured: boolean) => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "reviews", id), { isFeatured: !isFeatured });
      await logAdminAction({ action: !isFeatured ? "PINNED_REVIEW" : "UNPINNED_REVIEW", targetId: id, details: `Toggled isFeatured flag.` });
      setReviews(prev => prev.map(r => r.id === id ? { ...r, isFeatured: !isFeatured } : r));
    } catch (error) {
      console.error("Failed to pin review:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = reviews.filter(r => {
    if (statusFilter !== "all" && (r.status || "published") !== statusFilter) return false;
    if (searchTerm && !r.userName?.toLowerCase().includes(searchTerm.toLowerCase()) && !r.gameName?.toLowerCase().includes(searchTerm.toLowerCase()) && !r.text?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <MessageSquare className="w-7 h-7 text-primary" /> Content Moderation
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review and manage all user-generated comments across KURA.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(["all", "published", "pending"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? `All (${reviews.length})` : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by user, game, or content..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-medium w-[140px]">Author</th>
                <th className="px-5 py-3.5 font-medium w-[180px]">Game</th>
                <th className="px-5 py-3.5 font-medium w-[80px]">Rating</th>
                <th className="px-5 py-3.5 font-medium">Content</th>
                <th className="px-5 py-3.5 font-medium text-center w-[100px]">Status</th>
                <th className="px-5 py-3.5 font-medium text-right w-[140px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((review) => (
                <tr key={review.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-foreground text-sm">{review.userName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{review.userId?.substring(0, 8)}...</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/game/${review.gameSlug}`} className="text-primary hover:underline flex items-center gap-1 text-xs font-medium">
                      {review.gameName} <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1 text-amber-500 font-bold bg-amber-500/10 px-2 py-1 rounded-lg w-fit text-xs">
                      <Star className="w-3 h-3 fill-amber-500" /> {review.rating}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="text-foreground text-xs line-clamp-2 leading-relaxed">{review.text}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {review.createdAt?.toMillis ? new Date(review.createdAt.toMillis()).toLocaleString() : "N/A"} • {review.likes || 0} Likes
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {review.status === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-500 bg-amber-500/10 px-2 py-1 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> PENDING
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" /> LIVE
                      </span>
                    )}
                    {review.isFeatured && (
                      <div className="mt-1.5 inline-flex items-center text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase">
                        <Pin className="w-2.5 h-2.5 mr-0.5" /> Pinned
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {review.status === "pending" && (
                        <Button variant="outline" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600 hover:bg-green-500/10 rounded-lg"
                          onClick={() => toggleStatus(review.id, review.status || "pending")} disabled={processingId === review.id} title="Approve">
                          <CheckCircle className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      <Button variant="outline" size="icon"
                        className={`h-7 w-7 rounded-lg ${review.isFeatured ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}
                        onClick={() => togglePin(review.id, review.isFeatured || false)} disabled={processingId === review.id} title={review.isFeatured ? "Unpin" : "Pin"}>
                        <Pin className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="destructive" size="icon" className="h-7 w-7 rounded-lg"
                        onClick={() => handleDelete(review.id)} disabled={deletingId === review.id} title="Delete">
                        {deletingId === review.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    No reviews found matching your filters.
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
