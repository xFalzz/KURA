"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, FolderOpen, Plus } from "lucide-react";
import Link from "next/link";

interface Collection {
  id: string;
  name: string;
  description: string;
  gamesCount: number;
  createdAt: string;
}

export default function CollectionsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const q = query(collection(db, "collections"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Collection));
      setCollections(items);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const createCollection = async () => {
    if (!newName.trim() || !user) return;
    setSaving(true);
    const ref = await addDoc(collection(db, "collections"), {
      userId: user.uid,
      name: newName.trim(),
      description: newDesc.trim(),
      gamesCount: 0,
      createdAt: serverTimestamp(),
    });
    setCollections(prev => [...prev, { id: ref.id, name: newName.trim(), description: newDesc.trim(), gamesCount: 0, createdAt: new Date().toISOString() }]);
    setNewName(""); setNewDesc(""); setShowForm(false); setSaving(false);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <FolderOpen className="w-7 h-7 text-violet-500" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black text-foreground">My Collections</h1>
            <p className="text-muted-foreground text-sm">{collections.length} collections</p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Collection
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-foreground mb-4">Start a New Collection</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Collection name"
            className="w-full mb-3 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-violet-500/50"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full mb-4 px-4 py-2.5 rounded-xl bg-black/5 dark:bg-white/10 text-foreground text-sm border border-border focus:outline-none focus:ring-2 focus:ring-violet-500/50 resize-none"
          />
          <div className="flex gap-3">
            <button onClick={createCollection} disabled={saving || !newName.trim()} className="px-5 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
              {saving ? "Creating..." : "Create"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-5 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {collections.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <FolderOpen className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-foreground">No collections yet</h2>
          <p className="text-muted-foreground max-w-md">Create collections to group your favorite games by theme or genre.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {collections.map((col) => (
            <div key={col.id} className="bg-card border border-border rounded-2xl p-5 hover:border-violet-500/30 transition-all group">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <FolderOpen className="w-5 h-5 text-violet-500" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-foreground group-hover:text-violet-500 transition-colors truncate">{col.name}</h3>
                  <p className="text-xs text-muted-foreground">{col.gamesCount} games</p>
                </div>
              </div>
              {col.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-2">{col.description}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
