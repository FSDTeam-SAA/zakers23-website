"use client";

import Image from "next/image";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

export function AdvisorSection() {
  const { openInquiry } = useInquiry();
  return (
    <section className="bg-[var(--sand)] px-5 py-14 md:px-7 md:py-20" id="advisor">
      <div className="mx-auto grid max-w-[1140px] grid-cols-1 items-start gap-10 lg:grid-cols-[340px_minmax(0,1fr)] lg:gap-16">
        <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-[8px] shadow-sm lg:mx-0">
          <div className="relative aspect-[0.82/1] bg-[#d9d1c5]">
            <Image
              fill
              src="/images/imagereader.webp"
              alt="Zachary Akers"
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 340px"
            />
          </div>
          {/* <div className="absolute bottom-4 left-4 bg-[rgba(22,30,48,0.92)] px-4 py-2">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white">3× Olympian</span>
          </div> */}
        </div>

        <div className="flex flex-col justify-between pt-1">
          <div>
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-6 bg-[#c2a36a]" />
              <span className="text-[12px] uppercase tracking-[0.34em] text-[#8f96ab]">
                A Different Kind of Advisor
              </span>
            </div>

            <h2
              className="m-0 text-[42px] font-normal leading-[1.02] tracking-[-0.03em] text-[#182235] md:text-[60px]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Zachary Akers
            </h2>

            <p className="mt-3 text-[13px] uppercase tracking-[0.26em] text-[#7c8498]">
              ONE Sotheby&apos;s International Realty
            </p>

            <p
              className="mt-8 max-w-[32rem] text-[16px] leading-[1.72] text-[#2d3550]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
Zachary is a veteran of 14 years in the real estate industry working both in sales, as well as luxury new-construction and development. Zachary is adept at understanding the relationship between investment and emotional connection to your property. With vast experience working with homeowners from all walks of life and backgrounds, he understands that no home buyer or seller is the same, but they all want results. Zachary will help you purchase or sell your property seamlessly and with integrity.
            </p>
          </div>

          <div className="mt-10">
            <div className="mb-4 flex items-center gap-4">
              <span className="h-px w-6 bg-[#c2a36a]" />
              <span className="text-[12px] uppercase tracking-[0.34em] text-[#8f96ab]">
                Proven Performance
              </span>
            </div>

            <div className="border-y border-[#ddd8cd] py-5">
              <p
                className="m-0 text-[22px] font-normal tracking-[-0.01em] text-[#182235] md:text-[26px]"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                Hundreds of millions sold.
              </p>
            </div>

            <div className="flex flex-col gap-4 border-b border-[#ddd8cd] py-4 text-[14px] text-[#182235] sm:flex-row sm:items-center sm:gap-6">
              <a
                href="tel:3053435371"
                className="inline-flex min-h-[44px] items-center gap-2 transition-colors duration-200 hover:text-[#b89354]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b89354]" aria-hidden="true">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                305.343.5371
              </a>
              <a
                href="mailto:Zakers@onesothebysrealty.com"
                className="inline-flex min-h-[44px] items-center gap-2 transition-colors duration-200 hover:text-[#b89354]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#b89354]" aria-hidden="true">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                Zakers@onesothebysrealty.com
              </a>
              <a
                href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20connect%20regarding%20Miami%20luxury%20real%20estate."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-[44px] items-center gap-1.5 font-medium text-[#1c1f26] transition-colors duration-200 hover:text-[#25D366]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-[#25D366]" aria-hidden="true">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.592 2.654-.696c1 .587 1.764.883 2.806.883 3.181 0 5.767-2.587 5.768-5.766.001-3.182-2.585-5.766-5.768-5.766zm9.969 5.766c0 5.514-4.486 10-10 10-1.804 0-3.495-.482-4.962-1.325l-7.038 1.843 1.879-6.862c-.933-1.517-1.479-3.298-1.479-5.206 0-5.514 4.486-10 10-10s10 4.486 10 10z" />
                </svg>
                WhatsApp Direct
              </a>
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <a
                href="#contact"
                onClick={(event) => {
                  event.preventDefault();
                  openInquiry();
                }}
                className="inline-flex min-h-11 flex-1 items-center justify-center bg-[#bb9751] px-6 py-4 text-center text-[12px] uppercase tracking-[0.34em] transition-colors duration-200 hover:bg-[#a88543] focus:outline-none"
                style={{ color: "#ffffff" }}
              >
                Connect With Zachary
              </a>
              <a
                href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20connect%20regarding%20Miami%20luxury%20real%20estate."
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 px-6 py-4 text-center text-[12px] uppercase tracking-[0.24em] font-semibold transition-all duration-200 hover:brightness-105"
                style={{
                  backgroundColor: "#25D366",
                  color: "#ffffff",
                }}
              >
                <span className="flex items-center justify-center" style={{ color: "#ffffff" }}>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12.031 2C6.495 2 2 6.49 2 12.022c0 1.765.46 3.488 1.332 5.002L2 22l5.127-1.343a10.007 10.007 0 0 0 4.904 1.277h.004c5.535 0 10.03-4.49 10.03-10.022A10.015 10.015 0 0 0 12.031 2zm0 18.358h-.003a8.318 8.318 0 0 1-4.24-1.16l-.304-.18-3.148.825.84-3.067-.198-.315a8.307 8.307 0 0 1-1.274-4.439c0-4.593 3.738-8.33 8.33-8.33a8.293 8.293 0 0 1 5.889 2.441 8.292 8.292 0 0 1 2.438 5.892c0 4.593-3.738 8.333-8.33 8.333zm4.568-6.236c-.25-.125-1.48-.73-1.71-.813-.23-.083-.396-.125-.563.125-.166.25-.646.813-.792.98-.145.166-.291.187-.541.062a6.85 6.85 0 0 1-2.016-1.243 7.55 7.55 0 0 1-1.393-1.733c-.146-.25-.015-.385.11-.51.112-.112.25-.291.375-.437.125-.146.166-.25.25-.417.083-.166.041-.312-.021-.437-.062-.125-.563-1.354-.77-1.854-.202-.488-.408-.422-.563-.43l-.479-.008c-.166 0-.437.062-.666.312-.23.25-.875.855-.875 2.084 0 1.23.896 2.417 1.02 2.584.125.166 1.762 2.69 4.269 3.771.596.257 1.062.41 1.425.526.6.19 1.144.163 1.575.099.48-.072 1.48-.605 1.688-1.188.208-.584.208-1.084.146-1.188-.063-.105-.229-.167-.479-.292z" />
                  </svg>
                </span>
                <span style={{ color: "#ffffff", fontWeight: 600 }}>WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
