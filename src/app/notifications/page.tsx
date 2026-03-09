"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Star, Zap, Flame, Calendar, CheckCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";

const RAWG_KEY = process.env.NEXT_PUBLIC_RAWG_API_KEY;

interface NotifGame {
  id: number;
  name: string;
  slug: string;
  background_image: string;
  released: string;
  rating: number;
}

interface Notification {
  id: string;
  type: "release" | "trending" | "new" | "update";
  game: NotifGame;
  message: string;
  time: string;
  read: boolean;
}

const TYPE_STYLES = {
  release: { icon: <Calendar className="w-4 h-4" />, color: "bg-blue-500", label: "New Release" },
  trending: { icon: <Flame className="w-4 h-4" />, color: "bg-orange-500", label: "Trending" },
  new: { icon: <Zap className="w-4 h-4" />, color: "bg-violet-500", label: "Just Added" },
  update: { icon: <Star className="w-4 h-4" />, color: "bg-green-500", label: "Update" },
};

const NOTIF_TEMPLATES = [
  { type: "release" as const, msg: (n: string) => `${n} is now available` },
  { type: "trending" as const, msg: (n: string) => `${n} is trending right now` },
  { type: "new" as const, msg: (n: string) => `${n} was just added to the database` },
  { type: "update" as const, msg: (n: string) => `${n} received a major update` },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      setLoggedIn(true);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!loggedIn) return;
    // Build notifications from recent + trending games
    Promise.all([
      fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&ordering=-released&page_size=12`).then(r => r.json()),
      fetch(`https://api.rawg.io/api/games?key=${RAWG_KEY}&ordering=-added&page_size=8`).then(r => r.json()),
    ]).then(([recent, trending]) => {
      const allGames: NotifGame[] = [
        ...(recent.results || []),
        ...(trending.results || []),
      ].filter((g, i, arr) => arr.findIndex(x => x.id === g.id) === i);

      const notifs: Notification[] = allGames.slice(0, 20).map((game, idx) => {
        const tmpl = NOTIF_TEMPLATES[idx % NOTIF_TEMPLATES.length];
        return {
          id: String(game.id),
          type: tmpl.type,
          game,
          message: tmpl.msg(game.name),
          time: game.released || new Date().toISOString(),
          read: idx > 4, // first 5 are unread
        };
      });

      setNotifications(notifs);
      setLoading(false);
    });
  }, [loggedIn]);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="px-6 py-6 w-full max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="w-7 h-7 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl font-outfit font-black text-foreground">Notifications</h1>
            <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          >
            <CheckCheck className="w-4 h-4" />
            Mark all read
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-card rounded-2xl animate-pulse border border-border" />
          ))}
        </div>
      ) : (
        <AnimatePresence>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            {notifications.map((notif, idx) => {
              const style = TYPE_STYLES[notif.type];
              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                >
                  <Link
                    href={`/game/${notif.game.slug}`}
                    className={`flex items-center gap-4 p-4 rounded-2xl border transition-all group ${
                      !notif.read
                        ? "bg-violet-500/5 border-violet-500/20 hover:border-violet-500/40"
                        : "bg-card border-border hover:border-border/80"
                    }`}
                  >
                    {/* Type icon */}
                    <div className={`w-9 h-9 rounded-xl ${style.color} flex items-center justify-center text-white shrink-0`}>
                      {style.icon}
                    </div>

                    {/* Game cover */}
                    <div className="relative w-14 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                      {notif.game.background_image && (
                        <Image src={notif.game.background_image} alt={notif.game.name} fill className="object-cover" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold group-hover:text-violet-500 transition-colors truncate ${!notif.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {notif.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">{style.label} · {timeAgo(notif.time)}</p>
                    </div>

                    {/* Unread dot */}
                    {!notif.read && (
                      <div className="w-2 h-2 rounded-full bg-violet-500 shrink-0" />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
