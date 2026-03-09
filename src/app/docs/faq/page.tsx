import Link from "next/link";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    q: "Is KURA free to use?",
    a: "Yes, KURA is completely free. There are no subscription plans or premium tiers right now. All features including library tracking, wishlists, collections, and social follow are free.",
  },
  {
    q: "Where does the game data come from?",
    a: "All game data — titles, cover images, ratings, release dates, genres, and platforms — is sourced from the RAWG API, which maintains a database of over 897,000 games across all platforms.",
  },
  {
    q: "Can I track games from any platform?",
    a: "Yes. KURA supports tracking games from PC, PlayStation, Xbox, Nintendo Switch, iOS, Android, macOS, Linux, and many more platforms available in the RAWG database.",
  },
  {
    q: "How do I add a game to my library?",
    a: "Search for any game using the search bar in the top navigation. Open the game's page and click 'Add to Library'. You can then set its status (Playing, Beaten, Dropped, Plan to Play).",
  },
  {
    q: "What's the difference between Library and Wishlist?",
    a: "Library is for games you own or have played. Wishlist is for games you want to buy or play in the future. They are completely separate lists, each accessible from the sidebar.",
  },
  {
    q: "How do I follow another user?",
    a: "Visit another user's public profile page and click the Follow button. Their library, collections, and reviews will appear on your profile's Following tab.",
  },
  {
    q: "Can I change my password?",
    a: "Yes. Go to Settings → My password. You'll need to enter your current password to confirm your identity before setting a new one.",
  },
  {
    q: "How do I link my Steam or PSN account?",
    a: "Go to Settings → Gaming profiles. Enter your username or ID for each platform (Steam, PSN, Xbox, Epic Games, GOG, Battle.net, Nintendo). These will appear on your public profile.",
  },
  {
    q: "Is there a mobile app?",
    a: "KURA is a fully responsive web application and works well on mobile browsers. A dedicated native app is planned for a future release.",
  },
  {
    q: "Why can't I find a specific game?",
    a: "KURA relies on the RAWG database. If a game was recently released or is very obscure, it may not be in our index yet. RAWG updates its database continuously.",
  },
  {
    q: "How do I report an inappropriate review?",
    a: "Click the flag icon next to any review to submit a report. Our moderation team will review the content and take appropriate action.",
  },
  {
    q: "How do I report a bug or request a feature?",
    a: "Use the Feedback option in your account dropdown menu, or reach out via email. We actively review all feedback to improve KURA.",
  },
];

export default function FAQPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-violet-500 transition-colors">← Documentation</Link>
      </div>
      <h1 className="text-4xl font-outfit font-black text-foreground mb-3 mt-4">FAQ</h1>
      <p className="text-muted-foreground mb-10 max-w-xl">Frequently asked questions about KURA, game tracking, and account management.</p>

      <div className="space-y-3">
        {FAQS.map((faq, i) => (
          <details key={i} className="group bg-card border border-border rounded-2xl overflow-hidden">
            <summary className="flex items-center gap-3 px-5 py-4 cursor-pointer list-none hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <HelpCircle className="w-4 h-4 text-violet-500 shrink-0" />
              <span className="font-semibold text-foreground text-sm flex-1">{faq.q}</span>
              <span className="text-muted-foreground text-lg group-open:rotate-45 transition-transform">+</span>
            </summary>
            <div className="px-5 pb-4 pt-0">
              <div className="pl-7 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                {faq.a}
              </div>
            </div>
          </details>
        ))}
      </div>

      <div className="mt-8 p-5 bg-card border border-border rounded-2xl">
        <p className="text-sm font-bold text-foreground mb-1">Still have questions?</p>
        <p className="text-xs text-muted-foreground">
          Browse the full{" "}
          <Link href="/docs" className="text-violet-500 hover:underline">documentation</Link> or
          check the RAWG{" "}
          <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer" className="text-violet-500 hover:underline">API docs</a>{" "}
          for data-related questions.
        </p>
      </div>

      <div className="mt-8">
        <Link href="/docs/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Privacy & Security</Link>
      </div>
    </div>
  );
}
