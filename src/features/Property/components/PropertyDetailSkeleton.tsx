"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";

export default function PropertyDetailSkeleton() {
  return (
    <main className="property-page bg-[#FAF8F3] min-h-screen text-[#1c1f26]">
      {/* Luxury Header Skeleton */}
      <header className="site-header site-header-light">
        <div className="site-header-inner">
          <Link href="/" className="opacity-70">
            <Image
              src="/images/logo.png"
              alt="Miami New Development"
              width={96}
              height={28}
              className="site-logo h-auto w-[68px] md:w-[76px]"
              priority
            />
          </Link>
          <div className="flex items-center gap-6">
            <div className="luxury-shimmer w-20 h-4 rounded-sm hidden md:block" />
            <div className="luxury-shimmer w-24 h-4 rounded-sm hidden md:block" />
            <div className="luxury-shimmer w-28 h-8 rounded-full" />
          </div>
        </div>
      </header>

      {/* Hero Section Skeleton */}
      <section className="relative w-full h-[480px] md:h-[600px] bg-[#1c1f26] overflow-hidden flex flex-col justify-end p-6 md:p-14">
        <div className="absolute inset-0 luxury-shimmer-dark opacity-35" />

        {/* Floating Live Indicator Pill */}
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-[#FAF8F3]/95 backdrop-blur-md px-6 py-3 rounded-full border border-[#B38E36]/40 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] luxury-pulse-badge" />
          <div className="flex flex-col">
            <span className="text-[10px] tracking-[0.2em] uppercase font-semibold text-[#1c1f26]">
              Loading Live MLS Property Data...
            </span>
            <span className="text-[8.5px] tracking-[0.08em] text-[#788092]">
              Connecting to BeachesMLS & Miami AOR Feed
            </span>
          </div>
        </div>

        <div className="relative z-10 max-w-[1140px] w-full mx-auto flex flex-col gap-4">
          <div className="luxury-shimmer w-36 h-4 rounded-sm opacity-80" />
          <div className="luxury-shimmer w-3/4 max-w-[580px] h-10 md:h-14 rounded-sm" />
          <div className="flex items-center gap-6 mt-2">
            <div className="luxury-shimmer w-32 h-8 rounded-sm" />
            <div className="luxury-shimmer w-28 h-6 rounded-sm" />
          </div>
        </div>
      </section>

      {/* Specs Highlights Skeleton */}
      <section className="py-16 max-w-[1140px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-16">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white p-6 border border-[#ddd8cd] rounded-sm flex flex-col gap-3">
              <div className="luxury-shimmer w-16 h-3 rounded-sm" />
              <div className="luxury-shimmer w-28 h-7 rounded-sm" />
            </div>
          ))}
        </div>

        {/* Overview Text Skeleton */}
        <div className="flex flex-col gap-4 max-w-3xl mb-16">
          <div className="luxury-shimmer w-36 h-4 rounded-sm" />
          <div className="luxury-shimmer w-full h-4 rounded-sm" />
          <div className="luxury-shimmer w-5/6 h-4 rounded-sm" />
          <div className="luxury-shimmer w-4/6 h-4 rounded-sm" />
        </div>

        {/* Gallery Grid Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="aspect-[1.4/1] luxury-shimmer border border-[#ddd8cd] rounded-sm" />
          ))}
        </div>
      </section>
    </main>
  );
}
