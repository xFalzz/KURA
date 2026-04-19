"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where, limit, Timestamp, getCountFromServer } from "firebase/firestore";
import {
  BarChart3, Users, MessageSquare, TrendingUp, Loader2, Star, Clock, Gamepad2
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";

interface GrowthPoint { name: string; users: number; }
interface ReviewPoint { name: string; reviews: number; }
interface RatingDist { name: string; value: number; fill: string; }
interface GenreData { name: string; count: number; }

const RATING_COLORS = ["#ef4444", "#f97316", "#f59e0b", "#22c55e", "#7c3aed"];

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ name: string; value: number; color: string }>; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="bg-card border border-border rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-muted-foreground font-medium mb-2">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-muted-foreground">{p.name}:</span>
          <span className="font-bold text-foreground">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [userGrowth, setUserGrowth] = useState<GrowthPoint[]>([]);
  const [reviewActivity, setReviewActivity] = useState<ReviewPoint[]>([]);
  const [ratingDist, setRatingDist] = useState<RatingDist[]>([]);
  const [topGenres, setTopGenres] = useState<GenreData[]>([]);
  const [weekStats, setWeekStats] = useState({ users: 0, reviews: 0, topGame: "—", topUser: "—" });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const usersColl = collection(db, "users");
        const reviewsColl = collection(db, "reviews");

        // ========= User Growth (30 days) =========
        const growthData: GrowthPoint[] = [];
        let cumulative = 0;

        // Get count of users before 30 days ago (baseline)
        try {
          const beforeQ = query(usersColl, where("createdAt", "<", Timestamp.fromDate(startOfDay(subDays(new Date(), 29)))));
          const beforeSnap = await getCountFromServer(beforeQ);
          cumulative = beforeSnap.data().count;
        } catch { /* ignore */ }

        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const start = startOfDay(date);
          const end = endOfDay(date);
          try {
            const q = query(usersColl,
              where("createdAt", ">=", Timestamp.fromDate(start)),
              where("createdAt", "<=", Timestamp.fromDate(end))
            );
            const snap = await getDocs(q);
            cumulative += snap.size;
          } catch { /* ignore */ }
          growthData.push({ name: format(date, "MMM dd"), users: cumulative });
        }
        setUserGrowth(growthData);

        // ========= Review Activity (30 days) =========
        const reviewData: ReviewPoint[] = [];
        let weekReviewCount = 0;
        for (let i = 29; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const start = startOfDay(date);
          const end = endOfDay(date);
          try {
            const q = query(reviewsColl,
              where("createdAt", ">=", Timestamp.fromDate(start)),
              where("createdAt", "<=", Timestamp.fromDate(end))
            );
            const snap = await getDocs(q);
            reviewData.push({ name: format(date, "MMM dd"), reviews: snap.size });
            if (i < 7) weekReviewCount += snap.size;
          } catch {
            reviewData.push({ name: format(date, "MMM dd"), reviews: 0 });
          }
        }
        setReviewActivity(reviewData);

        // ========= Rating Distribution =========
        const allReviewsQ = query(reviewsColl, limit(500));
        const allReviewsSnap = await getDocs(allReviewsQ);
        const ratingCounts = [0, 0, 0, 0, 0]; // 1-5 stars
        const genreCounts: Record<string, number> = {};
        const userCounts: Record<string, { name: string; count: number }> = {};
        const gameCounts: Record<string, { name: string; count: number }> = {};

        allReviewsSnap.docs.forEach(d => {
          const data = d.data();
          const rating = data.rating;
          if (typeof rating === "number" && rating >= 1 && rating <= 5) {
            ratingCounts[Math.round(rating) - 1]++;
          }
          // Count genres (from gameName prefix as fallback)
          if (data.gameName) {
            const key = data.gameName;
            if (!gameCounts[key]) gameCounts[key] = { name: key, count: 0 };
            gameCounts[key].count++;
          }
          // User counts
          if (data.userName) {
            const uid = data.userId || data.userName;
            if (!userCounts[uid]) userCounts[uid] = { name: data.userName, count: 0 };
            userCounts[uid].count++;
          }
        });

        setRatingDist([
          { name: "1 Star", value: ratingCounts[0], fill: RATING_COLORS[0] },
          { name: "2 Stars", value: ratingCounts[1], fill: RATING_COLORS[1] },
          { name: "3 Stars", value: ratingCounts[2], fill: RATING_COLORS[2] },
          { name: "4 Stars", value: ratingCounts[3], fill: RATING_COLORS[3] },
          { name: "5 Stars", value: ratingCounts[4], fill: RATING_COLORS[4] },
        ]);

        // Top genres from game names (simplified — would normally use RAWG genre data)
        const topGamesArr = Object.values(gameCounts).sort((a, b) => b.count - a.count).slice(0, 8);
        setTopGenres(topGamesArr.map(g => ({ name: g.name.length > 20 ? g.name.substring(0, 20) + "..." : g.name, count: g.count })));

        // Week stats
        const weekStart = startOfDay(subDays(new Date(), 6));
        let weekUserCount = 0;
        try {
          const weekUserQ = query(usersColl, where("createdAt", ">=", Timestamp.fromDate(weekStart)));
          const weekUserSnap = await getDocs(weekUserQ);
          weekUserCount = weekUserSnap.size;
        } catch { /* ignore */ }

        const topGame = Object.values(gameCounts).sort((a, b) => b.count - a.count)[0];
        const topUser = Object.values(userCounts).sort((a, b) => b.count - a.count)[0];

        setWeekStats({
          users: weekUserCount,
          reviews: weekReviewCount,
          topGame: topGame?.name || "—",
          topUser: topUser?.name || "—",
        });

      } catch (error) {
        console.error("Analytics error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted w-60 rounded-lg" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-[350px] bg-muted rounded-2xl" />
          <div className="h-[350px] bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <BarChart3 className="w-7 h-7 text-primary" /> Platform Analytics
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Deep-dive into KURA&apos;s performance metrics and user engagement data.</p>
      </div>

      {/* Weekly Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-violet-500" />
            <p className="text-xs text-muted-foreground font-medium">Users This Week</p>
          </div>
          <p className="text-2xl font-black text-foreground">{weekStats.users}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare className="w-4 h-4 text-blue-500" />
            <p className="text-xs text-muted-foreground font-medium">Reviews This Week</p>
          </div>
          <p className="text-2xl font-black text-foreground">{weekStats.reviews}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Gamepad2 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-muted-foreground font-medium">Most Reviewed</p>
          </div>
          <p className="text-sm font-bold text-foreground truncate" title={weekStats.topGame}>{weekStats.topGame}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-amber-500" />
            <p className="text-xs text-muted-foreground font-medium">Top Reviewer</p>
          </div>
          <p className="text-sm font-bold text-foreground truncate" title={weekStats.topUser}>{weekStats.topUser}</p>
        </div>
      </div>

      {/* Charts — Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* User Growth */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Users className="w-5 h-5 text-violet-500" />
            <h2 className="text-base font-bold font-outfit text-foreground">User Growth</h2>
            <span className="ml-auto text-xs text-muted-foreground">Last 30 Days</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" interval={4} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" name="Total Users" stroke="#7c3aed" strokeWidth={2.5} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Review Activity */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <h2 className="text-base font-bold font-outfit text-foreground">Daily Reviews</h2>
            <span className="ml-auto text-xs text-muted-foreground">Last 30 Days</span>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reviewActivity} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" interval={4} />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reviews" name="Reviews" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts — Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Rating Distribution */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="text-base font-bold font-outfit text-foreground">Rating Distribution</h2>
          </div>
          <div className="h-[280px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={ratingDist} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {ratingDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Reviewed Games (Bar) */}
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <Gamepad2 className="w-5 h-5 text-green-500" />
            <h2 className="text-base font-bold font-outfit text-foreground">Top Reviewed Games</h2>
          </div>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topGenres} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--color-border)" />
                <XAxis type="number" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" />
                <YAxis type="category" dataKey="name" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-muted-foreground)" width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Reviews" fill="#7c3aed" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
