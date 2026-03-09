import Link from "next/link";
import { Code2, Key, Zap, ArrowRight } from "lucide-react";

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

export default function ApiDocsPage() {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <div className="mb-2">
        <Link href="/docs" className="text-sm text-muted-foreground hover:text-violet-500 transition-colors">← Documentation</Link>
      </div>
      <h1 className="text-4xl font-outfit font-black text-foreground mb-3 mt-4">API Reference</h1>
      <p className="text-muted-foreground mb-8 max-w-xl">
        KURA is powered by the <a href="https://rawg.io/apidocs" className="text-violet-500 hover:underline" target="_blank" rel="noopener noreferrer">RAWG API</a>.
        You can integrate the same data into your own projects.
      </p>

      {/* API Key setup */}
      <div className="bg-card border border-border rounded-2xl p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Key className="w-5 h-5 text-violet-500" />
          <h2 className="font-bold text-foreground">Authentication</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          All requests require an API key. Add it as a query parameter:
        </p>
        <div className="bg-black/10 dark:bg-white/5 rounded-xl p-3 font-mono text-sm text-foreground border border-border">
          GET https://api.rawg.io/api/games?key=<span className="text-violet-400">YOUR_API_KEY</span>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Get your free API key at{" "}
          <a href="https://rawg.io/apidocs" className="text-violet-500 hover:underline" target="_blank" rel="noopener noreferrer">rawg.io/apidocs</a>
        </p>
      </div>

      {/* Base URL */}
      <div className="bg-violet-500/5 border border-violet-500/20 rounded-xl p-4 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-4 h-4 text-violet-500" />
          <span className="text-sm font-bold text-foreground">Base URL</span>
        </div>
        <code className="text-sm text-violet-400 font-mono">https://api.rawg.io/api</code>
      </div>

      {/* Endpoints */}
      <h2 className="font-bold text-foreground text-xl mb-4 flex items-center gap-2">
        <Code2 className="w-5 h-5 text-violet-500" />
        Endpoints
      </h2>
      <div className="space-y-3">
        {ENDPOINTS.map((ep) => (
          <div key={ep.path} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className={`text-xs font-bold px-2 py-0.5 rounded border ${METHOD_COLORS[ep.method]}`}>
                {ep.method}
              </span>
              <code className="text-sm font-mono text-foreground">{ep.path}</code>
            </div>
            <p className="text-sm text-muted-foreground">{ep.desc}</p>
            {ep.params && (
              <div className="mt-2 bg-black/5 dark:bg-white/5 rounded-lg px-3 py-1.5">
                <code className="text-xs text-violet-400 font-mono">{ep.params}</code>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Rate limits */}
      <div className="mt-8 bg-card border border-border rounded-2xl p-5">
        <h3 className="font-bold text-foreground mb-2">Rate Limits</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-violet-500">20,000</p>
            <p className="text-xs text-muted-foreground">requests / month (free)</p>
          </div>
          <div className="bg-black/5 dark:bg-white/5 rounded-xl p-3 text-center">
            <p className="text-2xl font-black text-violet-500">Unlimited</p>
            <p className="text-xs text-muted-foreground">with premium plan</p>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <Link href="/docs/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Features</Link>
        <Link href="/docs/privacy" className="flex items-center gap-1 text-sm text-violet-500 hover:underline font-semibold">
          Next: Privacy & Security <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
