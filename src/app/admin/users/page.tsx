"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query } from "firebase/firestore";
import { ShieldBan, ShieldCheck, Loader2, AlertTriangle, User as UserIcon } from "lucide-react";
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

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "users"));
      const snap = await getDocs(q);
      const items = snap.docs.map(d => ({id: d.id, ...d.data()} as UserProfile));
      
      // Fallback manual sort by created at desc
      items.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0));
      setUsers(items);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleBanStatus = async (userId: string, currentStatus: boolean) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus ? 'UNBAN' : 'BAN'} this user?`)) {
      return;
    }

    setProcessingId(userId);
    try {
      await updateDoc(doc(db, "users", userId), {
        isBanned: !currentStatus
      });
      await logAdminAction({ action: !currentStatus ? "BANNED_USER" : "UNBANNED_USER", targetId: userId, details: `Toggled user ban status.` });
      
      setUsers(prev => prev.map(u => 
        u.id === userId ? { ...u, isBanned: !currentStatus } : u
      ));
    } catch (error) {
      console.error("Failed to update user ban status:", error);
      alert("Error updating user status.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <UserIcon className="w-8 h-8 text-violet-500" /> User Directory
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review registered users and manage account access (Ban/Suspend).</p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium min-w-[200px]">User Profile</th>
                <th className="px-6 py-4 font-medium w-[250px]">Email Address</th>
                <th className="px-6 py-4 font-medium w-[150px]">Joined Date</th>
                <th className="px-6 py-4 font-medium w-[150px]">Status</th>
                <th className="px-6 py-4 font-medium text-right w-[150px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`border-b border-border last:border-0 hover:bg-muted/10 transition-colors ${user.isBanned ? 'bg-red-500/5 hover:bg-red-500/10' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-violet-600/20 text-violet-500 flex items-center justify-center font-bold">
                        {user.photoURL ? (
                           /* eslint-disable-next-line @next/next/no-img-element */
                           <img src={user.photoURL} alt={user.displayName || "User Avatar"} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          user.displayName?.[0]?.toUpperCase() || "U"
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-foreground">{user.displayName || "Unknown User"}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5" title="UID">
                          {user.id.substring(0, 10)}...
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground font-medium">
                    {user.email || "No email"}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {user.createdAt?.toMillis ? new Date(user.createdAt.toMillis()).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4">
                    {user.isBanned ? (
                       <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2.5 py-1.5 rounded-md w-fit">
                         <ShieldBan className="w-3.5 h-3.5" /> BANNED
                       </span>
                    ) : (
                       <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2.5 py-1.5 rounded-md w-fit">
                         <ShieldCheck className="w-3.5 h-3.5" /> ACTIVE
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button 
                      variant={user.isBanned ? "outline" : "destructive"} 
                      size="sm"
                      onClick={() => toggleBanStatus(user.id, user.isBanned || false)}
                      disabled={processingId === user.id}
                      className="w-[100px]"
                    >
                      {processingId === user.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : user.isBanned ? (
                        "Unban User"
                      ) : (
                        "Ban User"
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-3">
                    <AlertTriangle className="w-8 h-8 opacity-20" />
                    No users found in the database.
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
