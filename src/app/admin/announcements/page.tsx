"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Megaphone, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

export default function AdminAnnouncementsPage() {
  const [message, setMessage] = useState("");
  const [active, setActive] = useState(false);
  const [type, setType] = useState<"info" | "warning" | "success">("info");
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.announcement) {
          const ann = docSnap.data().announcement;
          setMessage(ann.message || "");
          setActive(ann.active || false);
          setType(ann.type || "info");
        }
      } catch (error) {
        console.error("Error fetching config:", error);
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
      const docRef = doc(db, "settings", "global_config");
      await setDoc(docRef, {
        announcement: {
          message,
          active,
          type,
          updatedAt: new Date()
        }
      }, { merge: true }); // Merge to avoid overwriting other potential settings
      
      await logAdminAction({ action: active ? "POSTED_ANNOUNCEMENT" : "DISABLED_ANNOUNCEMENT", targetId: "global_config", details: `Type: ${type}, Msg: ${message}` });
      
      alert("Announcement updated successfully!");
    } catch (error) {
      console.error("Error saving announcement:", error);
      alert("Failed to update announcement.");
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
          <Megaphone className="w-8 h-8 text-violet-500" /> Global Announcements
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Push an important notification banner to the top of the screen for all users.
        </p>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h3 className="font-bold text-foreground">Enable Banner</h3>
              <p className="text-sm text-muted-foreground">Toggle this to show or hide the announcement globally.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Announcement Message</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-none"
              placeholder="e.g., Server maintenance scheduled for 12:00 AM EST."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required={active}
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Banner Style (Color)</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="info" checked={type === "info"} onChange={() => setType("info")} className="accent-violet-600" />
                <span className="text-sm bg-violet-600 text-white px-3 py-1 rounded-md">Info (Violet)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="warning" checked={type === "warning"} onChange={() => setType("warning")} className="accent-orange-500" />
                <span className="text-sm bg-orange-600 text-white px-3 py-1 rounded-md">Warning (Orange)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" value="success" checked={type === "success"} onChange={() => setType("success")} className="accent-green-500" />
                <span className="text-sm bg-green-600 text-white px-3 py-1 rounded-md">Success (Green)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSaving} className="bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl px-8 h-12 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration
            </Button>
          </div>

        </form>
      </div>

      {/* Live Preview */}
      <div className="opacity-70 mt-12">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Preview</h3>
        {active ? (
           <div className={`p-3 text-center text-sm font-medium text-white rounded-t-xl ${
             type === "info" ? "bg-violet-600" : type === "warning" ? "bg-orange-600" : "bg-green-600"
           }`}>
             {message || "Your message will appear here..."}
           </div>
        ) : (
          <div className="p-4 border border-dashed border-border rounded-xl text-center text-sm text-muted-foreground font-mono">
            Banner is currently inactive / hidden.
          </div>
        )}
      </div>

    </div>
  );
}
