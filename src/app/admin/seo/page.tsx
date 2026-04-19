"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Globe, Save, Loader2, Eye, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

export default function AdminSEOPage() {
  const [titleTemplate, setTitleTemplate] = useState("KURA | The Ultimate Game Encyclopedia");
  const [description, setDescription] = useState("Discover, review, and track the best video games in the world.");
  const [keywords, setKeywords] = useState("gaming, video games, reviews, library, DB");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "seo_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cfg = docSnap.data();
          if (cfg.titleTemplate) setTitleTemplate(cfg.titleTemplate);
          if (cfg.description) setDescription(cfg.description);
          if (cfg.keywords) setKeywords(cfg.keywords);
        }
      } catch (error) {
        console.error("Error fetching SEO config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const docRef = doc(db, "settings", "seo_config");
      await setDoc(docRef, { titleTemplate, description, keywords, updatedAt: new Date() }, { merge: true });
      await logAdminAction({ action: "UPDATED_SEO", targetId: "seo_config", details: `Updated global SEO templates and metadata.` });
      alert("SEO Configuration updated successfully!");
    } catch (error) {
      console.error("Error saving SEO config:", error);
      alert("Failed to update SEO.");
    } finally {
      setIsSaving(false);
    }
  };

  // SEO quality score
  const getScore = () => {
    let score = 0;
    if (titleTemplate.length >= 10 && titleTemplate.length <= 70) score += 30;
    else if (titleTemplate.length > 0) score += 15;
    if (description.length >= 120 && description.length <= 160) score += 40;
    else if (description.length >= 80) score += 25;
    else if (description.length > 0) score += 10;
    if (keywords.split(",").filter(k => k.trim()).length >= 3) score += 30;
    else if (keywords.length > 0) score += 15;
    return score;
  };

  const score = getScore();
  const scoreColor = score >= 80 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";
  const scoreBg = score >= 80 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Globe className="w-7 h-7 text-blue-500" /> Dynamic SEO Manager
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage the global Search Engine Optimization tags that appear in Google search results.
        </p>
      </div>

      {/* SEO Score Card */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-foreground">SEO Quality Score</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Based on title length, description length, and keyword count.</p>
          </div>
          <div className="text-center">
            <p className={`text-3xl font-black ${scoreColor}`}>{score}</p>
            <p className="text-[10px] text-muted-foreground">/ 100</p>
          </div>
        </div>
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div className={`h-full ${scoreBg} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
        </div>
        <div className="flex items-center gap-4 mt-3 text-xs">
          {score >= 80 ? (
            <span className="flex items-center gap-1 text-green-500"><CheckCircle className="w-3.5 h-3.5" /> Excellent SEO</span>
          ) : score >= 50 ? (
            <span className="flex items-center gap-1 text-amber-500"><AlertCircle className="w-3.5 h-3.5" /> Can be improved</span>
          ) : (
            <span className="flex items-center gap-1 text-red-500"><AlertCircle className="w-3.5 h-3.5" /> Needs attention</span>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Global Site Title</label>
            <input type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              placeholder="e.g., KURA | %s" value={titleTemplate} onChange={e => setTitleTemplate(e.target.value)} required />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Displayed on search engines for the main layout.</span>
              <span className={titleTemplate.length > 70 ? "text-red-500 font-bold" : ""}>{titleTemplate.length}/70</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Meta Description</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none text-sm"
              placeholder="A brief summary for search engines (150-160 chars)."
              value={description} onChange={e => setDescription(e.target.value)} required maxLength={160} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Keep between 120-160 chars for best ranking.</span>
              <span className={description.length > 160 ? "text-red-500 font-bold" : description.length >= 120 ? "text-green-500" : ""}>{description.length}/160</span>
            </div>
            {/* Progress bar */}
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${description.length >= 120 && description.length <= 160 ? "bg-green-500" : description.length > 160 ? "bg-red-500" : "bg-amber-500"}`}
                style={{ width: `${Math.min((description.length / 160) * 100, 100)}%` }} />
            </div>
          </div>

          {/* Keywords */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Keywords</label>
            <input type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              placeholder="gaming, reviews, database, RAWG..." value={keywords} onChange={e => setKeywords(e.target.value)} />
            <p className="text-xs text-muted-foreground">Comma-separated keywords ({keywords.split(",").filter(k => k.trim()).length} keywords)</p>
          </div>

          {/* Save */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSaving}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl px-8 h-12 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save SEO Data
            </Button>
          </div>
        </form>
      </div>

      {/* Google Preview */}
      <div>
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Google Search Preview
        </h3>
        <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="text-blue-500 text-lg cursor-pointer hover:underline mb-1 w-fit font-medium">
            {titleTemplate}
          </div>
          <div className="text-green-600 dark:text-green-400 text-xs mb-1">
            https://kura.vercel.app/
          </div>
          <div className="text-muted-foreground text-sm leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
