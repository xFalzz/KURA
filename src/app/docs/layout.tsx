import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Documentation | KURA",
  description: "Read the KURA API and platform documentation.",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
