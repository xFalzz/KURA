import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reviews | KURA",
  description: "Read the latest game reviews from the community.",
};

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
