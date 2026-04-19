"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Wrench, Save, Loader2, AlertTriangle, CheckCircle, Clock, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

export default function AdminMaintenancePage() {
  const [enabled, setEnabled] = useState(false);
  const [message, setMessage] = useState("We're performing scheduled maintenance. KURA will be back shortly!");
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");
  const [allowAdminAccess, setAllowAdminAccess] = useState(true);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "maintenance_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const cfg = docSnap.data();
          setEnabled(cfg.enabled || false);
          setMessage(cfg.message || "");
          setScheduledStart(cfg.scheduledStart || "");
          setScheduledEnd(cfg.scheduledEnd || "");
          setAllowAdminAccess(cfg.allowAdminAccess !== false);
        }
      } catch (error) {
        console.error("Error fetching maintenance config:", error);
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
      const docRef = doc(db, "settings", "maintenance_config");
      await setDoc(docRef, {
        enabled,
        message,
        scheduledStart,
        scheduledEnd,
        allowAdminAccess,
        updatedAt: new Date(),
      }, { merge: true });

      await logAdminAction({
        action: enabled ? "ENABLED_MAINTENANCE" : "DISABLED_MAINTENANCE",
        targetId: "maintenance_config",
        details: `Maintenance mode ${enabled ? "enabled" : "disabled"}. Message: ${message}`,
      });

      alert("Maintenance configuration saved!");
    } catch (error) {
      console.error("Error saving maintenance config:", error);
      alert("Failed to save configuration.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
          <Wrench className="w-7 h-7 text-primary" /> Maintenance Mode
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Toggle maintenance mode to temporarily restrict access during updates or scheduled downtime.
        </p>
      </div>

      {/* Live Status Indicator */}
      <div className={`flex items-center gap-4 p-5 rounded-2xl border ${enabled ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${enabled ? "bg-red-500/10" : "bg-green-500/10"}`}>
          {enabled ? <AlertTriangle className="w-6 h-6 text-red-500" /> : <CheckCircle className="w-6 h-6 text-green-500" />}
        </div>
        <div>
          <h3 className={`text-lg font-bold ${enabled ? "text-red-500" : "text-green-500"}`}>
            {enabled ? "🔴 Maintenance Active" : "🟢 Platform Online"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {enabled ? "Users will see the maintenance page instead of KURA." : "KURA is fully operational and accessible to all users."}
          </p>
        </div>
      </div>

      {/* Configuration Form */}
      <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSave} className="space-y-6">

          {/* Enable Toggle */}
          <div className="flex items-center justify-between border-b border-border pb-6">
            <div>
              <h3 className="font-bold text-foreground">Enable Maintenance Mode</h3>
              <p className="text-sm text-muted-foreground mt-0.5">When enabled, regular users cannot access the platform.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={enabled} onChange={e => setEnabled(e.target.checked)} />
              <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500" />
            </label>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> Maintenance Message
            </label>
            <textarea
              className="w-full bg-background border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px] resize-none text-sm"
              placeholder="Enter the message users will see..."
              value={message}
              onChange={e => setMessage(e.target.value)}
              required={enabled}
            />
          </div>

          {/* Scheduled Window */}
          <div className="space-y-3">
            <label className="text-sm font-bold text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-500" /> Scheduled Downtime Window
            </label>
            <p className="text-xs text-muted-foreground">Optional: Set a planned maintenance window for informational purposes.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground font-medium">Start Time</label>
                <input
                  type="datetime-local"
                  value={scheduledStart}
                  onChange={e => setScheduledStart(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground font-medium">End Time</label>
                <input
                  type="datetime-local"
                  value={scheduledEnd}
                  onChange={e => setScheduledEnd(e.target.value)}
                  className="w-full mt-1 bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>

          {/* Admin Access */}
          <div className="flex items-center justify-between border-t border-border pt-6">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-violet-500" />
              <div>
                <h3 className="font-bold text-foreground text-sm">Allow Admin Access</h3>
                <p className="text-xs text-muted-foreground">Admins can still access KURA during maintenance.</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={allowAdminAccess} onChange={e => setAllowAdminAccess(e.target.checked)} />
              <div className="w-12 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
            </label>
          </div>

          {/* Save */}
          <div className="flex justify-end pt-4 border-t border-border">
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
        <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">User Preview</h3>
        {enabled ? (
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <div className="bg-amber-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wrench className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-xl font-outfit font-black text-foreground mb-2">Under Maintenance</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-4">
              {message || "We're performing scheduled maintenance."}
            </p>
            {scheduledEnd && (
              <p className="text-xs text-muted-foreground">
                Expected to be back: <span className="text-foreground font-medium">{new Date(scheduledEnd).toLocaleString()}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="p-6 border border-dashed border-border rounded-2xl text-center text-sm text-muted-foreground">
            Maintenance mode is disabled. Users see the normal KURA platform.
          </div>
        )}
      </div>
    </div>
  );
}
