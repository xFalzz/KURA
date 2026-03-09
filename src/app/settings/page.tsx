"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import {
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

type TabId = "profile" | "gaming" | "notifications" | "password";

const TABS: { id: TabId; label: string }[] = [
  { id: "profile", label: "Profile" },
  { id: "gaming", label: "Gaming profiles" },
  { id: "notifications", label: "Notifications" },
  { id: "password", label: "My password" },
];

const GAMING_PLATFORMS = [
  { key: "steam", label: "Steam", placeholder: "Your Steam username" },
  { key: "psn", label: "PlayStation Network", placeholder: "Your PSN ID" },
  { key: "xbox", label: "Xbox Gamertag", placeholder: "Your Xbox Gamertag" },
  { key: "epicgames", label: "Epic Games", placeholder: "Your Epic Games username" },
  { key: "gog", label: "GOG", placeholder: "Your GOG username" },
  { key: "battlenet", label: "Battle.net", placeholder: "Your Battle.net ID" },
  { key: "nintendo", label: "Nintendo Switch", placeholder: "Your Nintendo Friend Code" },
];

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("profile");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", error: false });

  // Profile tab
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");

  // Gaming profiles tab
  const [gamingProfiles, setGamingProfiles] = useState<Record<string, string>>({});

  // Notifications tab
  const [notifs, setNotifs] = useState({
    newReleases: true,
    recommendations: true,
    communityActivity: false,
    marketing: false,
  });

  // Password tab
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);
      setDisplayName(u.displayName || "");
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setBio(data.bio || "");
        setGamingProfiles(data.gamingProfiles || {});
        setNotifs(prev => ({ ...prev, ...(data.notifications || {}) }));
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  const showMsg = (text: string, error = false) => {
    setMsg({ text, error });
    setTimeout(() => setMsg({ text: "", error: false }), 3500);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile(user, { displayName });
      await setDoc(doc(db, "users", user.uid), { bio, updatedAt: new Date().toISOString() }, { merge: true });
      showMsg("Profile saved successfully!");
    } catch { showMsg("Failed to save profile.", true); }
    setSaving(false);
  };

  const saveGaming = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { gamingProfiles, updatedAt: new Date().toISOString() }, { merge: true });
      showMsg("Gaming profiles saved!");
    } catch { showMsg("Failed to save.", true); }
    setSaving(false);
  };

  const saveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { notifications: notifs }, { merge: true });
      showMsg("Notification preferences saved!");
    } catch { showMsg("Failed to save.", true); }
    setSaving(false);
  };

  const savePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) { showMsg("Passwords do not match.", true); return; }
    if (newPassword.length < 6) { showMsg("Password must be at least 6 characters.", true); return; }
    setSaving(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      showMsg("Password changed successfully!");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to change password.";
      showMsg(msg.includes("wrong-password") ? "Current password is incorrect." : msg, true);
    }
    setSaving(false);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="w-8 h-8 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const inputCls = "w-full bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/10 dark:hover:bg-white/10 focus:bg-background focus:border-border rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 focus:ring-violet-500/30";
  const labelCls = "text-sm font-medium text-muted-foreground";

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 w-full">
      <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground mb-6 sm:mb-8">Settings</h1>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-border mb-8 overflow-x-auto scrollbar-hide">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`pb-3 px-1 mr-4 text-sm font-medium border-b-2 whitespace-nowrap transition-all ${
              tab === t.id
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* STATUS MESSAGE */}
      {msg.text && (
        <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium ${msg.error ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}>
          {msg.text}
        </div>
      )}

      {/* ─── PROFILE TAB ────────────────────────────────────── */}
      {tab === "profile" && (
        <form onSubmit={saveProfile} className="space-y-6 max-w-2xl">
          <div>
            <p className={labelCls + " mb-3"}>Avatar</p>
            <div className="flex items-center gap-5">
              <div className="w-20 h-20 rounded-full bg-violet-600 flex items-center justify-center text-2xl font-bold text-white shadow-md">
                {displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="text-xs text-muted-foreground">
                <p>PNG, JPG or GIF, max 5MB</p>
                <button type="button" className="mt-1 text-violet-500 hover:underline font-medium">Upload avatar</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="displayName" className={labelCls}>Display Name</label>
              <input id="displayName" type="text" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Display Name" className={inputCls + " mt-2"} />
            </div>
            <div>
              <label htmlFor="bio" className={labelCls}>Bio</label>
              <textarea id="bio" value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell us about yourself..." rows={5} className={inputCls + " mt-2 resize-y"} />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={user?.email || ""} disabled className={inputCls + " mt-2 opacity-50 cursor-not-allowed"} />
            </div>
          </div>

          <button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>
      )}

      {/* ─── GAMING PROFILES TAB ──────────────────────────── */}
      {tab === "gaming" && (
        <form onSubmit={saveGaming} className="space-y-5 max-w-2xl">
          <p className="text-sm text-muted-foreground mb-4">Link your gaming accounts to let others find you across platforms.</p>
          {GAMING_PLATFORMS.map((p) => (
            <div key={p.key}>
              <label className={labelCls}>{p.label}</label>
              <input
                type="text"
                value={gamingProfiles[p.key] || ""}
                onChange={e => setGamingProfiles(prev => ({ ...prev, [p.key]: e.target.value }))}
                placeholder={p.placeholder}
                className={inputCls + " mt-2"}
              />
            </div>
          ))}
          <button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save gaming profiles"}
          </button>
        </form>
      )}

      {/* ─── NOTIFICATIONS TAB ────────────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-5 max-w-2xl">
          <p className="text-sm text-muted-foreground mb-4">Choose what you get notified about.</p>
          {[
            { key: "newReleases" as const, label: "New Releases", desc: "When games you follow are released" },
            { key: "recommendations" as const, label: "Recommendations", desc: "Personalized game suggestions based on your library" },
            { key: "communityActivity" as const, label: "Community Activity", desc: "When people you follow add reviews or collections" },
            { key: "marketing" as const, label: "Marketing & Promotions", desc: "Special offers, platform updates and news" },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 p-4 bg-card border border-border rounded-2xl">
              <div>
                <p className="font-semibold text-foreground text-sm">{label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
              </div>
              <button
                onClick={() => setNotifs(prev => ({ ...prev, [key]: !prev[key] }))}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${notifs[key] ? "bg-violet-600" : "bg-muted"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${notifs[key] ? "left-6" : "left-1"}`} />
              </button>
            </div>
          ))}
          <button onClick={saveNotifications} disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {saving ? "Saving..." : "Save preferences"}
          </button>
        </div>
      )}

      {/* ─── PASSWORD TAB ─────────────────────────────────── */}
      {tab === "password" && (
        <form onSubmit={savePassword} className="space-y-5 max-w-2xl">
          <p className="text-sm text-muted-foreground mb-4">Change your account password. We&apos;ll need to re-verify your identity.</p>
          <div>
            <label className={labelCls}>Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="••••••••" required className={inputCls + " mt-2"} />
          </div>
          <div>
            <label className={labelCls}>New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" required minLength={6} className={inputCls + " mt-2"} />
          </div>
          <div>
            <label className={labelCls}>Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="••••••••" required className={inputCls + " mt-2"} />
          </div>
          <button type="submit" disabled={saving} className="bg-foreground text-background hover:bg-foreground/90 px-8 py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-50">
            {saving ? "Changing..." : "Change password"}
          </button>
        </form>
      )}
    </div>
  );
}
