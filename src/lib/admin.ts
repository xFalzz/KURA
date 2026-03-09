import { auth } from "@/lib/firebase";

/**
 * Check if the currently logged-in user is an Admin
 * by comparing their email to the environment variable.
 */
export const isAdmin = (): boolean => {
  const currentUser = auth.currentUser;
  
  if (!currentUser) return false;

  const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
  
  // Optional: Also check UID if provided for extra security
  // const adminUid = process.env.NEXT_PUBLIC_ADMIN_UID;
  // if (adminUid && currentUser.uid !== adminUid) return false;

  return adminEmail !== undefined && currentUser.email === adminEmail;
};
