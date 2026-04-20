"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getCountFromServer, getDocs, limit, query, where, orderBy, Timestamp } from "firebase/firestore";
import {
  Users, MessageSquare, Star, Activity, Flag,
  ArrowUpRight, ArrowDownRight, Eye, Gamepad2, Clock, UserPlus,
  Trash2, Pin, Megaphone, ShieldBan, FileText
} from "lucide-react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from "recharts";
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

interface WeeklyDataPoint {
  name: string;
  reviews: number;
}

interface AuditLog {
  id: string;
  action: string;
  adminEmail: string;
  details: string;
  createdAt?: { toMillis?: () => number };
}

// Custom tooltip
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({ users: 0, reviews: 0, reports: 0, avgRating: 0 });
  const [recentReviews, setRecentReviews] = useState<RecentReview[]>([]);
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const usersColl = collection(db, "users");
        const reviewsColl = collection(db, "reviews");
        const reportsColl = collection(db, "reports");

        // Get counts
        const [usersSnap, reviewsSnap, reportsSnap] = await Promise.all([
          getCountFromServer(usersColl),
          getCountFromServer(reviewsColl),
          getCountFromServer(query(reportsColl, where("status", "==", "pending"))),
        ]);

        // Get average rating from recent reviews
        const ratingQuery = query(reviewsColl, limit(50));
        const ratingSnap = await getDocs(ratingQuery);
        let totalRating = 0;
        let ratingCount = 0;
        ratingSnap.docs.forEach(d => {
          const r = d.data().rating;
          if (typeof r === "number") { totalRating += r; ratingCount++; }
        });

        setStats({
          users: usersSnap.data().count,
          reviews: reviewsSnap.data().count,
          reports: reportsSnap.data().count,
          avgRating: ratingCount > 0 ? parseFloat((totalRating / ratingCount).toFixed(1)) : 0,
        });

        // Get 5 recent reviews
        const recentQ = query(reviewsColl, limit(5));
        const recentSnap = await getDocs(recentQ);
        const reviewsList = recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecentReview));
        reviewsList.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
        setRecentReviews(reviewsList);

        // Get 5 recent audit logs
        try {
          const logsQ = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(6));
          const logsSnap = await getDocs(logsQ);
          setRecentLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AuditLog)));
        } catch {
          // audit_logs might not exist
        }

        // Generate Chart Data (Last 14 Days)
        const data: ChartDataPoint[] = [];
        for (let i = 13; i >= 0; i--) {
          const date = subDays(new Date(), i);
          const start = startOfDay(date);
          const end = endOfDay(date);

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
            reviews: rSnap.size,
          });
        }
        setChartData(data);

        // Weekly bar chart (last 7 days)
        const weekly: WeeklyDataPoint[] = data.slice(-7).map(d => ({
          name: d.name,
          reviews: d.reviews,
        }));
        setWeeklyData(weekly);

      } catch (error) {
        console.error("Error fetching admin stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getLogIcon = (action: string) => {
    if (action.includes("DELETE")) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes("BAN")) return <ShieldBan className="w-4 h-4 text-orange-500" />;
    if (action.includes("PIN")) return <Pin className="w-4 h-4 text-blue-500" />;
    if (action.includes("ANNOUNCE") || action.includes("CURATION")) return <Megaphone className="w-4 h-4 text-green-500" />;
    if (action.includes("USER")) return <UserPlus className="w-4 h-4 text-violet-500" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-muted w-60 rounded-lg" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => <div key={i} className="h-[140px] bg-muted rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="h-[350px] bg-muted rounded-2xl" />
          <div className="h-[350px] bg-muted rounded-2xl" />
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      label: "Total Users",
      value: stats.users,
      icon: Users,
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-500",
      trend: "+12%",
      trendUp: true,
      trendLabel: "vs last month",
    },
    {
      label: "Total Reviews",
      value: stats.reviews,
      icon: MessageSquare,
      iconBg: "bg-blue-500/10",
      iconColor: "text-blue-500",
      trend: `${stats.reviews}`,
      trendUp: true,
      trendLabel: "all time",
    },
    {
      label: "Pending Reports",
      value: stats.reports,
      icon: Flag,
      iconBg: "bg-red-500/10",
      iconColor: "text-red-500",
      trend: stats.reports > 0 ? `${stats.reports} pending` : "All clear",
      trendUp: stats.reports === 0,
      trendLabel: "needs attention",
    },
    {
      label: "Avg. Rating",
      value: stats.avgRating,
      icon: Star,
      iconBg: "bg-amber-500/10",
      iconColor: "text-amber-500",
      trend: `${stats.avgRating}/5`,
      trendUp: stats.avgRating >= 3.5,
      trendLabel: "platform-wide",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1 text-sm">Welcome back, Admin. Here&apos;s what&apos;s happening on KURA.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 ${card.iconBg} rounded-xl transition-transform group-hover:scale-110`}>
                  <Icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <span className={`flex items-center text-xs font-bold px-2 py-1 rounded-full ${
                  card.trendUp
                    ? "text-green-600 dark:text-green-400 bg-green-500/10"
                    : "text-red-500 bg-red-500/10"
                }`}>
                  {card.trendUp ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {card.trend}
                </span>
              </div>
              <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{card.label}</h3>
              <p className="text-3xl font-black text-foreground mt-1 font-outfit">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        {/* Area Chart — Platform Activity */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" />
              <h2 className="text-base font-bold font-outfit text-foreground">Platform Activity</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Last 14 Days</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorReviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => Math.floor(val).toString()} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" name="New Users" stroke="#7c3aed" strokeWidth={2.5} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="reviews" name="Reviews" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReviews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {/* Legend */}
          <div className="flex items-center gap-5 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-violet-500" /> New Users
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="w-3 h-3 rounded-full bg-blue-500" /> Reviews
            </div>
          </div>
        </div>

        {/* Bar Chart — Weekly Reviews */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-blue-500" />
              <h2 className="text-base font-bold font-outfit text-foreground">Weekly Reviews</h2>
            </div>
            <span className="text-xs text-muted-foreground font-medium">Last 7 Days</span>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => Math.floor(val).toString()} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="reviews" name="Reviews" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom Row — Reviews Table + Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-5">
        {/* Recent Reviews Table */}
        <div className="lg:col-span-4 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-violet-500" />
              <h2 className="text-base font-bold font-outfit text-foreground">Recent Reviews</h2>
            </div>
            <Link href="/admin/reviews" className="text-xs text-primary hover:text-violet-500 font-semibold transition-colors">
              View All →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
                <tr>
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Game</th>
                  <th className="px-5 py-3 font-medium">Rating</th>
                  <th className="px-5 py-3 font-medium">Excerpt</th>
                </tr>
              </thead>
              <tbody>
                {recentReviews.map((review) => (
                  <tr key={review.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                    <td className="px-5 py-3.5 font-medium text-foreground whitespace-nowrap">{review.userName}</td>
                    <td className="px-5 py-3.5">
                      <Link href={`/game/${review.gameSlug}`} className="text-primary hover:underline text-xs font-medium">
                        {review.gameName}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {review.rating}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground text-xs truncate max-w-[200px]">
                      {review.text}
                    </td>
                  </tr>
                ))}
                {recentReviews.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground text-sm">
                      No reviews yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="lg:col-span-3 bg-card border border-border rounded-2xl shadow-sm">
          <div className="p-5 border-b border-border flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-500" />
              <h2 className="text-base font-bold font-outfit text-foreground">Recent Activity</h2>
            </div>
            <Link href="/admin/logs" className="text-xs text-primary hover:text-violet-500 font-semibold transition-colors">
              View All →
            </Link>
          </div>
          <div className="p-5 space-y-0">
            {recentLogs.length > 0 ? (
              recentLogs.map((log, index) => (
                <div key={log.id} className="flex gap-3 relative">
                  {/* Timeline Line */}
                  {index < recentLogs.length - 1 && (
                    <div className="absolute left-[17px] top-[36px] w-px h-[calc(100%-10px)] bg-border" />
                  )}
                  {/* Icon */}
                  <div className="w-[34px] h-[34px] rounded-full bg-muted flex items-center justify-center shrink-0 z-10">
                    {getLogIcon(log.action)}
                  </div>
                  {/* Content */}
                  <div className="flex-1 pb-5">
                    <p className="text-sm text-foreground font-medium">
                      {log.action.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{log.details}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {log.createdAt?.toMillis ? format(new Date(log.createdAt.toMillis()), "MMM dd, HH:mm") : "—"}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">No recent activity</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
