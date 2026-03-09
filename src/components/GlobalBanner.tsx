"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { X, Megaphone } from "lucide-react";

export default function GlobalBanner() {
  const [announcement, setAnnouncement] = useState<{ message: string; active: boolean; type: "info" | "warning" | "success" } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        const docRef = doc(db, "settings", "global_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists() && docSnap.data()?.announcement?.active) {
          const ann = docSnap.data().announcement;
          
          // Check if user previously closed this specific message
          const closedAnnouncements = JSON.parse(localStorage.getItem("closedAnnouncements") || "[]");
          const messageHash = btoa(encodeURIComponent(ann.message)).substring(0, 15); // Simple unique ID based on text
          
          if (!closedAnnouncements.includes(messageHash)) {
            setAnnouncement(ann);
            setIsVisible(true);
          }
        }
      } catch (error) {
        console.error("Error fetching announcement:", error);
      }
    };

    fetchAnnouncement();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    if (announcement?.message) {
      const messageHash = btoa(encodeURIComponent(announcement.message)).substring(0, 15);
      const closedAnnouncements = JSON.parse(localStorage.getItem("closedAnnouncements") || "[]");
      localStorage.setItem("closedAnnouncements", JSON.stringify([...closedAnnouncements, messageHash]));
    }
  };

  if (!isVisible || !announcement) return null;

  const bgColors = {
    info: "bg-violet-600 border-violet-500",
    warning: "bg-orange-600 border-orange-500",
    success: "bg-green-600 border-green-500"
  };

  return (
    <div className={`${bgColors[announcement.type || "info"]} text-white text-sm font-medium border-b relative z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center text-center pr-10 relative">
        <span className="flex items-center gap-2">
          <Megaphone className="w-4 h-4 shrink-0 hidden sm:block" /> 
          {announcement.message}
        </span>
        <button 
          onClick={handleClose}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-black/20 rounded-lg transition-colors"
          aria-label="Dismiss announcement"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
