"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer, getDocs, limit, query } from "firebase/firestore";
import { Users, MessageSquare, Star, TrendingUp } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, reviews: 0 });
  const [recentReviews, setRecentReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Get counts
        const usersColl = collection(db, "users");
        const reviewsColl = collection(db, "reviews");
        
        const usersSnapshot = await getCountFromServer(usersColl);
        const reviewsSnapshot = await getCountFromServer(reviewsColl);

        setStats({
          users: usersSnapshot.data().count,
          reviews: reviewsSnapshot.data().count,
        });

        // Get 5 recent reviews for the quick glance table
        const q = query(reviewsColl, limit(5));
        const recentSnap = await getDocs(q);
        
        const reviewsList = recentSnap.docs.map(d => ({id: d.id, ...d.data()}));
        // Sort in memory as fallback if index is missing
        reviewsList.sort((a: any, b: any) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        
        setRecentReviews(reviewsList);

      } catch (error: unknown) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="animate-pulse space-y-8">
      <div className="h-8 bg-muted w-48 rounded-md"></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-32 bg-muted rounded-2xl"></div>
        <div className="h-32 bg-muted rounded-2xl"></div>
        <div className="h-32 bg-muted rounded-2xl"></div>
      </div>
    </div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-black text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back, Admin. Here&apos;s what&apos;s happening today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <span className="flex items-center text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-full">
              <TrendingUp className="w-3 h-3 mr-1" /> +12%
            </span>
          </div>
          <h3 className="text-muted-foreground text-sm font-medium">Total Registered Users</h3>
          <p className="text-3xl font-black text-foreground mt-1">{stats.users}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-muted-foreground text-sm font-medium">Total Global Reviews</h3>
          <p className="text-3xl font-black text-foreground mt-1">{stats.reviews}</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 bg-yellow-500/10 text-yellow-500 rounded-xl">
              <Star className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-muted-foreground text-sm font-medium">Avg. Platform Rating</h3>
          <p className="text-3xl font-black text-foreground mt-1">4.2</p>
        </div>
      </div>

      {/* Quick Moderation Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-border flex justify-between items-center">
          <h2 className="text-lg font-bold font-outfit">Recent Reviews</h2>
          <Link href="/admin/reviews" className="text-sm text-violet-500 hover:underline font-medium">
            View All →
          </Link>
        </div>
        <div className="p-0">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Game</th>
                <th className="px-6 py-4 font-medium">Rating</th>
                <th className="px-6 py-4 font-medium">Excerpt</th>
              </tr>
            </thead>
            <tbody>
              {recentReviews.map((review) => (
                <tr key={review.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-medium text-foreground">{review.userName}</td>
                  <td className="px-6 py-4">
                    <Link href={`/game/${review.gameSlug}`} className="text-violet-500 hover:underline">
                      {review.gameName}
                    </Link>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-yellow-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-yellow-500" /> {review.rating}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground truncate max-w-[300px]">
                    {review.text}
                  </td>
                </tr>
              ))}
              {recentReviews.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground font-medium">
                    No reviews yet
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
