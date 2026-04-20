import Link from "next/link";
import { Gamepad2, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* Glowing 404 */}
        <div className="relative mb-8">
          <h1 className="text-[120px] sm:text-[160px] font-outfit font-black text-transparent bg-clip-text bg-linear-to-b from-violet-500 to-violet-900 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 blur-3xl bg-violet-500/20 rounded-full -z-10" />
        </div>

        {/* Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <Gamepad2 className="w-8 h-8 text-violet-500" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-outfit font-black text-foreground mb-3">
          Page Not Found
        </h2>
        <p className="text-muted-foreground text-sm sm:text-base mb-8 leading-relaxed">
          Looks like this page got lost in the game world. 
          The URL you entered doesn&apos;t exist or has been moved.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm rounded-xl transition-all w-full sm:w-auto justify-center shadow-lg shadow-violet-500/20"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/search"
            className="flex items-center gap-2 px-6 py-3 bg-card border border-border hover:border-violet-500/30 text-foreground font-bold text-sm rounded-xl transition-all w-full sm:w-auto justify-center"
          >
            <Search className="w-4 h-4" />
            Search Games
          </Link>
        </div>
      </div>
    </div>
  );
}
