"use client";

import Image from "next/image";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

export function AdvisorSection() {
  const { openInquiry } = useInquiry();
  return (
    <section className="bg-[var(--sand)] px-5 py-14 md:px-8 md:py-20" id="advisor">
      <div className="mx-auto grid max-w-[1180px] grid-cols-1 items-center gap-10 lg:grid-cols-[380px_minmax(0,1fr)] lg:gap-14">
        {/* Left: Professional Portrait */}
        <div className="relative mx-auto w-full max-w-[360px] lg:max-w-[380px] overflow-hidden rounded-[6px] shadow-sm border border-[#e2dcd0] lg:mx-0">
          <div className="relative aspect-[0.78/1] bg-[#d9d1c5]">
            <Image
              fill
              src="/images/imagereader.webp"
              alt="Zachary Akers"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 380px"
              priority
            />
          </div>
        </div>

        {/* Right: Refined, Organized Editorial Content */}
        <div className="flex flex-col justify-center">
          <div>
            <div className="mb-3 flex items-center gap-3">
              <span className="h-px w-6 bg-[#c2a36a]" />
              <span className="text-[11px] uppercase tracking-[0.3em] text-[#8f96ab] font-medium">
                A Different Kind of Advisor
              </span>
            </div>

            <h2
              className="m-0 text-[36px] font-normal leading-[1.05] tracking-[-0.02em] text-[#182235] md:text-[48px]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Zachary Akers
            </h2>

            <p className="mt-2 text-[12px] uppercase tracking-[0.24em] text-[#b89354] font-medium">
              ONE Sotheby&apos;s International Realty
            </p>

            <p
              className="mt-4 text-[15px] leading-[1.7] text-[#2d3550] max-w-[40rem]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Zachary is a veteran of 14 years in the real estate industry working both in sales, as well as luxury new-construction and development. Zachary is adept at understanding the relationship between investment and emotional connection to your property. With vast experience working with homeowners from all walks of life and backgrounds, he understands that no home buyer or seller is the same, but they all want results. Zachary will help you purchase or sell your property seamlessly and with integrity.
            </p>
          </div>

          {/* Key Credentials Strip */}
          <div className="grid grid-cols-2 gap-4 border-y border-[#ddd8cd] py-4 my-5 max-w-[40rem]">
            <div>
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8f96ab] font-medium block mb-1">
                Track Record
              </span>
              <p
                className="m-0 text-[18px] md:text-[22px] font-normal text-[#182235]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                Hundreds of millions sold.
              </p>
            </div>
            <div className="border-l border-[#ddd8cd] pl-4">
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#8f96ab] font-medium block mb-1">
                Industry Experience
              </span>
              <p
                className="m-0 text-[18px] md:text-[22px] font-normal text-[#182235]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                14+ Years in Miami
              </p>
            </div>
          </div>

          {/* Contact Links & Action Buttons */}
          <div className="flex flex-col gap-4 max-w-[40rem]">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-[#182235]">
              <a
                href="tel:3053435371"
                className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#b89354]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b89354]" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>305.343.5371</span>
              </a>

              <a
                href="mailto:Zakers@onesothebysrealty.com"
                className="inline-flex items-center gap-2 transition-colors duration-200 hover:text-[#b89354]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b89354]" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <span>Zakers@onesothebysrealty.com</span>
              </a>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-1">
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  openInquiry();
                }}
                className="inline-flex min-h-[44px] flex-1 items-center justify-center bg-[#bb9751] px-6 py-3.5 text-center text-[12px] uppercase tracking-[0.25em] font-medium text-white transition-colors duration-200 hover:bg-[#a88543] focus:outline-none rounded-[2px]"
              >
                Connect With Zachary
              </a>
              <a
                href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20connect%20regarding%20Miami%20luxury%20real%20estate."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-[#25D366] px-6 py-3.5 text-center text-[12px] uppercase tracking-[0.2em] font-semibold text-white transition-all duration-200 hover:brightness-105 rounded-[2px]"
              >
                <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
                  <path d="M12.031 2C6.495 2 2 6.49 2 12.022c0 1.765.46 3.488 1.332 5.002L2 22l5.127-1.343a10.007 10.007 0 0 0 4.904 1.277h.004c5.535 0 10.03-4.49 10.03-10.022A10.015 10.015 0 0 0 12.031 2zm0 18.358h-.003a8.318 8.318 0 0 1-4.24-1.16l-.304-.18-3.148.825.84-3.067-.198-.315a8.307 8.307 0 0 1-1.274-4.439c0-4.593 3.738-8.33 8.33-8.33a8.293 8.293 0 0 1 5.889 2.441 8.292 8.292 0 0 1 2.438 5.892c0 4.593-3.738 8.333-8.33 8.333zm4.568-6.236c-.25-.125-1.48-.73-1.71-.813-.23-.083-.396-.125-.563.125-.166.25-.646.813-.792.98-.145.166-.291.187-.541.062a6.85 6.85 0 0 1-2.016-1.243 7.55 7.55 0 0 1-1.393-1.733c-.146-.25-.015-.385.11-.51.112-.112.25-.291.375-.437.125-.146.166-.25.25-.417.083-.166.041-.312-.021-.437-.062-.125-.563-1.354-.77-1.854-.202-.488-.408-.422-.563-.43l-.479-.008c-.166 0-.437.062-.666.312-.23.25-.875.855-.875 2.084 0 1.23.896 2.417 1.02 2.584.125.166 1.762 2.69 4.269 3.771.596.257 1.062.41 1.425.526.6.19 1.144.163 1.575.099.48-.072 1.48-.605 1.688-1.188.208-.584.208-1.084.146-1.188-.063-.105-.229-.167-.479-.292z" />
                </svg>
                <span>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

