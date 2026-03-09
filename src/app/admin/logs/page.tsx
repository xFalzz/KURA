"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Search, Loader2, ShieldAlert, FileText, UserMinus, Pin, Trash2, Megaphone } from "lucide-react";

interface AuditLog {
  id: string;
  action: string;
  adminUid: string;
  adminEmail: string;
  targetId: string;
  details: string;
  createdAt: { toMillis?: () => number } | null;
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
        setLogs(data);
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "BANNED_USER":
      case "UNBANNED_USER":
        return <UserMinus className="w-4 h-4 text-orange-500" />;
      case "PINNED_REVIEW":
      case "UNPINNED_REVIEW":
        return <Pin className="w-4 h-4 text-blue-500" />;
      case "DELETED_REVIEW":
        return <Trash2 className="w-4 h-4 text-red-500" />;
      case "POSTED_ANNOUNCEMENT":
      case "DISABLED_ANNOUNCEMENT":
        return <Megaphone className="w-4 h-4 text-green-500" />;
      default:
        return <FileText className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("BAN") || action.includes("DELETE")) return "text-red-500 bg-red-500/10";
    if (action.includes("PIN")) return "text-blue-500 bg-blue-500/10";
    if (action.includes("ANNOUNCE")) return "text-green-500 bg-green-500/10";
    return "text-muted-foreground bg-muted";
  };

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-outfit font-black text-foreground flex items-center gap-3">
            <ShieldAlert className="w-8 h-8 text-violet-500" /> Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Security and transparency timeline. All critical administrative actions are immutably recorded here.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search logs by action or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-violet-500 transition-colors"
          />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium">Administrator</th>
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Target ID</th>
                <th className="px-6 py-4 font-medium">Details</th>
                <th className="px-6 py-4 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{log.adminEmail}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5">{log.adminUid.substring(0, 8)}...</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold w-fit ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                    {log.targetId || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-foreground">
                    {log.details}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {log.createdAt?.toMillis ? (
                      <div>
                        <div>{new Date(log.createdAt.toMillis()).toLocaleDateString()}</div>
                        <div className="text-xs">{new Date(log.createdAt.toMillis()).toLocaleTimeString()}</div>
                      </div>
                    ) : (
                      "N/A"
                    )}
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                    No logs found matching your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
