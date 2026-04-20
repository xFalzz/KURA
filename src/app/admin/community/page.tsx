"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Loader2, Trash2, Globe, Search } from "lucide-react";
import { formatTime, Post } from "@/components/PostItem";
import Image from "next/image";

export default function AdminCommunityPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const q = query(collection(db, "posts"), orderBy("createdAt", "desc"), limit(100));
      const snap = await getDocs(q);
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Post)));
    } catch (error) {
      console.error("Failed to fetch posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    
    try {
      await deleteDoc(doc(db, "posts", postId));
      setPosts(posts.filter(p => p.id !== postId));
    } catch (error) {
      console.error("Failed to delete post:", error);
      alert("Failed to delete post. Check permissions.");
    }
  };

  const filteredPosts = posts.filter(p => 
    p.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.userName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-black text-foreground flex items-center gap-2">
            <Globe className="w-8 h-8 text-primary" />
            Community Moderation
          </h1>
          <p className="text-muted-foreground mt-1">Manage global town square posts and enforce community guidelines.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 justify-between items-center bg-muted/20">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search posts or users..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>
          <div className="text-sm font-semibold text-muted-foreground">
            {filteredPosts.length} Posts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Content</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Metrics</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  </td>
                </tr>
              ) : filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    No posts found.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0 overflow-hidden relative">
                          {post.userPhoto ? (
                            <Image src={post.userPhoto || ""} alt="" fill sizes="32px" className="object-cover" />
                          ) : (
                            post.userName?.[0]?.toUpperCase() || "U"
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{post.userName}</p>
                          <p className="text-xs text-muted-foreground font-mono">{post.userId.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 max-w-xs">
                      <p className="text-foreground/90 truncate" title={post.text}>{post.text}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {formatTime(post.createdAt)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span title="Likes">❤️ {post.likes}</span>
                        <span title="Replies">💬 {post.replyCount || 0}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="p-2 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-lg transition-colors inline-flex"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
