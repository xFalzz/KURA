"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { Flag, Loader2, Trash2, CheckCircle, ExternalLink, AlertTriangle, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

interface Report {
  id: string;
  reviewId: string;
  gameId: string;
  reporterUid: string;
  reporterName: string;
  reason: string;
  status: string;
  createdAt: { toMillis?: () => number } | null;
}

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "dismissed" | "resolved_deleted">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      setReports(snap.docs.map(d => ({ id: d.id, ...d.data() } as Report)));
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const dismissReport = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await updateDoc(doc(db, "reports", reportId), { status: "dismissed" });
      await logAdminAction({ action: "DISMISSED_REPORT", targetId: reportId, details: "Dismissed community report as false flag." });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: "dismissed" } : r));
    } catch (error) {
      console.error("Failed to dismiss report:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const deleteReviewAndDismiss = async (reportId: string, reviewId: string) => {
    if (!window.confirm("Delete the reported review permanently? This cannot be undone.")) return;
    setProcessingId(reportId);
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      await updateDoc(doc(db, "reports", reportId), { status: "resolved_deleted" });
      await logAdminAction({ action: "DELETED_REPORTED_REVIEW", targetId: reviewId, details: `Deleted review from report ${reportId}` });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: "resolved_deleted" } : r));
    } catch (error) {
      console.error("Failed to delete review:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = reports.filter(r => {
    if (filter !== "all" && r.status !== filter) return false;
    if (searchTerm && !r.reporterName?.toLowerCase().includes(searchTerm.toLowerCase()) && !r.reason?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: reports.length,
    pending: reports.filter(r => r.status === "pending").length,
    dismissed: reports.filter(r => r.status === "dismissed").length,
    resolved: reports.filter(r => r.status === "resolved_deleted").length,
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-red-500" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Flag className="w-7 h-7 text-red-500" /> User Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review community-flagged content. Take action to delete inappropriate reviews or dismiss false reports.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-medium">Total</p>
          <p className="text-xl font-black text-foreground">{counts.all}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-red-500 font-medium">Pending</p>
          <p className="text-xl font-black text-red-500">{counts.pending}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground font-medium">Dismissed</p>
          <p className="text-xl font-black text-muted-foreground">{counts.dismissed}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-xs text-green-500 font-medium">Resolved</p>
          <p className="text-xl font-black text-green-500">{counts.resolved}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(["all", "pending", "dismissed", "resolved_deleted"] as const).map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All" : s === "resolved_deleted" ? "Resolved" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by reporter or reason..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/30 border-b border-border">
              <tr>
                <th className="px-5 py-3.5 font-medium w-[180px]">Reporter</th>
                <th className="px-5 py-3.5 font-medium">Reason</th>
                <th className="px-5 py-3.5 font-medium w-[120px]">Date</th>
                <th className="px-5 py-3.5 font-medium w-[110px]">Status</th>
                <th className="px-5 py-3.5 font-medium text-right w-[180px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((report) => (
                <tr key={report.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/10 transition-colors ${report.status === "pending" ? "bg-red-500/[0.03]" : ""}`}>
                  <td className="px-5 py-3.5">
                    <div className="font-bold text-foreground text-sm">{report.reporterName}</div>
                    <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{report.reporterUid?.substring(0, 8)}...</div>
                  </td>
                  <td className="px-5 py-3.5">
                    <p className="text-foreground text-sm font-medium mb-1">&quot;{report.reason}&quot;</p>
                    <Link href={`/admin/reviews?search=${report.reviewId}`} className="text-[10px] text-primary hover:underline flex items-center gap-1 w-fit" target="_blank">
                      <ExternalLink className="w-3 h-3" /> Inspect Review
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-muted-foreground text-xs whitespace-nowrap">
                    {report.createdAt?.toMillis ? new Date(report.createdAt.toMillis()).toLocaleDateString() : "N/A"}
                  </td>
                  <td className="px-5 py-3.5">
                    {report.status === "pending" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded-lg w-fit">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Pending
                      </span>
                    ) : report.status === "dismissed" ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-lg w-fit">
                        Dismissed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded-lg w-fit">
                        <CheckCircle className="w-3 h-3" /> Resolved
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    {report.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm" className="text-xs rounded-lg h-8"
                          onClick={() => dismissReport(report.id)} disabled={processingId === report.id}>
                          Dismiss
                        </Button>
                        <Button variant="destructive" size="sm" className="text-xs rounded-lg h-8 flex items-center gap-1"
                          onClick={() => deleteReviewAndDismiss(report.id, report.reviewId)} disabled={processingId === report.id}>
                          {processingId === report.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">
                    <AlertTriangle className="w-8 h-8 opacity-20 mx-auto mb-2" />
                    {filter === "all" ? "No reports yet. Great community!" : "No reports matching this filter."}
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
