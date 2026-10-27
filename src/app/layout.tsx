import type { Metadata } from "next";
import { CompareFloatingBar } from "@/src/components/CompareFloatingBar";
import { ImageFallbackProvider } from "@/src/components/ImageFallbackProvider";
import LenisProvider from "@/src/components/LenisProvider";
import { WhatsAppButton } from "@/src/components/WhatsAppButton";
import { ContactClickTracker } from "@/src/components/ContactClickTracker";
import { InquiryProvider } from "@/src/features/inquiry/components/inquiry-provider";
import { Toaster } from "sonner";
import "mapbox-gl/dist/mapbox-gl.css";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zakers23-website-2t4d.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  referrer: "no-referrer",
  title: {
    default: "Miami New Development | Pre-Construction Condos & Luxury Waterfront Estates",
    template: "%s | Zachary Akers",
  },
  description:
    "Explore Miami's finest pre-construction condos, new developments, and luxury waterfront estates. Market intelligence, floor plans, and private presentations from Zachary Akers, ONE Sotheby's International Realty.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Miami New Development & Luxury Waterfront Estates | Zachary Akers",
    description:
      "Explore Miami's best pre-construction condos and luxury waterfront estates. Pricing, floor plans, and private presentations with Zachary Akers, ONE Sotheby's International Realty.",
    url: siteUrl,
    siteName: "Miami New Development | Zachary Akers",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/images/anantara/aerial-helipad-day.webp",
        width: 1200,
        height: 630,
        alt: "Miami Luxury Real Estate & New Developments",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Miami New Development | Zachary Akers",
    description: "Miami's finest luxury waterfront estates and pre-construction developments.",
    images: ["/images/anantara/aerial-helipad-day.webp"],
  },
  icons: {
    icon: [
      { url: "/images/Favicon/favicon.ico" },
      { url: "/images/Favicon/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/images/Favicon/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/images/Favicon/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/images/Favicon/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/images/Favicon/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      {
        rel: "icon",
        url: "/images/Favicon/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  },
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
        <ContactClickTracker />
        <Toaster
          position="top-right"
          richColors
          closeButton
          theme="light"
        />
      </body>
    </html>
  );
}
