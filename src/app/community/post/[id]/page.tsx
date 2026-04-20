import { Metadata } from "next";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { initializeApp, getApps, getApp } from "firebase/app";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

// Initialize standard Firebase app for Server Side fetching
// (Firebase Auth is not needed here, just Firestore reads)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  try {
    const postRef = doc(db, "posts", id);
    const snap = await getDoc(postRef);
    if (!snap.exists()) return { title: "Post Not Found | KURA" };
    
    const data = snap.data();
    const desc = data.text?.slice(0, 160) || "Join the conversation on KURA.";
    
    return {
      title: `${data.userName} on KURA Community`,
      description: desc,
      openGraph: {
        title: `${data.userName} on KURA Community`,
        description: desc,
        type: 'website'
      },
      twitter: {
        card: 'summary',
        title: `${data.userName} on KURA Community`,
        description: desc,
      }
    };
  } catch {
    return { title: "Community Post | KURA" };
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  let postData: { id: string; text?: string; userName?: string; userPhoto?: string } | null = null;

  try {
    const postRef = doc(db, "posts", id);
    const snap = await getDoc(postRef);
    if (snap.exists()) {
      postData = { id: snap.id, ...snap.data() };
    }
  } catch (err) {
    console.error("Error fetching post on server:", err);
  }

  if (!postData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-2xl font-bold mb-2">Post not found or deleted</h1>
        <Link href="/community" className="text-violet-500 hover:underline">
          Return to Community
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 min-h-[80vh]">
      <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Community
      </Link>
      
      {/* 
        To keep it simple and SEO friendly, we just render a static view here.
        If users want to interact, they will go back to the main community feed,
        or we can import the client component if we decouple it from auth contexts.
        But since this is mainly for SEO routing, providing a link back is easiest.
      */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-full bg-violet-600 flex items-center justify-center text-white font-bold shrink-0 overflow-hidden relative">
            {postData.userPhoto ? (
              <Image src={postData.userPhoto || ""} alt="" fill sizes="48px" className="object-cover" />
            ) : (
              postData.userName?.[0]?.toUpperCase() || "U"
            )}
          </div>
          <div>
            <div className="font-bold text-lg text-foreground">{postData.userName}</div>
            <p className="text-base text-foreground/90 whitespace-pre-wrap mt-2 leading-relaxed">
              {postData.text}
            </p>
            <div className="mt-6 border-t border-border/50 pt-4">
              <Link href="/community" className="px-6 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-xl transition-colors inline-block">
                Log in to Reply or Like
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
