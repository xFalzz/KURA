"use client";

import { useState } from "react";
import { MessageSquare, Bug, Lightbulb, Star, Send, CheckCircle, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

type FeedbackType = "general" | "bug" | "feature" | "review";

const FEEDBACK_TYPES: { id: FeedbackType; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  { id: "general", label: "General Feedback", icon: <MessageSquare className="w-5 h-5" />, desc: "General thoughts or comments about KURA", color: "text-violet-500" },
  { id: "bug", label: "Bug Report", icon: <Bug className="w-5 h-5" />, desc: "Something isn't working the way it should", color: "text-red-500" },
  { id: "feature", label: "Feature Request", icon: <Lightbulb className="w-5 h-5" />, desc: "An idea or improvement you'd love to see", color: "text-yellow-500" },
  { id: "review", label: "Rate KURA", icon: <Star className="w-5 h-5" />, desc: "Tell us how we're doing overall", color: "text-green-500" },
];

const CATEGORIES = ["Search & Discovery", "Library & Wishlist", "Collections", "Reviews", "Profile & Social", "Notifications", "UI / Design", "Performance", "Authentication", "API / Data", "Other"];

const RATINGS = [
  { value: 1, emoji: "😞", label: "Very Poor" },
  { value: 2, emoji: "😐", label: "Poor" },
  { value: 3, emoji: "🙂", label: "Okay" },
  { value: 4, emoji: "😊", label: "Good" },
  { value: 5, emoji: "🤩", label: "Excellent" },
];

export default function FeedbackPage() {
  const [type, setType] = useState<FeedbackType>("general");
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!title.trim()) e.title = "Please enter a title";
    if (!message.trim()) e.message = "Please enter a message";
    if (type === "review" && rating === 0) e.rating = "Please select a rating";
    if (message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, "feedback"), {
        type,
        category,
        title,
        message,
        rating: type === "review" ? rating : null,
        email: email || "Anonymous",
        createdAt: serverTimestamp(),
        status: "new"
      });
      setSubmitted(true);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const inputCls = "w-full bg-black/5 dark:bg-white/5 border border-transparent hover:bg-black/8 dark:hover:bg-white/8 focus:bg-background focus:border-border rounded-xl px-4 py-3 text-sm text-foreground transition-all outline-none focus:ring-2 focus:ring-violet-500/30 placeholder:text-muted-foreground";

  if (submitted) {
    return (
      <div className="px-6 py-16 max-w-2xl mx-auto flex flex-col items-center text-center gap-5">
        <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-500" />
        </div>
        <div>
          <h1 className="text-3xl font-outfit font-black text-foreground mb-2">Thank you!</h1>
          <p className="text-muted-foreground">
            Your feedback has been received. We review every submission and use it to improve KURA.
          </p>
        </div>
        <button
          onClick={() => { setSubmitted(false); setTitle(""); setMessage(""); setRating(0); setCategory(""); setEmail(""); setErrors({}); }}
          className="px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Submit another
        </button>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 py-8 sm:py-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-11 h-11 rounded-2xl bg-violet-500/10 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-outfit font-black text-foreground">Feedback</h1>
            <p className="text-muted-foreground text-sm">Help us make KURA better</p>
          </div>
        </div>
        <p className="text-sm text-muted-foreground max-w-lg">
          We read every piece of feedback. Whether it&apos;s a bug, a feature request, or just a thought — your input shapes KURA&apos;s future.
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7">
        {FEEDBACK_TYPES.map((ft) => (
          <button
            key={ft.id}
            onClick={() => setType(ft.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border text-center transition-all ${
              type === ft.id
                ? "bg-violet-500/10 border-violet-500/40 shadow-inner"
                : "bg-card border-border hover:border-violet-500/20"
            }`}
          >
            <div className={ft.color}>{ft.icon}</div>
            <span className={`text-xs font-semibold leading-tight ${type === ft.id ? "text-foreground" : "text-muted-foreground"}`}>
              {ft.label}
            </span>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Rating (only for review type) */}
        {type === "review" && (
          <div>
            <label className="text-sm font-medium text-muted-foreground block mb-2">Overall Rating *</label>
            <div className="grid grid-cols-5 sm:flex sm:gap-3 gap-1.5">
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRating(r.value)}
                  className={`flex flex-col items-center gap-1 px-1 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl border transition-all ${
                    rating === r.value ? "bg-violet-500/10 border-violet-500/40" : "bg-card border-border hover:border-violet-500/20"
                  }`}
                >
                  <span className="text-xl sm:text-2xl">{r.emoji}</span>
                  <span className="text-[9px] sm:text-xs text-muted-foreground font-medium text-center leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
            {errors.rating && <p className="text-xs text-red-500 mt-1">{errors.rating}</p>}
          </div>
        )}

        {/* Category */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Category</label>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={inputCls + " appearance-none cursor-pointer pr-10"}
            >
              <option value="">Select a category (optional)</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              type === "bug" ? "e.g. Search bar not working on mobile" :
              type === "feature" ? "e.g. Add dark mode for game pages" :
              type === "review" ? "e.g. Amazing platform!" :
              "Short summary of your feedback"
            }
            className={inputCls}
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
        </div>

        {/* Message */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">
            {type === "bug" ? "Describe the bug & steps to reproduce" :
             type === "feature" ? "Describe the feature in detail" :
             type === "review" ? "Share your experience" :
             "Your message"} *
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
            placeholder={
              type === "bug"
                ? "1. Go to...\n2. Click on...\n3. Expected: ...\n4. Actual: ..."
                : "Tell us as much detail as you'd like..."
            }
            className={inputCls + " resize-y min-h-[120px]"}
          />
          <div className="flex justify-between mt-1">
            {errors.message ? <p className="text-xs text-red-500">{errors.message}</p> : <span />}
            <span className={`text-xs ${message.length > 2000 ? "text-red-500" : "text-muted-foreground"}`}>{message.length}/2000</span>
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="text-sm font-medium text-muted-foreground block mb-2">Email (optional)</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com — if you'd like a response"
            className={inputCls}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition-all"
        >
          {submitting ? (
            <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending...</>
          ) : (
            <><Send className="w-4 h-4" /> Send Feedback</>
          )}
        </button>

        <p className="text-xs text-center text-muted-foreground">
          By submitting, you agree that your feedback may be used to improve KURA.
        </p>
      </form>
    </div>
  );
}
