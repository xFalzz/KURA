import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platforms | KURA",
  description: "Browse games by platform.",
};

export default function PlatformsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
