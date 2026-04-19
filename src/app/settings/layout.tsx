import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings | KURA",
  description: "Manage your KURA account settings.",
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
