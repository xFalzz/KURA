import Link from "next/link";
import { Shield, Database, Eye, Trash2, ArrowRight } from "lucide-react";

const SECTIONS = [
  {
    icon: <Database className="w-5 h-5 text-violet-500" />,
    title: "What data we store",
    items: [
      "Your email address and display name (used for authentication and your public profile)",
      "Your bio and gaming profile usernames (Steam, PSN, Xbox, etc.)",
      "Your library, wishlist, collections, and follow relationships (stored in Firebase Firestore)",
      "Notification preferences",
      "Game data is fetched live from the RAWG API — KURA does not store game metadata itself",
    ],
  },
  {
    icon: <Eye className="w-5 h-5 text-blue-500" />,
    title: "What's public vs private",
    items: [
      "Your display name and avatar are public and visible on your profile",
      "Your library and wishlist are visible to other logged-in users on your profile page",
      "Your email address is never shown publicly",
      "You can control notification settings in Settings → Notifications",
    ],
  },
  {
    icon: <Shield className="w-5 h-5 text-green-500" />,
    title: "How we protect your data",
    items: [
      "Authentication is handled by Firebase Authentication — passwords are never stored in plaintext",
      "All data is transmitted over HTTPS",
      "We use Firebase Firestore with strict security rules — users can only read/write their own data",
      "API keys are stored server-side and never exposed to the browser",
    ],
  },
  {
    icon: <Trash2 className="w-5 h-5 text-red-500" />,
    title: "Deleting your data",
    items: [
      "You can delete your account by contacting support",
      "Deleting your account removes all associated data from Firestore",
      "Game progress and library data cannot be exported currently — this feature is planned",
    ],
  },
];

export default function PrivacyDocsPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-violet-500 transition-colors">← Documentation</Link>
      </div>
      <h1 className="text-4xl font-outfit font-black text-foreground mb-3 mt-4">Privacy & Security</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">
        We believe in being transparent. Here&apos;s exactly what data we collect, what&apos;s public, and how we keep it secure.
      </p>

      <div className="space-y-6">
        {SECTIONS.map((s) => (
          <div key={s.title} className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {s.icon}
              </div>
              <h2 className="font-bold text-foreground text-lg">{s.title}</h2>
            </div>
            <ul className="space-y-2">
              {s.items.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <span className="text-violet-500 mt-0.5 shrink-0">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-violet-500/5 border border-violet-500/20 rounded-2xl p-5">
        <p className="text-sm font-bold text-foreground mb-1">🔒 Firebase & RAWG</p>
        <p className="text-xs text-muted-foreground">
          KURA uses <a href="https://firebase.google.com/" className="text-violet-500 hover:underline" target="_blank" rel="noopener noreferrer">Google Firebase</a> for authentication and data storage,
          and the <a href="https://rawg.io/apidocs" className="text-violet-500 hover:underline" target="_blank" rel="noopener noreferrer">RAWG API</a> for game data.
          Their respective privacy policies also apply to data they process on our behalf.
        </p>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Link href="/docs/api" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← API Reference</Link>
        <Link href="/docs/faq" className="flex items-center gap-1 text-sm text-violet-500 hover:underline font-semibold">
          Next: FAQ <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
