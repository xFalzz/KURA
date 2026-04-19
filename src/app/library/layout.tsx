import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Library | KURA",
  description: "View and manage your video game library on KURA.",
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
