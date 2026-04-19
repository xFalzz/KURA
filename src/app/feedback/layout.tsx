import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Feedback | KURA",
  description: "Share your feedback to help us improve KURA.",
};

export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
