import Link from "next/link";
import { BookOpen, Heart, FolderOpen, Users, Star, Bell, Settings, ArrowRight } from "lucide-react";

const FEATURES = [
  {
    icon: <BookOpen className="w-5 h-5 text-violet-500" />,
    title: "My Library",
    desc: "Track every game you've ever played. Categorize by status: Playing, Beaten, Dropped, or Plan to Play. View stats and progress on your profile.",
    link: "/library",
  },
  {
    icon: <Heart className="w-5 h-5 text-red-500" />,
    title: "Wishlist",
    desc: "Save games you want to play in the future. Separate from your library, the wishlist keeps your 'want to play' list organized and shareable.",
    link: "/wishlist",
  },
  {
    icon: <FolderOpen className="w-5 h-5 text-blue-500" />,
    title: "Collections",
    desc: "Group games into themed collections like 'Best Horror Games' or 'Cozy Farming Sims'. Share collections with the community.",
    link: "/collections",
  },
  {
    icon: <Star className="w-5 h-5 text-yellow-500" />,
    title: "Reviews",
    desc: "Write detailed reviews for any game in KURA's database. Rate games, share your thoughts, and read reviews from the community.",
    link: "/reviews",
  },
  {
    icon: <Users className="w-5 h-5 text-green-500" />,
    title: "Social & Timeline",
    desc: "Follow other gamers to see their libraries, collections, and reviews. View a real-time Social Activity Feed (Timeline) on your homepage showing what your friends are playing and reviewing.",
    link: "/following",
  },
  {
    icon: <Bell className="w-5 h-5 text-orange-500" />,
    title: "Notifications",
    desc: "Stay up-to-date with new releases, trending games, and updates. Customize what you get notified about in Settings.",
    link: "/notifications",
  },
  {
    icon: <Settings className="w-5 h-5 text-muted-foreground" />,
    title: "Account Settings",
    desc: "Manage your display name, bio, gaming profile links (Steam, PSN, Xbox), notification preferences, and password.",
    link: "/settings",
  },
];

export default function FeaturesPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-violet-500 transition-colors">← Documentation</Link>
      </div>
      <h1 className="text-4xl font-outfit font-black text-foreground mb-3 mt-4">Features</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">A full overview of everything KURA offers to help you track, discover, and enjoy games.</p>

      <div className="space-y-4">
        {FEATURES.map((f) => (
          <Link
            key={f.title}
            href={f.link}
            className="group flex gap-4 bg-card border border-border hover:border-violet-500/30 rounded-2xl p-5 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center shrink-0">
              {f.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-foreground group-hover:text-violet-500 transition-colors">{f.title}</h2>
              <p className="text-sm text-muted-foreground mt-1">{f.desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-violet-500 transition-colors self-center shrink-0" />
          </Link>
        ))}
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Link href="/docs/getting-started" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Getting Started</Link>
        <Link href="/docs/api" className="flex items-center gap-1 text-sm text-violet-500 hover:underline font-semibold">
          Next: API Reference <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
