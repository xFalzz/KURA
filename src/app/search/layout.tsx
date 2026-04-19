import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Games | KURA",
  description: "Search for your favorite video games.",
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
