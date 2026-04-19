import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Social Hub | KURA",
  description: "See what games your friends are playing and reviewing.",
};

export default function FollowingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
