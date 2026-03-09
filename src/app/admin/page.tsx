"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer, getDocs, limit, query, where, Timestamp } from "firebase/firestore";
import { Users, MessageSquare, Star, TrendingUp, Activity } from "lucide-react";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface RecentReview {
  id: string;
  gameName?: string;
  gameSlug?: string;
  userName?: string;
  rating?: number;
  text?: string;
  createdAt?: { toMillis?: () => number };
}

interface ChartDataPoint {
  name: string;
  users: number;
  reviews: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, reviews: 0 });
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
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
        
        const reviewsList = recentSnap.docs.map(d => ({id: d.id, ...d.data()} as RecentReview));
        reviewsList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRecentReviews(reviewsList);

        // Generate Chart Data (Last 14 Days)
        const generateChartData = async () => {
          const data = [];
          for (let i = 13; i >= 0; i--) {
            const date = subDays(new Date(), i);
            const start = startOfDay(date);
            const end = endOfDay(date);

            // In a real production app with millions of rows, you wouldn't loop getDocs like this.
            // You'd use a Cloud Function to pre-aggregate stats into a daily document. 
            // For KURA's current scale, this is acceptable for an admin dashboard.
            const userQ = query(usersColl, 
              where("createdAt", ">=", Timestamp.fromDate(start)),
              where("createdAt", "<=", Timestamp.fromDate(end))
            );
            const reviewQ = query(reviewsColl,
              where("createdAt", ">=", Timestamp.fromDate(start)),
              where("createdAt", "<=", Timestamp.fromDate(end))
            );

            const [uSnap, rSnap] = await Promise.all([getDocs(userQ), getDocs(reviewQ)]);
            
            data.push({
              name: format(date, "MMM dd"),
              users: uSnap.size,
              reviews: rSnap.size
            });
          }
          return data;
        };

        const activityData = await generateChartData();
        setChartData(activityData);

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

      {/* Analytics Charts */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Activity className="w-5 h-5 text-violet-500" />
          <h2 className="text-lg font-bold font-outfit">Platform Activity (Last 14 Days)</h2>
        </div>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => Math.floor(val).toString()} />
              <Tooltip 
                contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '12px' }}
                itemStyle={{ fontWeight: 'bold' }}
              />
              <Area type="monotone" dataKey="users" name="New Users" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
              <Area type="monotone" dataKey="reviews" name="New Reviews" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorReviews)" />
            </AreaChart>
          </ResponsiveContainer>
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
