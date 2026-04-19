import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wishlist | KURA",
  description: "Games you want to play.",
};

export default function WishlistLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
