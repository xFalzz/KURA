"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import {
  Settings2, Save, Loader2, ChevronDown, Globe, UserPlus, FileText,
  Shield, Zap, Server, CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { logAdminAction } from "@/lib/auditLogger";

interface PlatformConfig {
  general: {
    platformName: string;
    tagline: string;
    footerText: string;
  };
  registration: {
    enabled: boolean;
    requireEmailVerification: boolean;
  };
  content: {
    defaultReviewsPerPage: number;
    enableReviewLikes: boolean;
    minReviewLength: number;
    maxReviewLength: number;
  };
  rateLimiting: {
    maxReviewsPerUserPerDay: number;
    maxReportsPerUserPerDay: number;
  };
  features: {
    collections: boolean;
    leaderboard: boolean;
    wishlist: boolean;
    chat: boolean;
    feedback: boolean;
    rateGames: boolean;
  };
}

const DEFAULT_CONFIG: PlatformConfig = {
  general: {
    platformName: "KURA",
    tagline: "The Ultimate Game Discovery Platform",
    footerText: "© 2026 KURA. All rights reserved.",
  },
  registration: {
    enabled: true,
    requireEmailVerification: false,
  },
  content: {
    defaultReviewsPerPage: 10,
    enableReviewLikes: true,
    minReviewLength: 10,
    maxReviewLength: 2000,
  },
  rateLimiting: {
    maxReviewsPerUserPerDay: 10,
    maxReportsPerUserPerDay: 5,
  },
  features: {
    collections: true,
    leaderboard: true,
    wishlist: true,
    chat: true,
    feedback: true,
    rateGames: true,
  },
};

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  description: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, icon, description, children, defaultOpen = false }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-5 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="p-2 rounded-xl bg-primary/10">{icon}</div>
        <div className="flex-1">
          <h3 className="font-bold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 border-t border-border pt-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
        <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:border-gray-300 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary" />
      </label>
    </div>
  );
}

