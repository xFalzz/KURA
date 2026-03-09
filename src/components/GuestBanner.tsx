"use client";

import Link from "next/link";
import { X, Gamepad2, BookOpen, Heart, Users, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Use reliable image sources that won't have CORS issues
const LEFT_COVERS = [
  { src: "https://upload.wikimedia.org/wikipedia/en/a/a7/Johnwickhex.jpg", w: 78, h: 108, rotate: -4 },
  { src: "https://upload.wikimedia.org/wikipedia/en/9/9f/Sekiro_art.jpg", w: 62, h: 88, rotate: 3 },
  { src: "https://upload.wikimedia.org/wikipedia/en/4/45/The_Witcher_3_Wild_Hunt.jpg", w: 70, h: 98, rotate: -2 },
  { src: "https://upload.wikimedia.org/wikipedia/en/0/0c/GTA_V_Official_Cover_Art.jpg", w: 60, h: 84, rotate: 2 },
  { src: "https://upload.wikimedia.org/wikipedia/en/4/44/God_of_War_4_cover.jpg", w: 66, h: 92, rotate: -3 },
];

const RIGHT_COVERS = [
  { src: "https://upload.wikimedia.org/wikipedia/en/b/b1/RDR2_Cover_Art.jpg", w: 66, h: 92, rotate: 3 },
  { src: "https://upload.wikimedia.org/wikipedia/en/c/c3/EldenRingCover.jpg", w: 72, h: 100, rotate: -2 },
  { src: "https://upload.wikimedia.org/wikipedia/en/8/8d/Rdr2articleimage.jpg", w: 58, h: 80, rotate: 2 },
  { src: "https://upload.wikimedia.org/wikipedia/en/5/5e/Death_stranding_numskull_cover.jpg", w: 64, h: 90, rotate: -3 },
];

export default function GuestBanner() {
  const [visible, setVisible] = useState(false);
  const [imageErrors, setImageErrors] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) { setVisible(false); return; }
      const dismissed = sessionStorage.getItem("kura_banner_dismissed");
      if (!dismissed) setVisible(true);
    });
    return unsub;
  }, []);

  const dismiss = () => {
    sessionStorage.setItem("kura_banner_dismissed", "1");
    setVisible(false);
  };

  const handleImgError = (src: string) => {
    setImageErrors(prev => ({ ...prev, [src]: true }));
  };

  if (!visible) return null;

  return (
    <div className="relative w-full overflow-hidden" style={{ background: "linear-gradient(135deg, #4c1d95 0%, #6d28d9 35%, #7c3aed 60%, #4338ca 100%)" }}>
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }} />

      {/* Glowing orbs */}
      <div className="absolute top-1/2 left-1/3 -translate-y-1/2 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ background: "radial-gradient(circle, #a78bfa, transparent)" }} />
      <div className="absolute top-1/2 right-1/3 -translate-y-1/2 w-48 h-48 rounded-full opacity-15 blur-3xl" style={{ background: "radial-gradient(circle, #818cf8, transparent)" }} />

      {/* Left floating covers — hide on small screens */}
      <div className="absolute left-0 top-0 h-full items-center pl-4 gap-2 pointer-events-none select-none hidden sm:flex">
        {LEFT_COVERS.map((c, i) => (
          <div
            key={i}
            className="shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/20 transition-all"
            style={{
              width: c.w,
              height: c.h,
              transform: `rotate(${c.rotate}deg) translateY(${i % 2 === 0 ? -4 : 6}px)`,
              opacity: i === 0 ? 0.95 : i === 1 ? 0.80 : i === 2 ? 0.70 : i === 3 ? 0.55 : 0.40,
              zIndex: LEFT_COVERS.length - i,
            }}
          >
            {!imageErrors[c.src] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.src}
                alt=""
                className="w-full h-full object-cover"
                onError={() => handleImgError(c.src)}
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white/30" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Right floating covers — hide on small screens */}
      <div className="absolute right-0 top-0 h-full items-center pr-4 gap-2 pointer-events-none select-none hidden sm:flex flex-row-reverse">
        {RIGHT_COVERS.map((c, i) => (
          <div
            key={i}
            className="shrink-0 rounded-xl overflow-hidden shadow-2xl border border-white/20"
            style={{
              width: c.w,
              height: c.h,
              transform: `rotate(${c.rotate}deg) translateY(${i % 2 === 0 ? 4 : -6}px)`,
              opacity: i === 0 ? 0.90 : i === 1 ? 0.70 : i === 2 ? 0.50 : 0.35,
              zIndex: RIGHT_COVERS.length - i,
            }}
          >
            {!imageErrors[c.src] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={c.src}
                alt=""
                className="w-full h-full object-cover"
                onError={() => handleImgError(c.src)}
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-white/30" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Centre content */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center py-6 sm:py-8 px-4 sm:px-16 lg:px-32">
        {/* Badge */}
        <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm border border-white/20 rounded-full px-3 py-1 mb-4">
          <Gamepad2 className="w-3.5 h-3.5 text-white/80" />
          <span className="text-xs font-bold text-white/90 tracking-wide uppercase">KURA</span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-outfit font-black text-white mb-2 tracking-tight drop-shadow-lg">
          Discover your next{" "}
          <span className="text-yellow-300">favorite game</span>
        </h2>
        <p className="text-white/70 text-xs sm:text-sm mb-4 sm:mb-5 max-w-xs sm:max-w-sm leading-relaxed">
          Track your library, build wishlists, write reviews, and follow friends — all free, forever.
        </p>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-1.5 sm:gap-2 mb-4 sm:mb-6">
          {[
            { icon: <BookOpen className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Track library" },
            { icon: <Heart className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Save favorites" },
            { icon: <Users className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Follow friends" },
            { icon: <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5" />, label: "Write reviews" },
          ].map((f) => (
            <div key={f.label} className="flex items-center gap-1 sm:gap-1.5 bg-white/10 backdrop-blur-sm border border-white/15 rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-white/85 font-medium">
              {f.icon}
              {f.label}
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
          <Link
            href="/register"
            className="group flex items-center gap-2 px-6 sm:px-7 py-2.5 bg-white text-violet-700 font-bold text-sm rounded-full hover:bg-yellow-300 hover:text-violet-900 transition-all duration-200 shadow-xl shadow-black/20 w-full sm:w-auto justify-center"
          >
            Sign up — it&apos;s free
          </Link>
          <Link
            href="/login"
            className="px-5 sm:px-6 py-2 sm:py-2.5 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white font-semibold text-sm rounded-full border border-white/25 transition-all duration-200 w-full sm:w-auto text-center"
          >
            Log in
          </Link>
        </div>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss banner"
        className="absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 border border-white/20 flex items-center justify-center transition-all duration-150 hover:scale-110"
      >
        <X className="w-4 h-4 text-white" />
      </button>
    </div>
  );
}
