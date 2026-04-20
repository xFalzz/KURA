import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Community | KURA",
  description: "Join the conversation. Share your gaming thoughts with the KURA community.",
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
