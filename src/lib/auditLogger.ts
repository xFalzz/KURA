import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

interface LogActionParams {
  action: string;
  targetId: string;
  details: string;
}

/**
 * Utility to record an immutable audit log for any significant admin action.
 */
export async function logAdminAction({ action, targetId, details }: LogActionParams) {
  try {
    const user = auth.currentUser;
    if (!user) return; // Silent fail if somehow not authenticated

    await addDoc(collection(db, "audit_logs"), {
      action,
      adminUid: user.uid,
      adminEmail: user.email || "Unknown",
      targetId,
      details,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Failed to write audit log:", error);
    // We don't throw here to avoid failing the primary action (e.g. banning user)
    // just because the log failed, though in strict enterprise systems you might want to.
  }
}
