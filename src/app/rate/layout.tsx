import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Rate Games | KURA",
  description: "Rate the best games you've played and share your thoughts.",
};

export default function RateLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
