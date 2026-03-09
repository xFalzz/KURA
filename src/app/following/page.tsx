"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Loader2, Users, UserMinus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface FollowedUser {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  docId: string;
}

export default function FollowingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState<FollowedUser[]>([]);
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
      const q = query(collection(db, "follows"), where("followerId", "==", user.uid));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({ docId: d.id, ...d.data() } as FollowedUser));
      setFollowing(items);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const unfollow = async (docId: string) => {
    await deleteDoc(doc(db, "follows", docId));
    setFollowing(prev => prev.filter(f => f.docId !== docId));
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
    </div>
  );

  return (
    <div className="px-4 sm:px-6 py-4 sm:py-6 w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users className="w-7 h-7 text-violet-500" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-outfit font-black text-foreground">People You Follow</h1>
          <p className="text-muted-foreground text-sm">{following.length} people you follow</p>
        </div>
      </div>

      {following.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
          <Users className="w-16 h-16 text-muted-foreground/30" />
          <h2 className="text-2xl font-bold text-foreground">Not following anyone yet</h2>
          <p className="text-muted-foreground max-w-md">Visit community member profiles to follow gamers with great taste.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {following.map((f) => (
            <div key={f.docId} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl hover:border-violet-500/30 transition-all group">
              <Link href={`/profile/${f.uid}`} className="flex items-center gap-4 flex-1 min-w-0">
                <div className="relative w-12 h-12 rounded-full overflow-hidden bg-violet-600 flex items-center justify-center text-white font-bold text-lg shrink-0">
                  {f.photoURL ? (
                    <Image src={f.photoURL} alt={f.displayName} fill className="object-cover" />
                  ) : (
                    <span>{f.displayName?.[0]?.toUpperCase() || "?"}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-foreground group-hover:text-violet-500 transition-colors truncate">{f.displayName || "Anonymous"}</p>
                  <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                </div>
              </Link>
              <button
                onClick={() => unfollow(f.docId)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all shrink-0"
              >
                <UserMinus className="w-4 h-4" />
                Unfollow
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
