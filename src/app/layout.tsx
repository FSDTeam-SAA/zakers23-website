import type { Metadata } from "next";
import { CompareFloatingBar } from "@/src/components/CompareFloatingBar";
import { ImageFallbackProvider } from "@/src/components/ImageFallbackProvider";
import LenisProvider from "@/src/components/LenisProvider";
import { WhatsAppButton } from "@/src/components/WhatsAppButton";
import { InquiryProvider } from "@/src/features/inquiry/components/inquiry-provider";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  referrer: "no-referrer",
  title: "Miami New Development | Pre-Construction Condos & Luxury New Construction",
  description:
    "Explore Miami's best pre-construction condos and new developments. Market intelligence, floor plans, pricing, and private presentations from a top-ranked Miami luxury real estate advisor."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ImageFallbackProvider />
        <LenisProvider>
          <InquiryProvider>
            {children}
          </InquiryProvider>
        </LenisProvider>
        <CompareFloatingBar />
        <WhatsAppButton />
      </body>
    </html>
  );
}
