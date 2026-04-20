"use client";

import { useState, useEffect, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import {
  collection, addDoc, query, orderBy, limit, onSnapshot,
  serverTimestamp, doc, updateDoc, increment, deleteDoc, Timestamp
} from "firebase/firestore";
import { MessageCircle, Send, Heart, Trash2, Loader2, Globe, Gamepad2 } from "lucide-react";
import Link from "next/link";

interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  text: string;
  likes: number;
  likedBy?: string[];
  createdAt: Timestamp | null;
}

const MAX_CHARS = 280;

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [likingIds, setLikingIds] = useState<Set<string>>(new Set());
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, setUser);
    return unsub;
  }, []);

  // Real-time listener for posts
  useEffect(() => {
    const q = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(q, (snap) => {
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Post));
      setPosts(items);
      setLoading(false);
    }, (error) => {
      console.error("Posts listener error:", error);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handlePost = async () => {
    if (!user || !newPost.trim() || newPost.length > MAX_CHARS) return;
    setPosting(true);
    try {
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        text: newPost.trim(),
        likes: 0,
        likedBy: [],
        createdAt: serverTimestamp(),
      });
      setNewPost("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
    } catch (error) {
      console.error("Failed to post:", error);
    }
    setPosting(false);
  };

  const handleLike = async (postId: string, currentLikedBy: string[]) => {
    if (!user) return;
    setLikingIds((prev) => new Set(prev).add(postId));
    const postRef = doc(db, "posts", postId);
    const hasLiked = currentLikedBy?.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: currentLikedBy.filter((uid) => uid !== user.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...(currentLikedBy || []), user.uid],
        });
      }
    } catch (error) {
      console.error("Failed to like:", error);
    }
    setLikingIds((prev) => {
      const next = new Set(prev);
      next.delete(postId);
      return next;
    });
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", postId));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const formatTime = (ts: Timestamp | null) => {
    if (!ts || !ts.toDate) return "Just now";
    const now = new Date();
    const diff = now.getTime() - ts.toDate().getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return ts.toDate().toLocaleDateString();
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewPost(e.target.value);
    // Auto-resize
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  const charsLeft = MAX_CHARS - newPost.length;

  return (
    <div className="px-4 sm:px-6 py-6 sm:py-8 w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <Globe className="w-5 h-5 text-violet-500" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">Community</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          The global town square for gamers. Share thoughts, hot takes, and discoveries.
        </p>
      </div>

      {/* Compose Box */}
      {user ? (
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-sm shrink-0 overflow-hidden">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
              )}
            </div>
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={newPost}
                onChange={handleTextareaInput}
                placeholder="What's on your mind, gamer?"
                maxLength={MAX_CHARS}
                rows={2}
                className="w-full bg-transparent text-foreground placeholder-muted-foreground text-sm resize-none outline-none border-none focus:ring-0 overflow-hidden"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handlePost();
                  }
                }}
              />
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border">
                <span className={`text-xs font-medium ${charsLeft < 30 ? (charsLeft < 0 ? "text-red-500" : "text-amber-500") : "text-muted-foreground"}`}>
                  {charsLeft} characters left
                </span>
                <button
                  onClick={handlePost}
                  disabled={posting || !newPost.trim() || newPost.length > MAX_CHARS}
                  className="flex items-center gap-2 px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6 text-center">
          <MessageCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground mb-3">Log in to join the conversation</p>
          <Link href="/login" className="inline-flex px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors">
            Log In
          </Link>
        </div>
      )}

      {/* Posts Feed */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16">
          <Gamepad2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">No posts yet</h2>
          <p className="text-muted-foreground text-sm">Be the first to start the conversation!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const hasLiked = post.likedBy?.includes(user?.uid || "");
            return (
              <article
                key={post.id}
                className="bg-card border border-border rounded-2xl p-4 hover:border-violet-500/20 transition-colors shadow-sm"
              >
                <div className="flex gap-3">
                  {/* Avatar */}
                  <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden">
                    {post.userPhoto ? (
                      <img src={post.userPhoto} alt="" className="w-full h-full object-cover" />
                    ) : (
                      post.userName?.[0]?.toUpperCase() || "U"
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-sm text-foreground truncate">{post.userName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">· {formatTime(post.createdAt)}</span>
                    </div>

                    {/* Body */}
                    <p className="text-sm text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed">
                      {post.text}
                    </p>

                    {/* Actions */}
                    <div className="flex items-center gap-4 mt-3">
                      <button
                        onClick={() => handleLike(post.id, post.likedBy || [])}
                        disabled={!user || likingIds.has(post.id)}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          hasLiked
                            ? "text-rose-500"
                            : "text-muted-foreground hover:text-rose-500"
                        } disabled:opacity-40`}
                      >
                        <Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500" : ""}`} />
                        {post.likes > 0 && post.likes}
                      </button>

                      {user?.uid === post.userId && (
                        <button
                          onClick={() => handleDelete(post.id)}
                          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
