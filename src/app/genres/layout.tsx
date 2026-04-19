import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Genres | KURA",
  description: "Browse games by genre.",
};

export default function GenresLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
