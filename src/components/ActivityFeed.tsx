"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Star, Flame, Users } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Activity {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  type: "REVIEW_GAME" | "RATE_GAME" | "WISHLIST_ADD" | "LIBRARY_ADD";
  gameId: number | string;
  gameName: string;
  gameSlug: string;
  gameImage: string;
  rating?: number;
  reviewText?: string;
  createdAt: { toMillis: () => number };
}

export default function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchActivities = async (uid: string) => {
      try {
        const followsQ = query(collection(db, "follows"), where("followerId", "==", uid));
        const followsSnap = await getDocs(followsQ);
        const followingIds = followsSnap.docs.map(doc => doc.data().followingId);

        // Also include the user's own activities so they see something instantly
        const targetIds = [...followingIds, uid].slice(0, 30);

        if (targetIds.length === 0) {
          setLoading(false);
          return;
        }

        const activitiesQ = query(
          collection(db, "activities"),
          where("userId", "in", targetIds),
          orderBy("createdAt", "desc"),
          limit(15)
        );

        const activitySnap = await getDocs(activitiesQ);
        const data = activitySnap.docs.map(d => ({ id: d.id, ...d.data() } as Activity));
        setActivities(data);
      } catch (error) {
        console.error("Error fetching activity feed:", error);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setIsAuthenticated(true);
        fetchActivities(user.uid);
      } else {
        setIsAuthenticated(false);
        setActivities([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!isAuthenticated && !loading) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-violet-600/20 text-violet-500 rounded-xl">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-2xl font-black font-outfit text-foreground tracking-tight">Timeline</h2>
          <p className="text-sm text-muted-foreground">What your network is playing</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-muted rounded-2xl" />)}
        </div>
      ) : activities.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-8 text-center flex flex-col items-center">
          <Flame className="w-10 h-10 text-muted-foreground mb-4" />
          <h3 className="text-foreground font-bold text-lg mb-2">Your timeline is quiet</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            Follow other gamers to see their reviews and wishlists here. Watch the community grow!
          </p>
          <Link href="/leaderboard" className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
            Find Gamers to Follow
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activities.map(activity => (
            <div key={activity.id} className="bg-card border border-border rounded-2xl p-5 flex flex-col transition-colors hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/5">
              <div className="flex items-center gap-3 mb-4">
                <Link href={`/profile/${activity.userId}`} className="shrink-0">
                  <Image 
                    src={activity.userImage} 
                    alt={activity.userName} 
                    width={36} 
                    height={36} 
                    className="rounded-full bg-muted border border-border"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm truncate">
                    <Link href={`/profile/${activity.userId}`} className="font-bold text-foreground hover:underline truncate">
                      {activity.userName}
                    </Link>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {activity.type === "WISHLIST_ADD" && "wishlisted"}
                    {activity.type === "REVIEW_GAME" && "reviewed"}
                    {activity.type === "LIBRARY_ADD" && "added"}
                    <span className="mx-1">•</span>
                    {activity.createdAt ? formatDistanceToNow(activity.createdAt.toMillis(), { addSuffix: true }) : 'now'}
                  </div>
                </div>
              </div>

              <Link href={`/game/${activity.gameSlug}`} className="group flex items-start gap-4 mt-auto bg-muted/30 p-3 rounded-xl hover:bg-muted/50 transition-colors border border-transparent hover:border-border">
                {activity.gameImage ? (
                  <Image 
                    src={activity.gameImage} 
                    alt={activity.gameName}
                    width={50}
                    height={70}
                    className="rounded-lg object-cover shadow-sm bg-muted shrink-0"
                  />
                ) : (
                  <div className="w-[50px] h-[70px] bg-muted rounded-lg flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0 py-1">
                  <h4 className="font-bold text-sm text-foreground group-hover:text-violet-500 transition-colors line-clamp-1 mb-1">
                    {activity.gameName}
                  </h4>
                  
                  {activity.type === "REVIEW_GAME" && activity.rating && (
                    <div className="flex items-center gap-1 text-xs font-bold text-yellow-500 mb-1.5">
                      <Star className="w-3.5 h-3.5 fill-yellow-500" /> {activity.rating}
                    </div>
                  )}
                  
                  {activity.type === "REVIEW_GAME" && activity.reviewText && (
                    <p className="text-xs text-muted-foreground line-clamp-2 italic border-l-2 border-muted-foreground/30 pl-2">
                      &quot;{activity.reviewText}&quot;
                    </p>
                  )}
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
