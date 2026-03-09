import Link from "next/link";
import { Zap, User, BookOpen, Heart, ArrowRight } from "lucide-react";

const STEPS = [
  {
    step: "01",
    icon: <User className="w-5 h-5" />,
    title: "Create your account",
    desc: "Sign up for free using your email and password. No credit card required.",
    detail: (
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>→ Go to <Link href="/register" className="text-violet-500 hover:underline">/register</Link> and fill in your details</li>
        <li>→ Verify your email address</li>
        <li>→ Customize your profile with a display name and bio</li>
      </ul>
    ),
  },
  {
    step: "02",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Build your library",
    desc: "Add games you've played, are playing, or have completed to your personal library.",
    detail: (
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>→ Search for any game using the navbar search bar</li>
        <li>→ Open the game page and click <strong className="text-foreground">Add to Library</strong></li>
        <li>→ Set your play status: Playing, Beaten, Dropped, or Plan to Play</li>
      </ul>
    ),
  },
  {
    step: "03",
    icon: <Heart className="w-5 h-5" />,
    title: "Create a wishlist",
    desc: "Save games you want to buy or try in the future to your wishlist.",
    detail: (
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>→ On any game page, click the heart icon to wishlist it</li>
        <li>→ Access your wishlist from the sidebar or <Link href="/wishlist" className="text-violet-500 hover:underline">here</Link></li>
        <li>→ Share your wishlist with friends via your public profile</li>
      </ul>
    ),
  },
  {
    step: "04",
    icon: <Zap className="w-5 h-5" />,
    title: "Explore & discover",
    desc: "Browse trending, upcoming, and top-rated games. Follow other users to see their picks.",
    detail: (
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        <li>→ Use the sidebar to browse by platform, genre, or release date</li>
        <li>→ Visit the <Link href="/leaderboard" className="text-violet-500 hover:underline">Leaderboard</Link> to see top gamers</li>
        <li>→ Follow users from their profile pages</li>
      </ul>
    ),
  },
];

export default function GettingStartedPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-violet-500 transition-colors">← Documentation</Link>
      </div>
      <h1 className="text-4xl font-outfit font-black text-foreground mb-3 mt-4">Getting Started</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">Get KURA set up in minutes. Follow these steps to start tracking your gaming journey.</p>

      <div className="space-y-6">
        {STEPS.map((s, i) => (
          <div key={i} className="flex gap-5 bg-card border border-border rounded-2xl p-5">
            <div className="shrink-0">
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500">
                {s.icon}
              </div>
              <p className="text-center text-xs font-black text-violet-500/50 mt-1">{s.step}</p>
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground text-lg">{s.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{s.desc}</p>
              {s.detail}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back to Docs</Link>
        <Link href="/docs/features" className="flex items-center gap-1 text-sm text-violet-500 hover:underline font-semibold">
          Next: Features <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
