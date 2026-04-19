import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Leaderboard | KURA",
  description: "Top gamers and community members on KURA.",
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
