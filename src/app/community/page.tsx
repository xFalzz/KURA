"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection, addDoc, query, orderBy, limit, onSnapshot,
  serverTimestamp, QueryDocumentSnapshot, DocumentData
} from "firebase/firestore";
import { MessageCircle, Send, Gamepad2, TrendingUp, Users, Loader2, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import UserBadge from "@/components/UserBadge";
import { usePlatformConfig } from "@/contexts/PlatformConfigContext";

import PostItem, { Post } from "@/components/PostItem";

const MAX_CHARS = 280;
const POSTS_PER_PAGE = 20;

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const { userRole } = usePlatformConfig();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  useEffect(() => {
    const fetchInitial = async () => {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(POSTS_PER_PAGE));
      const unsub = onSnapshot(q, (snap) => {
        const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
        setPosts(items);
        if (snap.docs.length > 0) {
          setLastDoc(snap.docs[snap.docs.length - 1]);
        }
        setHasMore(snap.docs.length === POSTS_PER_PAGE);
        setLoading(false);
      });
      return unsub;
    };
    
    let unsubscribe: (() => void) | undefined;
    fetchInitial().then(unsub => { unsubscribe = unsub; });
    return () => { if (unsubscribe) unsubscribe(); };
  }, []);

  const loadMorePosts = async () => {
    if (!lastDoc || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      // Need to use getDocs instead of onSnapshot for paginated items to avoid complex state merging
      const { getDocs, startAfter } = await import("firebase/firestore");
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), startAfter(lastDoc), limit(POSTS_PER_PAGE));
      const snap = await getDocs(q);
      
      const newItems = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      setPosts(prev => {
        // filter out duplicates just in case
        const existingIds = new Set(prev.map(p => p.id));
        const uniqueNew = newItems.filter(p => !existingIds.has(p.id));
        return [...prev, ...uniqueNew];
      });
      
      if (snap.docs.length > 0) {
        setLastDoc(snap.docs[snap.docs.length - 1]);
      }
      setHasMore(snap.docs.length === POSTS_PER_PAGE);
    } catch (error) {
      console.error("Error loading more posts:", error);
    }
    setLoadingMore(false);
  };

  const handlePost = async () => {
    if (!user || !newPost.trim() || newPost.length > MAX_CHARS) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        userRole: userRole,
        text: newPost.trim(),
        likes: 0,
        likedBy: [],
        replyCount: 0,
        createdAt: serverTimestamp(),
      });
      setNewPost("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("Failed to post:", error);
    }
    setPosting(false);
  };

  const charsLeft = MAX_CHARS - newPost.length;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center border border-violet-500/20 shadow-sm">
            <Globe className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">Global Town Square</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Connect with gamers worldwide. Drop hot takes, reviews, or just say hi.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-6">
          {/* Compose Box */}
          {user ? (
            <div className="bg-card border border-border rounded-3xl p-5 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-violet-500 to-fuchsia-500 opacity-50" />
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden shadow-md relative">
                  {user.photoURL ? (
                    <Image src={user.photoURL} alt="" fill sizes="48px" className="object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <textarea
                    ref={textareaRef}
                    value={newPost}
                    onChange={(e) => {
                      setNewPost(e.target.value);
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    placeholder="What game is on your mind?"
                    maxLength={MAX_CHARS}
                    rows={2}
                    className="w-full bg-transparent text-foreground placeholder-muted-foreground text-[15px] resize-none outline-none border-none focus:ring-0 overflow-hidden pt-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handlePost();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                    <span className={`text-xs font-semibold ${charsLeft < 30 ? (charsLeft < 0 ? "text-red-500" : "text-amber-500") : "text-muted-foreground"}`}>
                      {charsLeft}
                    </span>
                    <button
                      onClick={handlePost}
                      disabled={posting || !newPost.trim() || newPost.length > MAX_CHARS}
                      className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 shadow-sm"
                    >
                      {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Post
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-8 text-center shadow-sm">
              <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-foreground mb-2">Join the conversation</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">Log in to post your thoughts, reply to others, and earn badges based on your reviews.</p>
              <Link href="/login" className="inline-flex px-8 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all shadow-md">
                Sign In to Post
              </Link>
            </div>
          )}

          {/* Posts Feed */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-black/5 dark:bg-white/5 rounded-3xl border border-dashed border-border">
              <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">No posts yet</h2>
              <p className="text-muted-foreground text-sm">Be the first to start the conversation!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <PostItem key={post.id} post={post} user={user} />
              ))}
              
              {hasMore && (
                <div className="pt-4 pb-2 text-center">
                  <button
                    onClick={loadMorePosts}
                    disabled={loadingMore}
                    className="px-6 py-2.5 bg-card border border-border hover:border-violet-500/50 text-foreground text-sm font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center mx-auto gap-2"
                  >
                    {loadingMore ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    {loadingMore ? "Loading..." : "Load More Posts"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="hidden lg:block space-y-6">
          {/* Trending Block */}
          <div className="bg-card border border-border rounded-3xl p-5 shadow-sm sticky top-24">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <TrendingUp className="w-4 h-4 text-violet-500" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Trending Topics</h2>
            </div>
            <div className="space-y-3">
              {[
                { tag: "#GTA6", posts: "2.4k" },
                { tag: "#MonsterHunterWilds", posts: "1.8k" },
                { tag: "#EldenRing", posts: "940" },
                { tag: "#NintendoSwitch2", posts: "820" },
                { tag: "#IndieGames", posts: "560" },
              ].map((trend) => (
                <div key={trend.tag} className="flex items-center justify-between group cursor-pointer">
                  <span className="text-sm font-semibold text-foreground group-hover:text-violet-500 transition-colors">{trend.tag}</span>
                  <span className="text-xs text-muted-foreground">{trend.posts} posts</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-2 mb-4 pb-3 border-b border-border">
              <Users className="w-4 h-4 text-blue-500" />
              <h2 className="font-bold text-sm text-foreground uppercase tracking-wider">Top Voices</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-fuchsia-500 flex items-center justify-center text-white font-bold text-xs">M</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">MarkD</div>
                  <UserBadge reviewCount={42} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-white font-bold text-xs">S</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">SarahGamer</div>
                  <UserBadge reviewCount={18} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">J</div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">JRPG_Fan</div>
                  <UserBadge reviewCount={8} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
