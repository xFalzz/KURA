"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection, query, where, getDocs, doc, getDoc,
  setDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Loader2, Settings, BookOpen, Heart, Star, FolderOpen, Users, UserPlus, UserMinus, Gamepad2
} from "lucide-react";
import GameCard from "@/components/GameCard";
import { Game } from "@/lib/types";

interface ProfileUser {
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  uid: string;
}

type TabId = "overview" | "library" | "wishlist" | "reviews" | "collections" | "following" | "followers";

const TABS: { id: TabId; label: string; icon: React.ReactNode }[] = [
  { id: "overview", label: "Overview", icon: <Gamepad2 className="w-4 h-4" /> },
  { id: "library", label: "Library", icon: <BookOpen className="w-4 h-4" /> },
  { id: "wishlist", label: "Wishlist", icon: <Heart className="w-4 h-4" /> },
  { id: "reviews", label: "Reviews", icon: <Star className="w-4 h-4" /> },
  { id: "collections", label: "Collections", icon: <FolderOpen className="w-4 h-4" /> },
  { id: "following", label: "Following", icon: <Users className="w-4 h-4" /> },
  { id: "followers", label: "Followers", icon: <Users className="w-4 h-4" /> },
];

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [profileUser, setProfileUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("overview");
  const [library, setLibrary] = useState<{ game: Game; status: string }[]>([]);
  const [wishlist, setWishlist] = useState<Game[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [following, setFollowing] = useState<ProfileUser[]>([]);
  const [followers, setFollowers] = useState<ProfileUser[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDocId, setFollowDocId] = useState<string | null>(null);
  const [tabLoading, setTabLoading] = useState(false);
  const router = useRouter();

  // Get current user
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (!u) router.push("/login");
    });
    return () => unsub();
  }, [router]);

  // Load own profile
  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      const snap = await getDoc(doc(db, "users", currentUser.uid));
      const data = snap.data();
      setProfileUser({
        uid: currentUser.uid,
        displayName: currentUser.displayName || data?.displayName || "Anonymous",
        email: currentUser.email || "",
        photoURL: currentUser.photoURL || data?.photoURL,
        bio: data?.bio || "",
      });
      setLoading(false);
    };
    load();
  }, [currentUser]);

  // Check if following
  useEffect(() => {
    if (!currentUser || !profileUser || currentUser.uid === profileUser.uid) return;
    const check = async () => {
      const q = query(
        collection(db, "follows"),
        where("followerId", "==", currentUser.uid),
        where("followingId", "==", profileUser.uid)
      );
      const snap = await getDocs(q);
      if (!snap.empty) { setIsFollowing(true); setFollowDocId(snap.docs[0].id); }
    };
    check();
  }, [currentUser, profileUser]);

  useEffect(() => {
    if (!profileUser) return;
    let cancelled = false;
    const run = async () => {
      setTabLoading(true);
      if (tab === "library") {
        const q = query(collection(db, "library"), where("userId", "==", profileUser.uid));
        const snap = await getDocs(q);
        if (!cancelled) setLibrary(snap.docs.map(d => d.data() as { game: Game; status: string }));
      } else if (tab === "wishlist") {
        const q = query(collection(db, "wishlists"), where("userId", "==", profileUser.uid));
        const snap = await getDocs(q);
        if (!cancelled) setWishlist(snap.docs.map(d => (d.data() as { game: Game }).game));
      } else if (tab === "reviews") {
        const q = query(collection(db, "reviews"), where("userId", "==", profileUser.uid));
        const snap = await getDocs(q);
        if (!cancelled) setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } else if (tab === "following") {
        const q = query(collection(db, "follows"), where("followerId", "==", profileUser.uid));
        const snap = await getDocs(q);
        const users = await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          const userSnap = await getDoc(doc(db, "users", data.followingId));
          return { uid: data.followingId, ...(userSnap.data() || { displayName: "Unknown", email: "" }) } as ProfileUser;
        }));
        if (!cancelled) setFollowing(users);
      } else if (tab === "followers") {
        const q = query(collection(db, "follows"), where("followingId", "==", profileUser.uid));
        const snap = await getDocs(q);
        const users = await Promise.all(snap.docs.map(async d => {
          const data = d.data();
          const userSnap = await getDoc(doc(db, "users", data.followerId));
          return { uid: data.followerId, ...(userSnap.data() || { displayName: "Unknown", email: "" }) } as ProfileUser;
        }));
        if (!cancelled) setFollowers(users);
      }
      if (!cancelled) setTabLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [tab, profileUser]);

  const toggleFollow = async () => {
    if (!currentUser || !profileUser) return;
    if (isFollowing && followDocId) {
      await deleteDoc(doc(db, "follows", followDocId));
      setIsFollowing(false); setFollowDocId(null);
    } else {
      const ref = doc(collection(db, "follows"));
      await setDoc(ref, {
        followerId: currentUser.uid,
        followingId: profileUser.uid,
        displayName: profileUser.displayName,
        email: profileUser.email,
        createdAt: serverTimestamp(),
      });
      setIsFollowing(true); setFollowDocId(ref.id);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  if (!profileUser) return null;

  const isOwnProfile = currentUser?.uid === profileUser.uid;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Profile Header */}
      <div className="px-4 sm:px-6 pt-6 sm:pt-8 pb-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-6 mb-6">
          {/* Avatar */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-violet-600 flex items-center justify-center text-white text-2xl sm:text-3xl font-black shadow-xl shrink-0">
            {profileUser.photoURL ? (
              <Image src={profileUser.photoURL} alt={profileUser.displayName} fill className="object-cover" />
            ) : (
              <span>{profileUser.displayName?.[0]?.toUpperCase() || "?"}</span>
            )}
          </div>
          {/* Name + Bio */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-outfit font-black text-foreground">{profileUser.displayName}</h1>
            {profileUser.bio && (
              <p className="text-muted-foreground text-sm mt-1 max-w-xl">{profileUser.bio}</p>
            )}
          </div>
          {/* Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 mt-1 sm:mt-0">
            {isOwnProfile ? (
              <Link href="/settings" className="flex items-center gap-2 px-4 py-2 bg-card border border-border text-foreground text-sm font-semibold rounded-xl hover:border-violet-500/40 transition-all">
                <Settings className="w-4 h-4" />
                Settings
              </Link>
            ) : (
              <button
                onClick={toggleFollow}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  isFollowing
                    ? "bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/40"
                    : "bg-violet-600 hover:bg-violet-500 text-white"
                }`}
              >
                {isFollowing ? <><UserMinus className="w-4 h-4" /> Unfollow</> : <><UserPlus className="w-4 h-4" /> Follow</>}
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 border-b border-border overflow-x-auto scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 sm:px-6 py-4 sm:py-6">
        {tabLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Library", value: library.length, icon: <BookOpen className="w-5 h-5" /> },
                    { label: "Wishlist", value: wishlist.length, icon: <Heart className="w-5 h-5" /> },
                    { label: "Following", value: following.length, icon: <Users className="w-5 h-5" /> },
                    { label: "Followers", value: followers.length, icon: <Users className="w-5 h-5" /> },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-card border border-border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 text-center">
                      <div className="text-violet-500">{stat.icon}</div>
                      <div className="text-2xl font-black text-foreground">{stat.value}</div>
                      <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {isOwnProfile && (
                  <div className="bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
                    <p className="text-sm text-foreground font-medium mb-1">🎮 Jump-start your library</p>
                    <p className="text-xs text-muted-foreground">
                      Start adding games to your library and wishlist. The more complete your profile, the better we can suggest games you&apos;ll love.
                    </p>
                    <div className="mt-3 flex gap-3">
                      <Link href="/library" className="text-xs text-violet-500 hover:underline font-semibold">Go to Library →</Link>
                      <Link href="/wishlist" className="text-xs text-violet-500 hover:underline font-semibold">Go to Wishlist →</Link>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* LIBRARY */}
            {tab === "library" && (
              library.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No games in library yet.</p>
                  {isOwnProfile && <Link href="/library" className="text-sm text-violet-500 hover:underline">Manage Library</Link>}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {library.map((item, idx) => <GameCard key={idx} game={item.game} />)}
                </div>
              )
            )}

            {/* WISHLIST */}
            {tab === "wishlist" && (
              wishlist.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <Heart className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No games in wishlist yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {wishlist.map((game, idx) => <GameCard key={idx} game={game} />)}
                </div>
              )
            )}

            {/* REVIEWS */}
            {tab === "reviews" && (
              reviews.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <Star className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No reviews written yet.</p>
                  {isOwnProfile && <Link href="/" className="text-sm text-violet-500 hover:underline">Find games to review</Link>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="bg-card border border-border rounded-xl p-5 hover:border-violet-500/30 transition-all flex flex-col h-full">
                      <div className="flex justify-between items-start mb-3">
                        <Link href={`/game/${r.gameSlug}`} className="font-bold text-lg text-foreground hover:text-violet-500 transition-colors line-clamp-1">
                          {r.gameName}
                        </Link>
                        <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-1 rounded-lg border border-yellow-500/20 shrink-0">
                          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                          <span className="text-sm font-bold text-yellow-500">{r.rating}</span>
                        </div>
                      </div>
                      <p className="text-sm text-foreground/80 line-clamp-4 flex-1">{r.text}</p>
                      <div className="mt-4 pt-3 border-t border-border flex justify-between items-center text-xs text-muted-foreground">
                        <span>{r.createdAt ? new Date(r.createdAt.toMillis()).toLocaleDateString() : 'Recently'}</span>
                        {r.likes > 0 && <span>{r.likes} likes</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* COLLECTIONS */}
            {tab === "collections" && (
              <div className="flex flex-col items-center py-16 gap-4 text-center">
                <FolderOpen className="w-12 h-12 text-muted-foreground/30" />
                <p className="text-muted-foreground">No collections yet.</p>
                {isOwnProfile && <Link href="/collections" className="text-sm text-violet-500 hover:underline">Create a Collection</Link>}
              </div>
            )}

            {/* FOLLOWING */}
            {tab === "following" && (
              following.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">Not following anyone.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {following.map((u) => (
                    <Link key={u.uid} href={`/profile/${u.uid}`} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-violet-500/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shrink-0">
                        {u.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}

            {/* FOLLOWERS */}
            {tab === "followers" && (
              followers.length === 0 ? (
                <div className="flex flex-col items-center py-16 gap-4 text-center">
                  <Users className="w-12 h-12 text-muted-foreground/30" />
                  <p className="text-muted-foreground">No followers yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {followers.map((u) => (
                    <Link key={u.uid} href={`/profile/${u.uid}`} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl hover:border-violet-500/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shrink-0">
                        {u.displayName?.[0]?.toUpperCase() || "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{u.displayName}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
