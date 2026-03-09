"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Star, Save, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

export default function AdminCurationsPage() {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [gameIds, setGameIds] = useState("");
  const [active, setActive] = useState(false);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "curation_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.curation) {
          const cur = docSnap.data().curation;
          setTitle(cur.title || "");
          setSubtitle(cur.subtitle || "");
          setGameIds(cur.gameIds ? cur.gameIds.join(", ") : "");
          setActive(cur.active || false);
        }
      } catch (error) {
        console.error("Error fetching curation config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    // Convert comma-separated string to array of numbers
    const parsedIds = gameIds
      .split(",")
      .map(id => id.trim())
      .filter(id => id.length > 0)
      .map(id => parseInt(id, 10))
      .filter(id => !isNaN(id));

    try {
      const docRef = doc(db, "settings", "curation_config");
      await setDoc(docRef, {
        curation: {
          title,
          subtitle,
          gameIds: parsedIds,
          active,
          updatedAt: new Date()
        }
      }, { merge: true });
      
      await logAdminAction({ 
        action: active ? "PUBLISHED_CURATION" : "DISABLED_CURATION", 
        targetId: "curation_config", 
        details: `Curation: ${title} (${parsedIds.length} games)` 
      });
      
      alert("Curation banner updated successfully!");
    } catch (error) {
      console.error("Error saving curation:", error);
      alert("Failed to update curation.");
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
          <Sparkles className="w-8 h-8 text-yellow-500" /> Curation Engine
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Designate a special list of games to be featured prominently at the top of the KURA homepage.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h3 className="font-bold text-foreground">Enable Curated Banner</h3>
              <p className="text-sm text-muted-foreground">Show this collection on the public homepage.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-yellow-500"></div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Collection Title</label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g., KURA's Halloween Horror Picks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={active}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Subtitle / Description</label>
            <input
              type="text"
              className="w-full bg-background border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
              placeholder="e.g., Turn off the lights and play these terrifying masterpieces."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              required={active}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              RAWG Game IDs <span className="text-xs font-normal text-muted-foreground">(Comma separated)</span>
            </label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 h-[100px] resize-none font-mono text-sm"
              placeholder="e.g., 3498, 3328, 4200"
              value={gameIds}
              onChange={(e) => setGameIds(e.target.value)}
              required={active}
            />
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Star className="w-3.5 h-3.5" />
              Tip: You can find RAWG Game IDs by looking at the URL of a game on the site (they are often listed in RAWG API docs).
            </p>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSaving} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold rounded-xl px-8 h-12 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Publish Curation
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
