"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query } from "firebase/firestore";
import { ShieldBan, ShieldCheck, Loader2, AlertTriangle, Users, Search, Crown, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";
import Image from "next/image";
import { usePlatformConfig } from "@/contexts/PlatformConfigContext";

interface UserProfile {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  provider?: string;
  role?: "user" | "staff" | "admin" | "owner";
  isBanned?: boolean;
  createdAt: { toMillis?: () => number; seconds?: number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "banned">("all");
  const { userRole } = usePlatformConfig();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({id: d.id, ...d.data()} as UserProfile));
      // Sort by createdAt — handle both Timestamp objects and raw date values
      items.sort((a, b) => {
        const aMs = a.createdAt?.toMillis?.() ?? (a.createdAt as { seconds?: number })?.seconds ? (a.createdAt as { seconds: number }).seconds * 1000 : 0;
        const bMs = b.createdAt?.toMillis?.() ?? (b.createdAt as { seconds?: number })?.seconds ? (b.createdAt as { seconds: number }).seconds * 1000 : 0;
        return bMs - aMs;
      });
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

  const changeRole = async (userId: string, newRole: "user" | "staff" | "admin" | "owner") => {
    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;
    setProcessingId(userId);
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      await logAdminAction({ action: "CHANGED_ROLE", targetId: userId, details: `Role changed to ${newRole}` });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
    } catch (error) {
      console.error("Failed to update user role:", error);
      alert("Error updating user role. Ensure you have permissions.");
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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
            <Users className="w-7 h-7 text-primary" /> User Directory
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Review registered users and manage account access (Ban/Suspend).</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchUsers} className="shrink-0 flex items-center gap-2">
          Refresh
        </Button>
      </div>
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
                <th className="px-5 py-3.5 font-medium w-[150px]">Email</th>
                <th className="px-5 py-3.5 font-medium w-[100px]">Role</th>
                <th className="px-5 py-3.5 font-medium w-[120px]">Joined</th>
                <th className="px-5 py-3.5 font-medium w-[100px]">Status</th>
                <th className="px-5 py-3.5 font-medium text-right min-w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/10 transition-colors ${user.isBanned ? "bg-red-500/3" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                          {user.photoURL ? (
                            <Image src={user.photoURL} alt={user.displayName || "User"} fill sizes="36px" className="rounded-full object-cover" />
                          ) : (user.displayName?.[0]?.toUpperCase() || "U")}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${user.isBanned ? "bg-red-500" : "bg-green-500"}`} />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm flex items-center gap-2">
                          {user.displayName || "Unknown"}
                          {user.role === "owner" && <span title="Owner"><Crown className="w-3 h-3 text-yellow-500" /></span>}
                          {user.role === "admin" && <span title="Admin"><ShieldAlert className="w-3 h-3 text-red-500" /></span>}
                          {user.role === "staff" && <span title="Staff"><Wrench className="w-3 h-3 text-blue-500" /></span>}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{user.id.substring(0, 10)}...</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs font-medium truncate max-w-[150px]" title={user.email || ""}>{user.email || "No email"}</td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold capitalize ${
                      user.role === "owner" ? "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" :
                      user.role === "admin" ? "bg-red-500/10 text-red-600 dark:text-red-400" :
                      user.role === "staff" ? "bg-blue-500/10 text-blue-600 dark:text-blue-400" :
                      "bg-muted text-muted-foreground"
                    }`}>
                      {user.role || "user"}
                    </span>
                  </td>
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
                  <td className="px-5 py-3.5 text-right flex items-center justify-end gap-2">
                    {/* Role Dropdown - Only Owner can make Admins, Admins can only make Staff */}
                    <select
                      className="text-xs bg-muted border border-border rounded-lg px-2 py-1.5 focus:outline-none"
                      value={user.role || "user"}
                      disabled={processingId === user.id || (userRole !== "owner" && user.role === "owner") || (userRole !== "owner" && user.role === "admin" && userRole === "admin")}
                      onChange={(e) => changeRole(user.id, e.target.value as "user"|"staff"|"admin"|"owner")}
                    >
                      <option value="user">User</option>
                      {(userRole === "admin" || userRole === "owner") && <option value="staff">Staff</option>}
                      {userRole === "owner" && <option value="admin">Admin</option>}
                      {userRole === "owner" && <option value="owner">Owner</option>}
                    </select>

                    <Button variant={user.isBanned ? "outline" : "destructive"} size="sm"
                      onClick={() => toggleBanStatus(user.id, user.isBanned || false)}
                      disabled={processingId === user.id || user.role === "owner" || (userRole !== "owner" && user.role === "admin")}
                      className="w-[70px] text-xs rounded-lg h-8">
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
