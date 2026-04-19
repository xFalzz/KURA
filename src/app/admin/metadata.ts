import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard | KURA",
  description: "Manage KURA platform.",
};

// Next.js App Router allows multiple layouts, but admin/layout.tsx is already a client component.
// Instead of replacing it, we can create a simple layout wrapper if needed. Wait, we can't have two layouts.
// So I will just create a basic admin layout wrapper in page.tsx if possible. Actually, I'll write it to admin/metadata.ts for reference.
