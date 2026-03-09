import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export type ActivityType = "REVIEW_GAME" | "RATE_GAME" | "WISHLIST_ADD" | "LIBRARY_ADD";

interface LogActivityParams {
  userId: string;
  userName: string;
  userImage: string;
  type: ActivityType;
  gameId: number | string;
  gameName: string;
  gameSlug: string;
  gameImage: string;
  rating?: number;
  reviewText?: string;
  libraryStatus?: string;
}

export async function logActivity(params: LogActivityParams) {
  try {
    const activityData = {
      ...params,
      createdAt: serverTimestamp(),
    };
    await addDoc(collection(db, "activities"), activityData);
  } catch (error) {
    console.error("Failed to log social activity:", error);
  }
}
