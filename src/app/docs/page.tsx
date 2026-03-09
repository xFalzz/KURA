import Link from "next/link";
import { BookOpen, Code2, Zap, Shield, HelpCircle, ArrowRight, Star, Globe, Gamepad2 } from "lucide-react";

const DOC_SECTIONS = [
  {
    href: "/docs/getting-started",
    icon: <Zap className="w-6 h-6 text-violet-500" />,
    title: "Getting Started",
    desc: "Learn how to create your account, set up your profile, and start tracking your game library.",
    badge: "Start here",
    badgeColor: "bg-violet-500",
  },
  {
    href: "/docs/features",
    icon: <Star className="w-6 h-6 text-yellow-500" />,
    title: "Features",
    desc: "Explore KURA's full feature set — library management, wishlists, reviews, collections, and more.",
    badge: null,
  },
  {
    href: "/docs/api",
    icon: <Code2 className="w-6 h-6 text-blue-500" />,
    title: "API Reference",
    desc: "Integrate KURA's game data into your own projects using our REST API.",
    badge: "Developers",
    badgeColor: "bg-blue-500",
  },
  {
    href: "/docs/privacy",
    icon: <Shield className="w-6 h-6 text-green-500" />,
    title: "Privacy & Security",
    desc: "Learn how we protect your data, what we store, and how to manage your privacy settings.",
    badge: null,
  },
  {
    href: "/docs/faq",
    icon: <HelpCircle className="w-6 h-6 text-orange-500" />,
    title: "FAQ",
    desc: "Frequently asked questions about KURA, game tracking, data sources, and account management.",
    badge: null,
  },
];

export default function DocsPage() {
  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-violet-500" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-outfit font-black text-foreground">Documentation</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Everything you need to know about KURA</p>
          </div>
        </div>
        <p className="text-muted-foreground max-w-2xl leading-relaxed">
          KURA is a game discovery and tracking platform powered by RAWG&apos;s database of over 897,000 games.
          Whether you&apos;re a casual gamer, a collector, or a developer, this documentation will help you get the most out of KURA.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-12">
        {[
          { icon: <Gamepad2 className="w-5 h-5" />, label: "897,000+", sub: "Games indexed" },
          { icon: <Globe className="w-5 h-5" />, label: "100+", sub: "Platforms supported" },
          { icon: <Star className="w-5 h-5" />, label: "Free", sub: "No subscription" },
        ].map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 flex items-center gap-3">
            <div className="text-violet-500">{s.icon}</div>
            <div>
              <p className="font-black text-foreground">{s.label}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Doc sections grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {DOC_SECTIONS.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group bg-card border border-border hover:border-violet-500/40 rounded-2xl p-6 transition-all hover:shadow-lg hover:shadow-violet-500/5"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center">
                {section.icon}
              </div>
              {section.badge && (
                <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${section.badgeColor}`}>
                  {section.badge}
                </span>
              )}
            </div>
            <h2 className="font-bold text-foreground text-lg mb-1 group-hover:text-violet-500 transition-colors">
              {section.title}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{section.desc}</p>
            <div className="flex items-center gap-1 mt-4 text-xs text-violet-500 font-semibold">
              Read more <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>

      {/* Bottom note */}
      <div className="mt-10 p-5 bg-violet-500/5 border border-violet-500/20 rounded-2xl">
        <p className="text-sm text-foreground font-semibold mb-1">💡 Something missing?</p>
        <p className="text-xs text-muted-foreground">
          Can&apos;t find what you&apos;re looking for? Browse our{" "}
          <Link href="/docs/faq" className="text-violet-500 hover:underline">FAQ</Link> or{" "}
          <Link href="/docs/api" className="text-violet-500 hover:underline">contact support</Link>.
          KURA data is sourced from the{" "}
          <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">RAWG API</a>.
        </p>
      </div>
    </div>
  );
}
