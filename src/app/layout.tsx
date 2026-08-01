import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Miami New Development | Pre-Construction Condos & Luxury New Construction",
  description:
    "Explore Miami's best pre-construction condos and new developments. Market intelligence, floor plans, pricing, and private presentations from a top-ranked Miami luxury real estate advisor."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
