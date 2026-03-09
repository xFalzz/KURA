"use client";

import Link from "next/link";
import { Search, Gamepad2, Bell, Plus, LayoutGrid, Sun, Moon, Settings, LogOut, Map, Trophy, Menu, X, BookOpen, FolderOpen, AlertCircle, MessageSquare, Star, ChevronLeft, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useSearchGames } from "@/hooks/useGames";
import { useDebounce } from "@/hooks/useDebounce";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Game } from "@/lib/types";
import { useTheme } from "next-themes";
import Sidebar from "./Sidebar";
import { isAdmin } from "@/lib/admin";

export default function Navbar() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [searchInput, setSearchInput] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlusOpen, setIsPlusOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const plusRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const [activeIndex, setActiveIndex] = useState(-1);
  const debouncedSearch = useDebounce(searchInput, 150);
  const { data: searchResults, isLoading: searchFetching } = useSearchGames(debouncedSearch);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (plusRef.current && !plusRef.current.contains(e.target as Node)) {
        setIsPlusOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && searchResults?.results?.[activeIndex]) {
      handleSelectGame(searchResults.results[activeIndex].slug);
      return;
    }
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
      setIsSearchFocused(false);
      setActiveIndex(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const results = searchResults?.results?.slice(0, 8) || [];
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(prev => (prev < results.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : results.length - 1));
    } else if (e.key === "Escape") {
      setIsSearchFocused(false);
      setActiveIndex(-1);
    }
  };



  const handleSelectGame = (slug: string) => {
    router.push(`/game/${slug}`);
    setSearchInput("");
    setIsSearchFocused(false);
    setActiveIndex(-1);
  };

  const showLoading = searchInput.length > 1 && (searchInput !== debouncedSearch || searchFetching);
  const showDropdown = isSearchFocused && searchInput.length > 1 && (searchResults?.results?.length > 0 || showLoading);

  return (
    <>
      <nav className="sticky top-0 z-60 w-full bg-background/95 backdrop-blur-md border-b border-black/10 dark:border-white/10">
        <div className="flex items-center h-16 px-6 gap-4">
          {/* Hamburger Menu (Mobile Only) */}
          <button 
            className="lg:hidden text-foreground p-1 -ml-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md"
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Logo */}
        <Link href="/" className={`flex items-center gap-2 shrink-0 mr-2 ${isMobileSearchOpen ? 'hidden sm:flex' : ''}`}>
          <Gamepad2 className="w-7 h-7 text-violet-500 dark:text-violet-400" />
          <span className="font-outfit text-xl font-black tracking-tighter text-foreground">
            KURA
          </span>
        </Link>

        {/* Search bar - takes most of the space. Shown as expanding overlay on xs, inline on sm+ */}
        <div ref={searchRef} className={`flex-1 max-w-4xl relative ${isMobileSearchOpen ? 'block' : 'hidden sm:block'}`}>
          <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full">
            {isMobileSearchOpen && (
              <button 
                type="button" 
                onClick={() => {
                  setIsMobileSearchOpen(false);
                  setSearchInput("");
                  setIsSearchFocused(false);
                }}
                className="sm:hidden p-2 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full shrink-0"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            <div className="relative flex-1">
              <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isMobileSearchOpen ? 'text-violet-500' : 'text-muted-foreground'}`} />
              <input
                ref={(input) => {
                  if (input && isMobileSearchOpen) {
                    input.focus();
                  }
                }}
                type="text"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); }}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => {
                  // Small delay to allow clicking results before closing
                  setTimeout(() => setIsSearchFocused(false), 200);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search 897,000+ games..."
                className="w-full pl-10 pr-16 h-11 bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 border border-transparent rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-background focus:border-border transition-all"
                autoComplete="off"
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-1 text-muted-foreground text-xs opacity-60">
                <span className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-[10px] font-medium">alt</span>
                <span className="text-[10px]">+</span>
                <span className="px-1.5 py-0.5 bg-black/10 dark:bg-white/10 rounded text-[10px] font-medium">enter</span>
              </kbd>
            </div>
          </form>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full mt-2 w-full bg-card border border-border rounded-2xl overflow-hidden shadow-2xl z-50"
              >
                {showLoading && (!searchResults?.results?.length) ? (
                  <div className="flex items-center justify-center py-8 gap-2">
                    <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">Searching...</span>
                  </div>
                ) : (
                  <>
                    {searchResults?.results?.slice(0, 8).map((game: Game, idx: number) => (
                      <button
                        key={game.id}
                        onClick={() => handleSelectGame(game.slug)}
                        onMouseEnter={() => setActiveIndex(idx)}
                        className={`flex items-center gap-3 w-full px-4 py-2.5 transition-colors text-left ${
                          activeIndex === idx
                            ? "bg-violet-500/10 text-foreground"
                            : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`}
                      >
                        {/* Cover thumbnail */}
                        <div className="w-12 h-8 rounded-lg overflow-hidden shrink-0 bg-muted">
                          {game.background_image && (
                            <Image src={game.background_image} alt={game.name} width={48} height={32} className="object-cover w-full h-full" />
                          )}
                        </div>
                        {/* Name + genres */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-foreground font-semibold line-clamp-1">{game.name}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {game.genres?.map((g) => g.name).join(" · ") || "—"}
                            {game.released ? ` · ${new Date(game.released).getFullYear()}` : ""}
                          </p>
                        </div>
                        {/* Metacritic or rating */}
                        {game.metacritic ? (
                          <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded border shrink-0 ${game.metacritic >= 75 ? "text-green-500 border-green-500/30" : game.metacritic >= 50 ? "text-yellow-500 border-yellow-500/30" : "text-red-500 border-red-500/30"}`}>
                            {game.metacritic}
                          </span>
                        ) : game.rating ? (
                          <span className="ml-auto text-xs text-muted-foreground shrink-0 flex items-center gap-0.5">
                            ⭐ {game.rating.toFixed(1)}
                          </span>
                        ) : null}
                      </button>
                    ))}
                    {/* Footer: see all */}
                    <div className="px-4 py-2.5 border-t border-border flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {searchResults?.count?.toLocaleString() || 0} results found
                      </span>
                      <button
                        onClick={() => { router.push(`/search?q=${encodeURIComponent(debouncedSearch)}`); setIsSearchFocused(false); }}
                        className="text-xs text-violet-500 hover:text-violet-400 transition-colors font-semibold"
                      >
                        See all results →
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right side - hidden when mobile search is active */}
        <div className={`flex items-center gap-1 sm:gap-2 ml-auto shrink-0 ${isMobileSearchOpen ? 'hidden sm:flex' : ''}`}>
          {/* Mobile search button — only shown on xs */}
          <button
            onClick={() => setIsMobileSearchOpen(true)}
            className="sm:hidden p-2 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-zinc-500 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 w-8"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Toggle Theme"
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
          </Button>

          {/* Rate Top Games — always visible */}
          <Link href="/rate/thebest">
            <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 hover:text-yellow-500 hover:bg-yellow-500/10 h-8 px-3 text-sm font-medium transition-colors">
              <Star className="w-3.5 h-3.5 fill-current" />
              Rate Games
            </Button>
          </Link>

          {/* Docs — always visible */}
          <Link href="/docs">
            <Button variant="ghost" size="sm" className="hidden md:flex text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 px-3 text-sm font-medium">
              Docs
            </Button>
          </Link>

          {user ? (
            <>
              <Link href="/library">
                <Button variant="ghost" size="sm" className="hidden sm:flex text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 px-3 text-sm font-medium">
                  <LayoutGrid className="w-4 h-4 mr-1.5" />
                  My Library
                </Button>
              </Link>
              <Link href="/notifications">
                <Button variant="ghost" size="icon" className="hidden sm:inline-flex text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 w-8" title="Notifications">
                  <Bell className="w-4 h-4" />
                </Button>
              </Link>
              {/* Plus dropdown */}
              <div className="relative" ref={plusRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 dark:text-zinc-400 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 w-8"
                  title="Add"
                  onClick={() => setIsPlusOpen(!isPlusOpen)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <AnimatePresence>
                  {isPlusOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-10 w-56 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50"
                    >
                      <div className="py-1">
                        <button
                          onClick={() => { router.push("/library"); setIsPlusOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <BookOpen className="w-4 h-4 text-violet-500" />
                          Add a game to Library
                        </button>
                        <button
                          onClick={() => { router.push("/search"); setIsPlusOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                          Add a missing game
                        </button>
                        <button
                          onClick={() => { router.push("/collections"); setIsPlusOpen(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
                        >
                          <FolderOpen className="w-4 h-4 text-blue-500" />
                          Start a new collection
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="flex items-center gap-2 pl-2 border-l border-border relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex items-center gap-2 group outline-none"
                >
                  <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-xs font-bold text-white shadow-sm ring-2 ring-transparent group-hover:ring-violet-500/50 transition-all">
                    {user.displayName?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                  </div>
                </button>
                
                {/* Avatar Dropdown Menu */}
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 10 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-3 w-56 bg-card border border-border rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.2)] overflow-hidden z-50 flex flex-col py-1"
                    >
                      <div className="px-4 py-3 border-b border-border flex flex-col gap-0.5">
                        <span className="text-sm font-bold text-foreground truncate max-w-full">
                          {user.displayName || "User"}
                        </span>
                        <span className="text-xs text-muted-foreground truncate max-w-full">
                          {user.email}
                        </span>
                      </div>
                      
                      <div className="py-1">
                        <Link href="/settings" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Settings className="w-4 h-4 text-muted-foreground" />
                          Settings
                        </Link>
                        <Link href="/leaderboard" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Trophy className="w-4 h-4 text-muted-foreground" />
                          Leaderboard
                        </Link>
                        
                        {isAdmin() && (
                          <Link href="/admin" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-violet-500 hover:bg-violet-500/10 transition-colors font-medium">
                            <ShieldAlert className="w-4 h-4 text-violet-500" />
                            Admin Panel
                          </Link>
                        )}

                        <Link href="/sitemap/a" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <Map className="w-4 h-4 text-muted-foreground" />
                          Sitemap
                        </Link>
                        <Link href="/feedback" className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-foreground hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <MessageSquare className="w-4 h-4 text-muted-foreground" />
                          Feedback
                        </Link>
                      </div>
                      
                      <div className="border-t border-border py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 h-8 px-4 text-sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-violet-600 hover:bg-violet-500 text-white h-8 px-4 text-sm font-medium rounded-lg shadow-none border-0 transition-colors">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>

    {/* Mobile Sidebar Overlay */}
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-60 bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-70 w-64 bg-background border-r border-border lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between h-14 px-4 border-b border-border shrink-0">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsMobileMenuOpen(false)}>
                <Gamepad2 className="w-6 h-6 text-violet-500" />
                <span className="font-outfit text-lg font-black tracking-tighter text-foreground">
                  KURA
                </span>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/5 rounded-md transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2">
              <Sidebar />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
}
