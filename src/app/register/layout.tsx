import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Register | KURA",
  description: "Create a new KURA account.",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
