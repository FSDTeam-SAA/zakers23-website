import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Miami Developments",
  description: "Compare Miami luxury pre-construction developments side by side.",
  alternates: { canonical: "/compare" },
  openGraph: { url: "/compare" },
};

export default function CompareLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
