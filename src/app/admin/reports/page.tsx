"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from "firebase/firestore";
import { Flag, Loader2, Trash2, CheckCircle, ExternalLink, AlertTriangle } from "lucide-react";
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

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "reports"), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Report));
      setReports(items);
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const dismissReport = async (reportId: string) => {
    setProcessingId(reportId);
    try {
      await updateDoc(doc(db, "reports", reportId), {
        status: "dismissed"
      });
      await logAdminAction({ action: "DISMISSED_REPORT", targetId: reportId, details: "Dismissed community report as false flag." });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "dismissed" } : r))
      );
    } catch (error) {
      console.error("Failed to dismiss report:", error);
      alert("Error dismissing report.");
    } finally {
      setProcessingId(null);
    }
  };

  const deleteReviewAndDismiss = async (reportId: string, reviewId: string) => {
    if (!window.confirm("Are you sure you want to completely DELETE the reported review? This cannot be undone.")) {
      return;
    }

    setProcessingId(reportId);
    try {
      // 1. Delete the review
      await deleteDoc(doc(db, "reviews", reviewId));
      
      // 2. Mark report as resolved
      await updateDoc(doc(db, "reports", reportId), {
        status: "resolved_deleted"
      });

      await logAdminAction({ action: "DELETED_REPORTED_REVIEW", targetId: reviewId, details: `Deleted review resulting from report ${reportId}` });

      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "resolved_deleted" } : r))
      );
      
      alert("Review deleted successfully.");
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Error executing moderation action.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Flag className="w-8 h-8 text-red-500" /> Crowdsourced Reports
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Review community-flagged content. Take action to delete inappropriate reviews or dismiss false reports.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
        <div className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 font-medium w-[200px]">Reporter</th>
                <th className="px-6 py-4 font-medium">Reason</th>
                <th className="px-6 py-4 font-medium w-[150px]">Date</th>
                <th className="px-6 py-4 font-medium w-[120px]">Status</th>
                <th className="px-6 py-4 font-medium text-right w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className={`border-b border-border last:border-0 hover:bg-muted/10 transition-colors ${
                    report.status === "pending" ? "bg-red-500/5 hover:bg-red-500/10" : ""
                  }`}
                >
                  <td className="px-6 py-4">
                    <div className="font-bold text-foreground">{report.reporterName}</div>
                    <div className="text-xs text-muted-foreground font-mono mt-0.5" title={report.reporterUid}>
                      {report.reporterUid.substring(0, 8)}...
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-foreground font-medium mb-1">
                      &quot;{report.reason}&quot;
                    </p>
                    <Link
                      href={`/admin/reviews?search=${report.reviewId}`}
                      className="text-xs text-violet-500 hover:underline flex items-center gap-1 w-fit"
                      target="_blank"
                    >
                      <ExternalLink className="w-3 h-3" /> Inspect Original Review
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground whitespace-nowrap">
                    {report.createdAt?.toMillis
                      ? new Date(report.createdAt.toMillis()).toLocaleDateString()
                      : "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    {report.status === "pending" ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded w-fit uppercase">
                        Pending
                      </span>
                    ) : report.status === "dismissed" ? (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded w-fit uppercase">
                        Dismissed
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-xs font-bold text-green-500 bg-green-500/10 px-2 py-1 rounded w-fit uppercase">
                        <CheckCircle className="w-3.5 h-3.5" /> Deleted
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {report.status === "pending" && (
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => dismissReport(report.id)}
                          disabled={processingId === report.id}
                        >
                          Dismiss
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteReviewAndDismiss(report.id, report.reviewId)}
                          disabled={processingId === report.id}
                          className="flex items-center gap-2"
                        >
                          {processingId === report.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                          Delete
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {reports.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-muted-foreground font-medium flex flex-col items-center justify-center gap-3"
                  >
                    <AlertTriangle className="w-8 h-8 opacity-20" />
                    No reports pending review. Great community!
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
