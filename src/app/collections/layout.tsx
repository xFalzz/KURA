import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collections | KURA",
  description: "Curated game collections from the KURA community.",
};

export default function CollectionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
