"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Ht, getNeighborhoodNames } from "@/src/data/neighborhoods";
import projectsRaw from "@/src/data/miami-projects.json";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { handleImageError, getSafeImageUrl, FALLBACK_IMAGE_URL } from "@/src/lib/image-utils";

// Helper to get image URL
function getImageUrl(path: string | null | undefined): string {
  if (!path) return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60";
  return getSafeImageUrl(path, FALLBACK_IMAGE_URL);
}

export default function NeighborhoodListPage() {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Get active projects count and a representative image for each neighborhood
  const neighborhoods = Object.entries(Ht).map(([slug, data]) => {
    const names = getNeighborhoodNames(slug);
    const matchedProjects = projectsRaw.filter((p) => names.includes(p.neighborhood));
    const activeCount = matchedProjects.length;

    // Use first project's image or a high-end Miami skyline image as fallback
    const firstProj = matchedProjects[0];
    const bgImage = firstProj ? getImageUrl(firstProj.img) : "https://images.unsplash.com/photo-1506970185074-475383f1510c?w=800&auto=format&fit=crop&q=60";

    return {
      slug,
      ...data,
      activeCount,
      bgImage,
    };
  });

  return (
    <main className="min-h-screen bg-[#0C1523] text-[#FAF9F6] font-sans selection:bg-[#C9A84C]/30">
      {/* Premium Header/Navbar */}
      <header className={`site-header ${isScrolled ? "site-header-scrolled" : ""}`}>
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <Image
              src="/images/logo.png"
              alt="Miami New Development"
              width={220}
              height={58}
              className="site-logo h-auto w-[68px] md:w-[76px]"
              priority
            />
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/map">Explore Map</Link>
            <button
              type="button"
              onClick={() => setIsMatcherOpen(true)}
            >
              Find My Project
            </button>
            <div className="relative group">
              <button
                type="button"
                className="nav-dropdown flex items-center gap-1"
                onClick={() => router.push("/neighborhood")}
              >
                Neighborhoods
                <span aria-hidden="true">⌄</span>
              </button>
              <div className="nav-dropdown-menu">
                {Object.entries(Ht).map(([slug, data]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/neighborhood/${slug}`);
                    }}
                    className="nav-dropdown-item"
                  >
                    {data.name}
                  </button>
                ))}
              </div>
            </div>
            <Link href="/waterfront">Waterfront Estates</Link>
            <Link href="/insights">Insights</Link>
            <a
              href="/#contact"
              onClick={(event) => {
                event.preventDefault();
                openInquiry();
              }}
              className="nav-inquire-btn"
            >
              Inquire
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Header */}
      <section className="pt-32 pb-16 px-6 md:px-12 max-w-[1200px] mx-auto text-center md:text-left">
        <h1
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-4xl md:text-5xl lg:text-6xl font-light tracking-wide text-white mb-6 leading-tight"
        >
          Miami Neighborhoods
        </h1>
        <p className="text-base md:text-lg font-light text-[#A3A8B6] max-w-2xl leading-relaxed">
          Explore Miami's most exclusive luxury real estate enclaves. Select a neighborhood below to view current pricing trends, active development inventories, and local market analysis.
        </p>
      </section>

      {/* Grid of Neighborhoods */}
      <section className="px-6 md:px-12 pb-24 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {neighborhoods.map((hood) => (
            <Link
              key={hood.slug}
              href={`/neighborhood/${hood.slug}`}
              className="group relative flex flex-col justify-end aspect-[4/3] rounded-lg overflow-hidden border border-white/10 bg-[#14171E] hover:border-[#C9A84C]/50 transition-all duration-300 shadow-xl"
            >
              {/* Background Image with Overlay */}
              <div className="absolute inset-0 z-0">
                <img
                  src={hood.bgImage}
                  alt={hood.name}
                  className="w-full height-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500 opacity-60"
                  style={{ height: "100%", width: "100%" }}
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0C1523] via-[#0C1523]/60 to-transparent z-10" />
              </div>

              {/* Card Content */}
              <div className="relative z-20 p-6 flex flex-col justify-end">
                <span className="text-[10px] tracking-[0.2em] uppercase text-[#C9A84C] font-semibold mb-2 block">
                  {hood.activeCount} {hood.activeCount === 1 ? "Active Project" : "Active Projects"}
                </span>
                <h3
                  style={{ fontFamily: "'Playfair Display', serif" }}
                  className="text-2xl font-light text-white group-hover:text-[#C9A84C] transition-colors mb-2"
                >
                  {hood.name}
                </h3>
                <p className="text-xs text-[#A3A8B6] font-light line-clamp-2 leading-relaxed">
                  {hood.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Find My Project Questionnaire Wizard */}
      {isMatcherOpen && (
        <FindMyProjectModal
          onClose={() => setIsMatcherOpen(false)}
          onDone={(results) => {
            setIsMatcherOpen(false);
            localStorage.setItem("map-matcher-prefs", JSON.stringify(results.prefs));
            router.push("/map");
          }}
        />
      )}
    </main>
  );
}
