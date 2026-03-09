"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Globe, Save, Loader2 } from "lucide-react";
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
      await setDoc(docRef, {
        titleTemplate,
        description,
        keywords,
        updatedAt: new Date()
      }, { merge: true });
      
      await logAdminAction({ 
        action: "UPDATED_SEO", 
        targetId: "seo_config", 
        details: `Updated global SEO templates and metadata.` 
      });
      
      alert("SEO Configuration updated successfully!");
    } catch (error) {
      console.error("Error saving SEO config:", error);
      alert("Failed to update SEO.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-violet-500" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Globe className="w-8 h-8 text-blue-500" /> Dynamic SEO Manager
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Manage the global Search Engine Optimization tags that appear in Google search results. Note: Changes take effect on next client render.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Global Site Title / Template</label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g., KURA | %s"
              value={titleTemplate}
              onChange={(e) => setTitleTemplate(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">This is the title tag displayed on search engines for the main layout.</p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Global Meta Description</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-none"
              placeholder="A brief summary of KURA for search engines (150-160 characters)."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              maxLength={160}
            />
            <div className="text-xs text-muted-foreground flex justify-between">
              <span>Kept between 150-160 chars for best ranking.</span>
              <span className={description.length > 160 ? "text-red-500 font-bold" : ""}>{description.length}/160</span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Keywords</label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="gaming, reviews, database, RAWG..."
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Comma separated keywords for legacy SEO crawlers.</p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSaving} className="bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl px-8 h-12 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save SEO Data
            </Button>
          </div>

        </form>
      </div>

      <div className="bg-muted border border-border rounded-2xl p-6">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Google Search Preview</h3>
        <div className="bg-card p-4 rounded-xl border border-border wrap-break-word">
          <div className="text-blue-500 text-lg sm:text-xl cursor-pointer hover:underline mb-1 w-fit">
            {titleTemplate}
          </div>
          <div className="text-green-600 dark:text-green-400 text-xs sm:text-sm mb-1">
            https://kura.vercel.app/
          </div>
          <div className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
}
