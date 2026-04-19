import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Notifications | KURA",
  description: "View your KURA notifications.",
};

export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
