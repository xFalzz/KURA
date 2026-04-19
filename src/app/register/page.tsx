"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gamepad2, Mail, Lock, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { usePlatformConfig } from "@/contexts/PlatformConfigContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const { config, isLoading: isConfigLoading } = usePlatformConfig();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Initialize user document in Firestore for Wishlist
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name,
        email,
        createdAt: new Date().toISOString()
      });

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Failed to create account.");
      } else {
        setError("Failed to create account.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError("");
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      
      // We can also ensure user doc exists here, but usually it's fine just to create it if needed later
      await setDoc(doc(db, "users", userCredential.user.uid), {
        name: userCredential.user.displayName,
        email: userCredential.user.email,
        lastLogin: new Date().toISOString()
      }, { merge: true });

      router.push("/");
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message || "Google sign in failed.");
      } else {
        setError("Google sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (isConfigLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!config.registration.enabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border border-border rounded-3xl p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-black font-outfit text-foreground mb-3">Registration Closed</h1>
          <p className="text-muted-foreground mb-8 leading-relaxed">
            New user registration is currently disabled by the platform administrator. Please try again later.
          </p>
          <Link href="/login" className="block w-full">
            <Button className="w-full bg-primary hover:bg-violet-600 text-white font-bold rounded-xl h-12">
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background">
      {/* Left Panel - Visuals (Hidden on Mobile) */}
      <div className="hidden lg:flex relative w-1/2 bg-black flex-col justify-between overflow-hidden">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-50"
          style={{ backgroundImage: "url('/auth-bg.png')" }}
        />
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-transparent" />
        
        {/* Top Content */}
        <div className="relative z-10 p-12">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-white/80 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            <span className="font-medium">Back to Home</span>
          </Link>
        </div>

        {/* Bottom Content */}
        <div className="relative z-10 p-12 mt-auto">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center text-white mb-6 shadow-lg shadow-violet-500/20">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-outfit font-black text-white mb-4 leading-tight">
            Start Building Your<br />Ultimate Library.
          </h1>
          <p className="text-white/60 text-lg max-w-md">
            Unlock all KURA features completely free. Add games to your wishlist, track your backlog, and write reviews.
          </p>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto max-h-screen">
        {/* Mobile Back Button (Only visible when Left Panel is hidden) */}
        <div className="absolute top-6 left-6 lg:hidden z-20">
          <Link href="/" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Back to Home
          </Link>
        </div>

        <div className="w-full max-w-md mx-auto py-8">
          <div className="mb-8 text-center lg:text-left">
            <div className="lg:hidden w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 mb-6 mx-auto">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h2 className="text-3xl font-outfit font-bold text-foreground mb-2">Create Account</h2>
            <p className="text-muted-foreground">Join KURA to track your games.</p>
          </div>

          {error && (
            <div className="p-4 mb-6 border border-red-500/20 bg-red-500/10 text-red-500 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-4 mb-6">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  required
                  placeholder="Full Name"
                  className="pl-12 h-12 bg-muted/50 border-border focus-visible:ring-violet-500 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  required
                  placeholder="Email address"
                  className="pl-12 h-12 bg-muted/50 border-border focus-visible:ring-violet-500 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  required
                  placeholder="Password"
                  className="pl-12 h-12 bg-muted/50 border-border focus-visible:ring-violet-500 rounded-xl"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full bg-violet-600 hover:bg-violet-500 text-white font-bold h-12 rounded-xl transition-all"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Sign Up"}
            </Button>
          </form>

          <div className="relative flex items-center mb-6">
            <div className="grow border-t border-border"></div>
            <span className="shrink-0 mx-4 text-muted-foreground text-xs font-semibold uppercase tracking-wider">Or continue with</span>
            <div className="grow border-t border-border"></div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={handleGoogleLogin}
            className="w-full bg-card hover:bg-muted/50 border-border h-12 rounded-xl mb-8 font-medium transition-colors"
            disabled={loading}
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Google
          </Button>

          <p className="text-center text-muted-foreground text-sm">
            Already have an account?{" "}
            <Link href="/login" className="text-violet-500 hover:underline font-bold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