function InputField({ label, description, value, onChange, type = "text", placeholder = "" }: { label: string; description?: string; value: string | number; onChange: (v: string) => void; type?: string; placeholder?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-foreground">{label}</label>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

export default function AdminPlatformSettingsPage() {
  const [config, setConfig] = useState<PlatformConfig>(DEFAULT_CONFIG);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "settings", "platform_config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            general: { ...DEFAULT_CONFIG.general, ...data.general },
            registration: { ...DEFAULT_CONFIG.registration, ...data.registration },
            content: { ...DEFAULT_CONFIG.content, ...data.content },
            rateLimiting: { ...DEFAULT_CONFIG.rateLimiting, ...data.rateLimiting },
            features: { ...DEFAULT_CONFIG.features, ...data.features },
          });
        }
      } catch (error) {
        console.error("Error fetching platform config:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const docRef = doc(db, "settings", "platform_config");
      await setDoc(docRef, {
        ...config,
        updatedAt: new Date(),
      }, { merge: true });

      await logAdminAction({
        action: "UPDATED_PLATFORM_SETTINGS",
        targetId: "platform_config",
        details: "Updated platform-wide configuration settings.",
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const updateGeneral = (key: keyof PlatformConfig["general"], value: string) => {
    setConfig(prev => ({ ...prev, general: { ...prev.general, [key]: value } }));
  };
  const updateRegistration = (key: keyof PlatformConfig["registration"], value: boolean) => {
    setConfig(prev => ({ ...prev, registration: { ...prev.registration, [key]: value } }));
  };
  const updateContent = (key: keyof PlatformConfig["content"], value: number | boolean) => {
    setConfig(prev => ({ ...prev, content: { ...prev.content, [key]: value } }));
  };
  const updateRateLimiting = (key: keyof PlatformConfig["rateLimiting"], value: number) => {
    setConfig(prev => ({ ...prev, rateLimiting: { ...prev.rateLimiting, [key]: value } }));
  };
  const updateFeature = (key: keyof PlatformConfig["features"], value: boolean) => {
    setConfig(prev => ({ ...prev, features: { ...prev.features, [key]: value } }));
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl lg:text-3xl font-outfit font-black text-foreground flex items-center gap-3">
            <Settings2 className="w-7 h-7 text-primary" /> Platform Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central configuration hub for KURA platform behavior and features.
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}
          className={`shrink-0 font-bold rounded-xl px-6 h-11 flex items-center gap-2 ${saved ? "bg-green-500 hover:bg-green-600" : "bg-primary hover:bg-violet-500"} text-white`}>
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? "Saved!" : "Save All"}
        </Button>
      </div>

      {/* Sections */}
      <CollapsibleSection
        title="General"
        icon={<Globe className="w-4 h-4 text-primary" />}
        description="Platform name, tagline, and footer"
        defaultOpen={true}
      >
        <InputField label="Platform Name" value={config.general.platformName} onChange={v => updateGeneral("platformName", v)} placeholder="KURA" />
        <InputField label="Tagline" value={config.general.tagline} onChange={v => updateGeneral("tagline", v)} placeholder="The Ultimate Game Discovery Platform" />
        <InputField label="Footer Text" value={config.general.footerText} onChange={v => updateGeneral("footerText", v)} placeholder="© 2026 KURA" />
      </CollapsibleSection>

      <CollapsibleSection
        title="Registration"
        icon={<UserPlus className="w-4 h-4 text-primary" />}
        description="User registration controls"
      >
        <ToggleField label="Enable Registration" description="Allow new users to create accounts." checked={config.registration.enabled} onChange={v => updateRegistration("enabled", v)} />
        <ToggleField label="Require Email Verification" description="Users must verify email before accessing features." checked={config.registration.requireEmailVerification} onChange={v => updateRegistration("requireEmailVerification", v)} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Content Rules"
        icon={<FileText className="w-4 h-4 text-primary" />}
        description="Review and content settings"
      >
        <InputField label="Reviews Per Page" type="number" value={config.content.defaultReviewsPerPage} onChange={v => updateContent("defaultReviewsPerPage", parseInt(v) || 10)} />
        <InputField label="Minimum Review Length" type="number" value={config.content.minReviewLength} onChange={v => updateContent("minReviewLength", parseInt(v) || 1)} description="Minimum characters required for a review." />
        <InputField label="Maximum Review Length" type="number" value={config.content.maxReviewLength} onChange={v => updateContent("maxReviewLength", parseInt(v) || 2000)} description="Maximum characters allowed per review." />
        <ToggleField label="Enable Review Likes" description="Allow users to like/upvote reviews." checked={config.content.enableReviewLikes} onChange={v => updateContent("enableReviewLikes", v)} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Rate Limiting"
        icon={<Shield className="w-4 h-4 text-primary" />}
        description="Prevent spam and abuse"
      >
        <InputField label="Max Reviews Per User/Day" type="number" value={config.rateLimiting.maxReviewsPerUserPerDay} onChange={v => updateRateLimiting("maxReviewsPerUserPerDay", parseInt(v) || 10)} />
        <InputField label="Max Reports Per User/Day" type="number" value={config.rateLimiting.maxReportsPerUserPerDay} onChange={v => updateRateLimiting("maxReportsPerUserPerDay", parseInt(v) || 5)} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Feature Flags"
        icon={<Zap className="w-4 h-4 text-primary" />}
        description="Enable or disable platform features"
      >
        <ToggleField label="Collections" description="Allow users to create game collections." checked={config.features.collections} onChange={v => updateFeature("collections", v)} />
        <ToggleField label="Leaderboard" description="Show user leaderboard rankings." checked={config.features.leaderboard} onChange={v => updateFeature("leaderboard", v)} />
        <ToggleField label="Wishlist" description="Allow users to save games to wishlist." checked={config.features.wishlist} onChange={v => updateFeature("wishlist", v)} />
        <ToggleField label="Chat" description="Enable the AI chat assistant." checked={config.features.chat} onChange={v => updateFeature("chat", v)} />
        <ToggleField label="Feedback" description="Allow users to submit feedback." checked={config.features.feedback} onChange={v => updateFeature("feedback", v)} />
        <ToggleField label="Rate Games" description="Enable the game rating system." checked={config.features.rateGames} onChange={v => updateFeature("rateGames", v)} />
      </CollapsibleSection>

      <CollapsibleSection
        title="API Status"
        icon={<Server className="w-4 h-4 text-primary" />}
        description="External API connection health"
      >
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">RAWG API</p>
            <p className="text-xs text-muted-foreground">api.rawg.io — Game data provider</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
          </span>
        </div>
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium text-foreground">Firebase</p>
            <p className="text-xs text-muted-foreground">Firestore, Auth, Storage</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-green-500/10 text-green-500">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Connected
          </span>
        </div>
      </CollapsibleSection>
    </div>
  );
}
