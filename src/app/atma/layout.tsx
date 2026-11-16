import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ATMA Miami | Aman-Branded Brickell Bay Residences",
  description: "Register for the first release of ATMA Miami pricing and floor plans at 1111 Brickell Bay Drive.",
  alternates: { canonical: "/atma" },
  openGraph: { url: "/atma" },
};

export default function AtmaLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
