"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import { Search, Loader2, ScrollText, UserMinus, Pin, Trash2, Megaphone, FileText, Calendar } from "lucide-react";

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
  const [viewMode, setViewMode] = useState<"table" | "timeline">("table");

  useEffect(() => {
    const fetchLogs = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "audit_logs"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        setLogs(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog)));
      } catch (error) {
        console.error("Failed to fetch audit logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action.includes("BAN") || action.includes("UNBAN")) return <UserMinus className="w-4 h-4 text-orange-500" />;
    if (action.includes("PIN") || action.includes("UNPIN")) return <Pin className="w-4 h-4 text-blue-500" />;
    if (action.includes("DELETE")) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes("ANNOUNCE") || action.includes("CURATION")) return <Megaphone className="w-4 h-4 text-green-500" />;
    return <FileText className="w-4 h-4 text-muted-foreground" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes("BAN") || action.includes("DELETE")) return "text-red-500 bg-red-500/10";
    if (action.includes("PIN")) return "text-blue-500 bg-blue-500/10";
    if (action.includes("ANNOUNCE") || action.includes("CURATION")) return "text-green-500 bg-green-500/10";
    if (action.includes("FEEDBACK")) return "text-violet-500 bg-violet-500/10";
    if (action.includes("MAINTENANCE") || action.includes("SETTINGS")) return "text-amber-500 bg-amber-500/10";
    return "text-muted-foreground bg-muted";
  };

  const filtered = logs.filter(log =>
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.targetId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.details.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
            <ScrollText className="w-7 h-7 text-primary" /> Audit Logs
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Security and transparency timeline. All admin actions are immutably recorded.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
            <button onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === "table" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Table
            </button>
            <button onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewMode === "timeline" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
              Timeline
            </button>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Search logs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
      ) : viewMode === "table" ? (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-medium">Admin</th>
                <th className="px-5 py-3.5 font-medium">Action</th>
                <th className="px-5 py-3.5 font-medium">Target</th>
                <th className="px-5 py-3.5 font-medium">Details</th>
                <th className="px-5 py-3.5 font-medium">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-foreground text-sm">{log.adminEmail}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{log.adminUid?.substring(0, 8)}...</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold w-fit uppercase ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      {log.action.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-muted-foreground">{log.targetId || "N/A"}</td>
                  <td className="px-5 py-3.5 text-foreground text-xs max-w-[250px] truncate">{log.details}</td>
                  <td className="px-5 py-3.5 text-muted-foreground whitespace-nowrap text-xs">
                    {log.createdAt?.toMillis ? (
                      <div>
                        <div>{new Date(log.createdAt.toMillis()).toLocaleDateString()}</div>
                        <div className="text-[10px]">{new Date(log.createdAt.toMillis()).toLocaleTimeString()}</div>
                      </div>
                    ) : "N/A"}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground text-sm">No logs found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Timeline View */
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
          <div className="space-y-0">
            {filtered.map((log, index) => (
              <div key={log.id} className="flex gap-4 relative">
                {index < filtered.length - 1 && (
                  <div className="absolute left-[19px] top-[40px] w-px h-[calc(100%-14px)] bg-border" />
                )}
                <div className="w-[38px] h-[38px] rounded-full bg-muted flex items-center justify-center shrink-0 z-10 border-2 border-card">
                  {getActionIcon(log.action)}
                </div>
                <div className="flex-1 pb-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${getActionColor(log.action)}`}>
                        {log.action.replace(/_/g, " ")}
                      </span>
                      <p className="text-sm text-foreground mt-1">{log.details}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">by {log.adminEmail}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {log.createdAt?.toMillis && (
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          {new Date(log.createdAt.toMillis()).toLocaleDateString()}
                          <span className="ml-1">{new Date(log.createdAt.toMillis()).toLocaleTimeString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted-foreground text-sm">No logs found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
