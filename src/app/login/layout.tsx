import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log In | KURA",
  description: "Log in to your KURA account.",
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
