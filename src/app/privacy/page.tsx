import type { Metadata } from "next";
import Link from "next/link";
import { SiteFooter } from "@/src/features/Home/components/site-footer";

import { Navbar } from "@/src/components/Navbar";

export const metadata: Metadata = {
  title: "Privacy Policy | ONE Sotheby's International Realty",
  description:
    "Privacy Policy and Communication Terms for Zachary Akers and ONE Sotheby's International Realty, including TCPA compliance, SMS terms, and data protection practices.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#faf8f5] text-[#1c1f26] flex flex-col justify-between">
      <Navbar variant="light" />

      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
        <span className="inline-block text-xs uppercase tracking-[0.28em] text-[#a87b31] font-medium mb-3">
          Legal &amp; Compliance
        </span>
        <h1 className="font-serif text-3xl md:text-5xl text-[#1c1f26] mb-6 font-normal">
          Privacy Policy &amp; Terms of Service
        </h1>
        <p className="text-sm text-[#7c8498] mb-10 font-mono">
          Last Updated: October 2026 · ONE Sotheby&apos;s International Realty
        </p>

        <div className="prose prose-slate max-w-none space-y-8 text-[15px] leading-relaxed text-[#4b5563]">
          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">1. Information We Collect</h2>
            <p>
              When you submit inquiries, subscribe to our Miami new development market notes, or interact with our private consultation forms, we collect personal information including your full name, email address, telephone number, property preferences, price budget, and purchase timeline.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">2. TCPA &amp; SMS Communication Consent</h2>
            <p>
              By providing your telephone number and checking the consent box on our inquiry forms, you expressly consent to receive communications, including telephone calls and SMS/text messages (which may include automated dialing systems or conversational messaging), from Zachary Akers and affiliated real estate professionals at ONE Sotheby&apos;s International Realty.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Consent is never a condition of purchase or sale of any real estate property.</li>
              <li>Standard message and data rates may apply depending on your mobile carrier plan.</li>
              <li>You may opt out of SMS communications at any time by replying <strong>STOP</strong> to any received message. For assistance, reply <strong>HELP</strong>.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">3. How We Use and Protect Your Data</h2>
            <p>
              Your personal information is used exclusively to deliver personalized real estate advisory services, send requested floor plans and developer pricing, schedule private property viewings, and respond to your direct inquiries. We do not sell, rent, or trade your personal contact details to third-party data brokers or unaffiliated commercial marketers.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">4. Follow Up Boss &amp; CRM Processing</h2>
            <p>
              Lead inquiries and communication preferences are securely managed in our encrypted CRM platform (Follow Up Boss) with strict role-based access controls and audit trails to guarantee confidentiality and adherence to South Florida real estate privacy regulations.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">5. IDX &amp; MLS Brokerage Disclaimer</h2>
            <p>
              Real estate listing information on this website is provided courtesy of participating brokerages via the Internet Data Exchange (IDX) of BeachesMLS and the Miami Association of Realtors. Listings are subject to prior sale, price change, or withdrawal. All information is deemed reliable but is not guaranteed and should be verified independently.
            </p>
          </section>

          <section>
            <h2 className="font-serif text-2xl text-[#1c1f26] mb-3">6. Contact Us</h2>
            <p>
              If you have any questions regarding this Privacy Policy or wish to modify or remove your information, please contact:
            </p>
            <div className="bg-white border border-[#e2dcd0] p-6 rounded-[4px] mt-4 text-sm text-[#1c1f26]">
              <strong className="block text-base font-serif mb-1">Zachary Akers · Global Real Estate Advisor</strong>
              <span>ONE Sotheby&apos;s International Realty</span><br />
              <span>Email: <a href="mailto:Zakers@onesothebysrealty.com" className="text-[#a87b31] underline">Zakers@onesothebysrealty.com</a></span><br />
              <span>Direct: <a href="tel:3053435371" className="text-[#a87b31] underline">305.343.5371</a></span>
            </div>
          </section>
        </div>
      </div>

      <SiteFooter />
    </main>
  );
}
