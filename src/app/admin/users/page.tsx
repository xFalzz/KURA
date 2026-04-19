"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query } from "firebase/firestore";
import { ShieldBan, ShieldCheck, Loader2, AlertTriangle, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  isBanned?: boolean;
  createdAt: { toMillis?: () => number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({id: d.id, ...d.data()} as UserProfile));
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setUsers(items);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleBanStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? "UNBAN" : "BAN"} this user?`)) return;
    setProcessingId(userId);
    try {
      await updateDoc(doc(db, "users", userId), { isBanned: !currentStatus });
      await logAdminAction({ action: !currentStatus ? "BANNED_USER" : "UNBANNED_USER", targetId: userId, details: `Toggled user ban status.` });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBanned: !currentStatus } : u));
    } catch (error) {
      console.error("Failed to update user ban status:", error);
      alert("Error updating user status.");
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = users.filter(u => {
    if (statusFilter === "active" && u.isBanned) return false;
    if (statusFilter === "banned" && !u.isBanned) return false;
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      if (!u.displayName?.toLowerCase().includes(s) && !u.email?.toLowerCase().includes(s)) return false;
    }
    return true;
  });

  const counts = { all: users.length, active: users.filter(u => !u.isBanned).length, banned: users.filter(u => u.isBanned).length };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Users className="w-7 h-7 text-primary" /> User Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review registered users and manage account access (Ban/Suspend).</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-medium">Total</p>
          <p className="text-xl font-black text-foreground">{counts.all}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-green-500 font-medium">Active</p>
          <p className="text-xl font-black text-green-500">{counts.active}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-red-500 font-medium">Banned</p>
          <p className="text-xl font-black text-red-500">{counts.banned}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(["all", "active", "banned"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-medium min-w-[200px]">User Profile</th>
                <th className="px-5 py-3.5 font-medium w-[240px]">Email</th>
                <th className="px-5 py-3.5 font-medium w-[130px]">Joined</th>
                <th className="px-5 py-3.5 font-medium w-[120px]">Status</th>
                <th className="px-5 py-3.5 font-medium text-right w-[130px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/10 transition-colors ${user.isBanned ? "bg-red-500/[0.03]" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {user.photoURL ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={user.photoURL} alt={user.displayName || "User"} className="w-full h-full rounded-full object-cover" />
                          ) : (user.displayName?.[0]?.toUpperCase() || "U")}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${user.isBanned ? "bg-red-500" : "bg-green-500"}`} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{user.displayName || "Unknown"}</div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.id.substring(0, 10)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs font-medium">{user.email || "No email"}</td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs">
                    {user.createdAt?.toMillis ? new Date(user.createdAt.toMillis()).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-5 py-3.5">
                    {user.isBanned ? (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg w-fit">
                        <ShieldBan className="w-3 h-3" /> BANNED
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg w-fit">
                        <ShieldCheck className="w-3 h-3" /> ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <Button variant={user.isBanned ? "outline" : "destructive"} size="sm"
                      onClick={() => toggleBanStatus(user.id, user.isBanned || false)}
                      disabled={processingId === user.id} className="w-[90px] text-xs rounded-lg h-8">
                      {processingId === user.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : user.isBanned ? "Unban" : "Ban"}
                    </Button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    No users found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
