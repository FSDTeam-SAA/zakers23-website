import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/src/features/Home/components/site-footer";

export const metadata: Metadata = {
  title: "List Your Property | Seller Valuation & Advisory",
  description:
    "Request a confidential property valuation or contract assignment consultation for your luxury Miami residence with Zachary Akers, ONE Sotheby's International Realty.",
};

export default function FindMyProjectPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#1c1f26] flex flex-col justify-between">
      <header className="border-b border-[#e2dcd0] bg-white/80 backdrop-blur-md px-6 py-4 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-serif text-xl tracking-tight text-[#1c1f26] font-semibold">
            Zachary Akers <span className="text-[#a87b31] font-light">| Advisory</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/map"
              className="text-xs uppercase tracking-[0.2em] text-[#6b7280] hover:text-[#1c1f26] transition-colors font-mono"
            >
              Explore Map
            </Link>
            <Link
              href="/"
              className="text-xs uppercase tracking-[0.2em] bg-[#1c1f26] text-white px-4 py-2 rounded-[2px] hover:bg-[#a87b31] transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <span className="inline-block text-xs uppercase tracking-[0.3em] text-[#a87b31] font-medium mb-3">
          Confidential Valuation &amp; Assignment Advisory
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-[#1c1f26] mb-6 font-normal leading-tight">
          Selling or Assigning Your Miami Luxury Residence?
        </h1>
        <p className="text-base md:text-lg text-[#555a68] leading-relaxed mb-8 max-w-2xl mx-auto">
          Obtain an accurate, real-time valuation based on off-market transactions, active developer absorption, and contract assignment demand across South Florida&apos;s premier waterfront towers.
        </p>

        <div className="bg-white border border-[#e6dfd1] rounded-[6px] p-8 shadow-sm text-left max-w-xl mx-auto mb-10">
          <h2 className="font-serif text-xl text-[#1c1f26] mb-4">Advisory Services Include:</h2>
          <ul className="space-y-3 text-sm text-[#4b5563] mb-8">
            <li className="flex items-start gap-2.5">
              <span className="text-[#a87b31] font-bold">✓</span>
              <span><strong>Pre-Construction Contract Assignments:</strong> Discreet transfer and resale options prior to building delivery.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#a87b31] font-bold">✓</span>
              <span><strong>Waterfront Estate Valuation:</strong> Linear dockage, water depth, and architectural pedigree comps.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-[#a87b31] font-bold">✓</span>
              <span><strong>Global Sotheby&apos;s Network Reach:</strong> Direct access to ultra-high-net-worth buyers worldwide.</span>
            </li>
          </ul>

          <div className="flex flex-col sm:flex-row gap-4">
            <a
              href="mailto:Zakers@onesothebysrealty.com?subject=Property%20Valuation%20%2F%20Assignment%20Request"
              className="flex-1 inline-flex min-h-[44px] items-center justify-center bg-[#a87b31] text-white text-xs uppercase tracking-[0.24em] font-medium py-3 px-6 rounded-[2px] hover:bg-[#8c6523] transition-colors"
            >
              Email Zachary Directly
            </a>
            <a
              href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%20would%20like%20to%20request%20a%20property%20valuation%20or%20assignment%20consultation."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center justify-center bg-[#25D366] text-white text-xs uppercase tracking-[0.2em] font-medium py-3 px-6 rounded-[2px] hover:brightness-105 transition-all"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div className="text-xs text-[#8f96ab]">
          Direct: <a href="tel:3053435371" className="text-[#1c1f26] underline font-medium">305.343.5371</a> · ONE Sotheby&apos;s International Realty
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
