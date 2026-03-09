import { Gamepad2 } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-background/80 backdrop-blur-md py-8 mt-12">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
          <Gamepad2 className="w-6 h-6 text-neon-violet" />
          <span className="font-outfit text-xl font-bold text-gradient">
            KURA
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} KURA Video Game Discovery. Built with Next.js & RAWG API.
        </p>

        <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-neon-violet transition-colors">Privacy</Link>
          <Link href="#" className="hover:text-neon-violet transition-colors">Terms</Link>
          <Link href="#" className="hover:text-neon-violet transition-colors">Contact</Link>
        </div>
      </div>
    </footer>
  );
}
