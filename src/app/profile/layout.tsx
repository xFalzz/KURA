import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Profile | KURA",
  description: "View your gamer profile, stats, and badges.",
};

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
