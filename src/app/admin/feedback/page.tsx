"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, doc, updateDoc, query, orderBy, limit } from "firebase/firestore";
import { MessageCircle, Loader2, Bug, Lightbulb, HelpCircle, CheckCircle, Clock, Send, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

interface Feedback {
  id: string;
  userId: string;
  userName: string;
  userEmail?: string;
  message: string;
  type: "bug" | "feature" | "other";
  status: "new" | "reviewed" | "resolved";
  adminResponse?: string;
  createdAt: { toMillis?: () => number } | null;
}

const TYPE_CONFIG = {
  bug: { label: "Bug Report", icon: Bug, color: "text-red-500", bg: "bg-red-500/10" },
  feature: { label: "Feature Request", icon: Lightbulb, color: "text-amber-500", bg: "bg-amber-500/10" },
  other: { label: "Other", icon: HelpCircle, color: "text-blue-500", bg: "bg-blue-500/10" },
};

const STATUS_CONFIG = {
  new: { label: "New", color: "text-violet-500", bg: "bg-violet-500/10", icon: Clock },
  reviewed: { label: "Reviewed", color: "text-amber-500", bg: "bg-amber-500/10", icon: Clock },
  resolved: { label: "Resolved", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle },
};

export default function AdminFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "bug" | "feature" | "other">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "reviewed" | "resolved">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeedback = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, "feedback"), orderBy("createdAt", "desc"), limit(100));
        const snap = await getDocs(q);
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Feedback));
        setFeedbacks(items);
      } catch (error) {
        console.error("Failed to fetch feedback:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFeedback();
  }, []);

  const updateStatus = async (id: string, newStatus: "new" | "reviewed" | "resolved") => {
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "feedback", id), { status: newStatus });
      await logAdminAction({ action: `FEEDBACK_${newStatus.toUpperCase()}`, targetId: id, details: `Changed feedback status to ${newStatus}` });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, status: newStatus } : f));
    } catch (error) {
      console.error("Failed to update feedback:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const submitResponse = async (id: string) => {
    if (!responseText.trim()) return;
    setProcessingId(id);
    try {
      await updateDoc(doc(db, "feedback", id), {
        adminResponse: responseText.trim(),
        status: "reviewed",
      });
      await logAdminAction({ action: "FEEDBACK_RESPONDED", targetId: id, details: `Admin responded to feedback` });
      setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, adminResponse: responseText.trim(), status: "reviewed" } : f));
      setRespondingId(null);
      setResponseText("");
    } catch (error) {
      console.error("Failed to respond:", error);
    } finally {
      setProcessingId(null);
    }
  };

  const filtered = feedbacks.filter(f => {
    if (filter !== "all" && f.type !== filter) return false;
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (searchTerm && !f.message.toLowerCase().includes(searchTerm.toLowerCase()) && !f.userName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  const counts = {
    all: feedbacks.length,
    new: feedbacks.filter(f => f.status === "new").length,
    bug: feedbacks.filter(f => f.type === "bug").length,
    feature: feedbacks.filter(f => f.type === "feature").length,
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <MessageCircle className="w-7 h-7 text-primary" /> User Feedback
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">Review, respond to, and manage community feedback submissions.</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total</p>
          <p className="text-2xl font-black text-foreground mt-1">{counts.all}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-violet-500 font-medium uppercase tracking-wider">Unread</p>
          <p className="text-2xl font-black text-violet-500 mt-1">{counts.new}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-red-500 font-medium uppercase tracking-wider">Bugs</p>
          <p className="text-2xl font-black text-red-500 mt-1">{counts.bug}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4">
          <p className="text-xs text-amber-500 font-medium uppercase tracking-wider">Features</p>
          <p className="text-2xl font-black text-amber-500 mt-1">{counts.feature}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(["all", "bug", "feature", "other"] as const).map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {t === "all" ? "All Types" : t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-muted/50 p-1 rounded-xl">
          {(["all", "new", "reviewed", "resolved"] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${statusFilter === s ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search feedback..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-card border border-border rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all" />
        </div>
      </div>

      {/* Feedback Cards */}
      <div className="space-y-4">
        {filtered.map((f) => {
          const typeConf = TYPE_CONFIG[f.type] || TYPE_CONFIG.other;
          const statusConf = STATUS_CONFIG[f.status] || STATUS_CONFIG.new;
          const TypeIcon = typeConf.icon;
          const StatusIcon = statusConf.icon;
          return (
            <div key={f.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeConf.bg}`}>
                    <TypeIcon className={`w-4 h-4 ${typeConf.color}`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">{f.userName}</h3>
                    <p className="text-[11px] text-muted-foreground">{f.userEmail || "No email"} • {f.createdAt?.toMillis ? new Date(f.createdAt.toMillis()).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${typeConf.bg} ${typeConf.color}`}>
                    {typeConf.label}
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${statusConf.bg} ${statusConf.color}`}>
                    <StatusIcon className="w-3 h-3" /> {statusConf.label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-3">{f.message}</p>

              {/* Admin response */}
              {f.adminResponse && (
                <div className="bg-muted/40 border border-border rounded-xl p-3 mb-3">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Admin Response</p>
                  <p className="text-sm text-foreground">{f.adminResponse}</p>
                </div>
              )}

              {/* Response Form */}
              {respondingId === f.id && (
                <div className="flex gap-2 mb-3">
                  <input type="text" value={responseText} onChange={e => setResponseText(e.target.value)}
                    placeholder="Type your response..." className="flex-1 bg-background border border-border rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
                  <Button size="sm" onClick={() => submitResponse(f.id)} disabled={processingId === f.id}
                    className="bg-primary hover:bg-violet-500 text-white rounded-xl px-4">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-3 border-t border-border">
                <Button variant="outline" size="sm" className="text-xs rounded-lg h-8"
                  onClick={() => { setRespondingId(respondingId === f.id ? null : f.id); setResponseText(f.adminResponse || ""); }}>
                  {respondingId === f.id ? "Cancel" : "Respond"}
                </Button>
                {f.status === "new" && (
                  <Button variant="outline" size="sm" className="text-xs rounded-lg h-8 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10"
                    onClick={() => updateStatus(f.id, "reviewed")} disabled={processingId === f.id}>
                    Mark Reviewed
                  </Button>
                )}
                {f.status !== "resolved" && (
                  <Button variant="outline" size="sm" className="text-xs rounded-lg h-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                    onClick={() => updateStatus(f.id, "resolved")} disabled={processingId === f.id}>
                    Resolve
                  </Button>
                )}
                {f.status === "resolved" && (
                  <Button variant="outline" size="sm" className="text-xs rounded-lg h-8 text-muted-foreground"
                    onClick={() => updateStatus(f.id, "new")} disabled={processingId === f.id}>
                    Reopen
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No feedback found matching your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
