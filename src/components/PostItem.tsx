"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { User } from "firebase/auth";
import {
  collection, addDoc, query, orderBy, onSnapshot,
  serverTimestamp, doc, updateDoc, increment, deleteDoc, Timestamp
} from "firebase/firestore";
import { MessageCircle, Send, Heart, Trash2, Loader2, Share2, Check } from "lucide-react";
import UserBadge from "@/components/UserBadge";
import Image from "next/image";
import Link from "next/link";
import { usePlatformConfig } from "@/contexts/PlatformConfigContext";

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  userRole?: "user" | "staff" | "admin" | "owner";
  text: string;
  likes: number;
  likedBy?: string[];
  createdAt: Timestamp | null;
  replyCount?: number;
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  userRole?: "user" | "staff" | "admin" | "owner";
  text: string;
  createdAt: Timestamp | null;
}

export const formatTime = (ts: Timestamp | null) => {
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

export default function PostItem({ post, user }: { post: Post; user: User | null }) {
  const { userRole } = usePlatformConfig();
  const isAdmin = userRole === "admin" || userRole === "owner";
  
  // Derive liked/likes state from props directly — no useEffect needed
  const [hasLiked, setHasLiked] = useState(() => post.likedBy?.includes(user?.uid || "") || false);
  const [likes, setLikes] = useState(() => post.likes);
  const [isLiking, setIsLiking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Derive canDelete for deletion (if user owns post OR is admin)
  const canDelete = user?.uid === post.userId || isAdmin;

  // Comments state
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentsLoaded, setCommentsLoaded] = useState(false);


  const handleLike = async () => {
    if (!user || isLiking) return;
    setIsLiking(true);
    const postRef = doc(db, "posts", post.id);
    const currentLikedBy = post.likedBy || [];

    // Optimistic UI update
    const newHasLiked = !hasLiked;
    setHasLiked(newHasLiked);
    setLikes(prev => newHasLiked ? prev + 1 : prev - 1);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: currentLikedBy.filter((uid) => uid !== user.uid),
        });
      } else {
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...currentLikedBy, user.uid],
        });
      }
    } catch (error) {
      console.error("Failed to like:", error);
      // Revert on failure
      setHasLiked(hasLiked);
      setLikes(post.likes);
    }
    setIsLiking(false);
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deleteDoc(doc(db, "posts", post.id));
    } catch (error) {
      console.error("Failed to delete:", error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm("Delete this comment?")) return;
    try {
      await deleteDoc(doc(db, "posts", post.id, "comments", commentId));
      await updateDoc(doc(db, "posts", post.id), {
        replyCount: increment(-1)
      });
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const loadComments = () => {
    if (commentsLoaded) {
      setShowComments(!showComments);
      return;
    }
    setShowComments(true);
    const q = query(collection(db, "posts", post.id, "comments"), orderBy("createdAt", "asc"));
    onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
      setCommentsLoaded(true);
    });
  };

  const handlePostComment = async () => {
    if (!user || !newComment.trim()) return;
    setPostingComment(true);
    try {
      await addDoc(collection(db, "posts", post.id, "comments"), {
        userId: user.uid,
        userName: user.displayName || user.email?.split("@")[0] || "Anonymous",
        userPhoto: user.photoURL || null,
        userRole: userRole,
        text: newComment.trim(),
        createdAt: serverTimestamp(),
      });
      await updateDoc(doc(db, "posts", post.id), {
        replyCount: increment(1)
      });
      setNewComment("");
    } catch (err) {
      console.error("Failed to post comment:", err);
    }
    setPostingComment(false);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/community/post/${post.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article className="bg-card border border-border rounded-2xl p-4 sm:p-5 hover:border-violet-500/20 transition-all shadow-sm mb-4">
      <div className="flex gap-3">
        {/* Avatar */}
        <Link 
          href={`/profile/${post.userId}`}
          className="w-10 h-10 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden shadow-sm relative hover:ring-2 hover:ring-violet-500/50 transition-all"
        >
          {post.userPhoto ? (
            <Image src={post.userPhoto || ""} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            post.userName?.[0]?.toUpperCase() || "U"
          )}
        </Link>

        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <Link href={`/profile/${post.userId}`} className="font-bold text-sm text-foreground truncate hover:text-violet-500 transition-colors">
              {post.userName}
            </Link>
            <UserBadge userId={post.userId} role={post.userRole} className="scale-90 origin-left" />
            <span className="text-xs text-muted-foreground shrink-0">· {formatTime(post.createdAt)}</span>
          </div>

          {/* Body */}
          <p className="text-[15px] text-foreground/90 whitespace-pre-wrap wrap-break-word leading-relaxed mt-1">
            {post.text}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-6 mt-4">
            <button
              onClick={loadComments}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-violet-500 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {post.replyCount || comments.length > 0 ? (post.replyCount || comments.length) : "Reply"}
            </button>

            <button
              onClick={handleLike}
              disabled={!user || isLiking}
              className={`flex items-center gap-2 text-xs font-medium transition-colors ${
                hasLiked ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
              } disabled:opacity-40`}
            >
              <Heart className={`w-4 h-4 ${hasLiked ? "fill-rose-500" : ""}`} />
              {likes > 0 && likes}
            </button>

            <button
              onClick={copyLink}
              className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-green-500 transition-colors"
              title="Copy Link"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            {canDelete && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-red-500 transition-colors ml-auto"
                title="Delete Post"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 pt-4 border-t border-border ml-2 sm:ml-12 space-y-4">
          {comments.map(c => (
            <div key={c.id} className="flex gap-3 relative group">
              <Link 
                href={`/profile/${c.userId}`}
                className="w-8 h-8 rounded-full bg-violet-600/50 flex items-center justify-center text-white font-bold text-[10px] shrink-0 overflow-hidden relative hover:ring-2 hover:ring-violet-500/50 transition-all"
              >
                {c.userPhoto ? (
                  <Image src={c.userPhoto || ""} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  c.userName?.[0]?.toUpperCase() || "U"
                )}
              </Link>
              <div className="flex-1 bg-black/5 dark:bg-white/5 rounded-2xl rounded-tl-none p-3 relative">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Link href={`/profile/${c.userId}`} className="font-bold text-xs text-foreground hover:text-violet-500 transition-colors">
                      {c.userName}
                    </Link>
                    <UserBadge userId={c.userId} role={c.userRole} className="scale-75 origin-left" />
                    <span className="text-[10px] text-muted-foreground">{formatTime(c.createdAt)}</span>
                  </div>
                  {(user?.uid === c.userId || isAdmin) && (
                    <button
                      onClick={() => handleDeleteComment(c.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/80 wrap-break-word">{c.text}</p>
              </div>
            </div>
          ))}

          {user ? (
            <div className="flex gap-3 mt-2">
              <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold text-[10px] shrink-0 overflow-hidden relative">
                {user.photoURL ? (
                  <Image src={user.photoURL || ""} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  user.displayName?.[0]?.toUpperCase() || "U"
                )}
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handlePostComment(); }}
                  placeholder="Post a reply..."
                  className="flex-1 bg-background border border-border focus:border-violet-500/50 rounded-xl px-3 py-2 text-sm outline-none transition-all"
                />
                <button
                  onClick={handlePostComment}
                  disabled={postingComment || !newComment.trim()}
                  className="px-3 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl disabled:opacity-50 transition-colors"
                >
                  {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center py-2">Log in to reply to this post.</p>
          )}
        </div>
      )}
    </article>
  );
}
