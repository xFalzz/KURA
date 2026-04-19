import { Code2, Key, Zap, Shield, HelpCircle, Star, Globe, Gamepad2 } from "lucide-react";

const ENDPOINTS = [
  { method: "GET", path: "/api/games", desc: "List all games with optional filters (ordering, platform, genre, year)", params: "?ordering=-rating&platform=4&page_size=20" },
  { method: "GET", path: "/api/games/{id}", desc: "Get details for a specific game by ID or slug", params: "?key=YOUR_KEY" },
  { method: "GET", path: "/api/games/{id}/screenshots", desc: "Get official screenshots for a game", params: "" },
  { method: "GET", path: "/api/genres", desc: "List all game genres with icons", params: "" },
  { method: "GET", path: "/api/platforms", desc: "List all gaming platforms", params: "" },
  { method: "GET", path: "/api/games/lists/greatest", desc: "All time top 250 greatest games", params: "" },
];

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-500 border-green-500/30",
  POST: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  DELETE: "bg-red-500/10 text-red-500 border-red-500/30",
};

export default function DocsPage() {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-muted/20 border-b border-border py-20 px-4">
        <div className="max-w-[1000px] mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-outfit font-black text-foreground mb-6">
            Explore KURA & <br /> RAWG Video Games Database API
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed mb-10">
            KURA is the largest video game database and discovery service powered by RAWG. 
            We are sharing our 897,000+ games, search, and library management tools with the world.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#getting-started" className="px-8 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all text-lg w-full sm:w-auto shadow-lg shadow-violet-500/20">
              Read Documentation
            </a>
            <a href="https://rawg.io/apidocs" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-foreground text-background hover:opacity-90 rounded-2xl font-bold transition-opacity text-lg w-full sm:w-auto">
              Get RAWG API Key
            </a>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="max-w-[1000px] mx-auto px-4 py-16 space-y-24">

        {/* 1. Getting Started */}
        <section id="getting-started" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-violet-500" />
            </div>
            <h2 className="text-3xl font-outfit font-black text-foreground">Getting Started</h2>
          </div>
          <div className="prose prose-invert max-w-none text-muted-foreground leading-relaxed space-y-6">
            <p>
              Welcome to KURA! To get the most out of the platform, you should create a free account.
              This allows you to save games to your library, write reviews, and build custom collections.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 my-8">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-xs">1</span>
                  Create Account
                </h3>
                <p className="text-sm">Sign up using your email and choose a unique username.</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-xs">2</span>
                  Build Library
                </h3>
                <p className="text-sm">Search for your favorite games and add them to your library or wishlist.</p>
              </div>
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground mb-2 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center text-xs">3</span>
                  Rate & Review
                </h3>
                <p className="text-sm">Share your thoughts with the community by writing reviews.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Features */}
        <section id="features" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <h2 className="text-3xl font-outfit font-black text-foreground">Features</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-violet-500/30 transition-colors">
              <Gamepad2 className="w-8 h-8 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Massive Database</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Powered by RAWG, access information on over 897,000+ games across 100+ platforms.
                Find release dates, Metacritic scores, and official screenshots.
              </p>
            </div>
            <div className="bg-card border border-border rounded-2xl p-6 hover:border-violet-500/30 transition-colors">
              <Globe className="w-8 h-8 text-violet-500 mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">Social Discovery</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Follow other users, read community reviews, and see what&apos;s currently trending
                in the gaming world through our curated lists.
              </p>
            </div>
          </div>
        </section>

        {/* 3. API Reference */}
        <section id="api" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Code2 className="w-6 h-6 text-blue-500" />
            </div>
            <h2 className="text-3xl font-outfit font-black text-foreground">RAWG API Reference</h2>
          </div>
          <p className="text-muted-foreground mb-8">
            KURA uses the RAWG API. You can build your own applications using the same data.
          </p>

          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Key className="w-5 h-5 text-violet-500" />
              <h3 className="font-bold text-foreground text-xl">Authentication</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              All API requests require an API key to be passed as a query parameter.
            </p>
            <div className="bg-background rounded-xl p-4 font-mono text-sm text-foreground border border-border flex flex-col sm:flex-row sm:items-center gap-2">
              <span className="text-green-500 font-bold">GET</span>
              <span className="break-all">https://api.rawg.io/api/games?key=<span className="text-violet-400">YOUR_API_KEY</span></span>
            </div>
          </div>

          <h3 className="font-bold text-foreground text-xl mb-4">Endpoints</h3>
          <div className="space-y-4">
            {ENDPOINTS.map((ep) => (
              <div key={ep.path} className="bg-card border border-border rounded-xl p-5 hover:border-violet-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${METHOD_COLORS[ep.method]}`}>
                    {ep.method}
                  </span>
                  <code className="text-sm font-mono text-foreground font-bold">{ep.path}</code>
                </div>
                <p className="text-sm text-muted-foreground">{ep.desc}</p>
                {ep.params && (
                  <div className="mt-3 bg-background border border-border rounded-lg px-4 py-2">
                    <code className="text-xs text-violet-400 font-mono">{ep.params}</code>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* 4. FAQ */}
        <section id="faq" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <HelpCircle className="w-6 h-6 text-orange-500" />
            </div>
            <h2 className="text-3xl font-outfit font-black text-foreground">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-4">
            {[
              { q: "Is KURA free to use?", a: "Yes, KURA is completely free. You can create an account, track your games, and write reviews without any cost." },
              { q: "Where does the game data come from?", a: "All game data, including metadata and images, is provided by the RAWG Video Games Database API." },
              { q: "Can I use the API for commercial projects?", a: "According to RAWG's terms of service, free API keys are for non-commercial use only. You must purchase a commercial license from RAWG for commercial projects." },
              { q: "How do I report a bug or feature request?", a: "You can use the 'Report an Issue' link in the footer to submit feedback directly to the KURA development team." },
            ].map((faq, i) => (
              <div key={i} className="bg-card border border-border rounded-2xl p-6">
                <h3 className="font-bold text-foreground text-lg mb-2">{faq.q}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 5. Privacy */}
        <section id="privacy" className="scroll-mt-24">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-green-500" />
            </div>
            <h2 className="text-3xl font-outfit font-black text-foreground">Privacy & Security</h2>
          </div>
          <div className="bg-card border border-border rounded-2xl p-8 prose prose-invert max-w-none">
            <h3 className="text-foreground mt-0">Data Collection</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              We only collect the information necessary to provide you with the KURA service. This includes your email address (for authentication), username, and any content you explicitly submit to the platform (reviews, lists, collections).
            </p>
            <h3 className="text-foreground">Authentication</h3>
            <p className="text-muted-foreground text-sm leading-relaxed">
              KURA uses Google Firebase for authentication. Your passwords are never stored in plain text, and we do not have access to your raw password data.
            </p>
            <h3 className="text-foreground">Data Sharing</h3>
            <p className="text-muted-foreground text-sm leading-relaxed mb-0">
              We do not sell your personal data to third parties. Public interactions (like reviews and ratings) are visible to other users on the platform.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
