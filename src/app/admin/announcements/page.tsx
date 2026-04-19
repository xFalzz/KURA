"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Megaphone, Save, Loader2, Eye } from "lucide-react";
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
        announcement: { message, active, type, updatedAt: new Date() }
      }, { merge: true });
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
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  const typeStyles = {
    info: { label: "Info (Violet)", color: "bg-primary", ring: "ring-primary/30" },
    warning: { label: "Warning (Orange)", color: "bg-orange-500", ring: "ring-orange-500/30" },
    success: { label: "Success (Green)", color: "bg-green-500", ring: "ring-green-500/30" },
  };

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Megaphone className="w-7 h-7 text-primary" /> Global Announcements
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Push an important notification banner to the top of the screen for all users.
        </p>
      </div>

      {/* Status Card */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${active ? "bg-primary/5 border-primary/20" : "bg-muted/30 border-border"}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${active ? "bg-primary/10" : "bg-muted"}`}>
          <Megaphone className={`w-6 h-6 ${active ? "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div>
          <h3 className={`text-lg font-bold ${active ? "text-primary" : "text-muted-foreground"}`}>
            {active ? "Banner Active" : "Banner Inactive"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {active ? "Users are currently seeing the announcement banner." : "No announcement is currently displayed."}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h3 className="font-bold text-foreground">Enable Banner</h3>
              <p className="text-sm text-muted-foreground">Toggle to show or hide the announcement globally.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={active} onChange={e => setActive(e.target.checked)} />
              <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground">Announcement Message</label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none text-sm"
              placeholder="e.g., Server maintenance scheduled for 12:00 AM EST."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required={active}
            />
          </div>

          {/* Type Selection */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground">Banner Style</label>
            <div className="grid grid-cols-3 gap-3">
              {(Object.entries(typeStyles) as [string, typeof typeStyles.info][]).map(([key, style]) => (
                <button key={key} type="button" onClick={() => setType(key as "info" | "warning" | "success")}
                  className={`p-3 rounded-xl border text-center text-sm font-semibold transition-all ${type === key ? `${style.ring} ring-2 border-transparent` : "border-border hover:bg-muted/30"}`}>
                  <div className={`w-8 h-8 ${style.color} rounded-lg mx-auto mb-2`} />
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="pt-4 border-t border-border flex justify-end">
            <Button type="submit" disabled={isSaving}
              className="bg-primary hover:bg-violet-500 text-white font-bold rounded-xl px-8 h-12 flex items-center gap-2">
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Configuration
            </Button>
          </div>
        </form>
      </div>

      {/* Preview */}
      <div className="opacity-80">
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" /> Live Preview
        </h3>
        {active ? (
          <div className={`p-3.5 text-center text-sm font-medium text-white rounded-xl ${
            type === "info" ? "bg-primary" : type === "warning" ? "bg-orange-500" : "bg-green-500"
          }`}>
            {message || "Your message will appear here..."}
          </div>
        ) : (
          <div className="p-6 border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground">
            Banner is currently inactive / hidden.
          </div>
        )}
      </div>
    </div>
  );
}
