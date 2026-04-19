"use client";

import { useEffect } from "react";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

/**
 * A silent client-side component that fetches global SEO settings
 * from Firestore and updates the document title and metadata tags.
 * 
 * Note: For a strictly static exported Next.js app, true Server-Side SEO 
 * requires build-time generation or Firebase Admin SDK. 
 * This client approach ensures the title reflects the DB configuration 
 * immediately on load.
 */
export default function ClientSEOWrapper() {
  useEffect(() => {
    const fetchSEO = async () => {
      try {
        const docRef = doc(db, "settings", "seo_config");
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const cfg = docSnap.data();
          
          if (cfg.titleTemplate && document) {
            document.title = cfg.titleTemplate.replace("%s", "Home");
          }

          if (cfg.description && document) {
            let metaDesc = document.querySelector('meta[name="description"]');
            if (!metaDesc) {
              metaDesc = document.createElement('meta');
              metaDesc.setAttribute('name', 'description');
              document.head.appendChild(metaDesc);
            }
            metaDesc.setAttribute('content', cfg.description);
          }

          if (cfg.keywords && document) {
            let metaKeywords = document.querySelector('meta[name="keywords"]');
            if (!metaKeywords) {
              metaKeywords = document.createElement('meta');
              metaKeywords.setAttribute('name', 'keywords');
              document.head.appendChild(metaKeywords);
            }
            metaKeywords.setAttribute('content', cfg.keywords);
          }
        }
      } catch (error) {
        // Silently ignore permission errors (e.g. user not authenticated)
        // This is expected when Firestore rules require auth
        if (error instanceof Error && error.message.includes("Missing or insufficient permissions")) {
          return;
        }
        console.error("Failed to fetch client SEO overrides:", error);
      }
    };

    // Wait for auth state to resolve before attempting Firestore reads
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchSEO();
      }
    });

    return () => unsub();
  }, []);

  return null; // Renders nothing
}
