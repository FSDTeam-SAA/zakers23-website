"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { handleImageError } from "@/src/lib/image-utils";
import { Ht } from "@/src/data/neighborhoods";
import { MobileNavMenu } from "@/src/components/MobileNavMenu";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { Navbar } from "@/src/components/Navbar";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";

export interface PreconProject {
  id: number;
  slug: string;
  name: string;
  neighborhood: string;
  stage: string;
  lat?: number;
  lng?: number;
  minPrice: number | null;
  maxPrice: number | null;
  priceFrom: string;
  completion?: string;
  units?: string | number;
  img: string;
  stories?: number | null;
  developer?: string;
  architect?: string;
}

const STAGES = [
  { id: "all", label: "All Stages" },
  { id: "preconstruction", label: "Pre-Construction" },
  { id: "under_construction", label: "Under Construction" },
  { id: "topped_off", label: "Topped Off" },
  { id: "move_in_ready", label: "Move-In Ready" },
];

const STAGE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  preconstruction: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/30" },
  under_construction: { bg: "bg-sky-500/15", text: "text-sky-400", border: "border-sky-500/30" },
  topped_off: { bg: "bg-indigo-500/15", text: "text-indigo-400", border: "border-indigo-500/30" },
  move_in_ready: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/30" },
  coming_soon: { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/30" },
};

function formatStage(stage?: string): string {
  if (!stage) return "Pre-Construction";
  switch (stage) {
    case "preconstruction":
      return "Pre-Construction";
    case "under_construction":
      return "Under Construction";
    case "topped_off":
      return "Topped Off";
    case "move_in_ready":
      return "Move-In Ready";
    case "coming_soon":
      return "Coming Soon";
    default:
      return "Pre-Construction";
  }
}

function imageUrl(path: string) {
  if (!path) return "/images/anantara/aerial-helipad-day.webp";
  return path.startsWith("http")
    ? path
    : `https://frasermiami.s3.amazonaws.com/${path.replace(/^\//, "")}`;
}

export default function FindMyProjectMap({ projects }: { projects: PreconProject[] }) {
  const router = useRouter();
  const { openInquiry } = useInquiry();

  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
  const [selectedStage, setSelectedStage] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"featured" | "price-asc" | "price-desc" | "name-asc" | "completion">("featured");
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);

  // Horizontal scroll state for neighborhood filter pills
  const neighborhoodScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Compute available neighborhoods dynamically with counts
  const { neighborhoodList, neighborhoodCounts } = useMemo(() => {
    const counts: Record<string, number> = {};
    projects.forEach((p) => {
      const n = (p.neighborhood || "").trim();
      if (n) {
        counts[n] = (counts[n] || 0) + 1;
      }
    });

    // Sort neighborhoods by project count descending
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return {
      neighborhoodList: ["All", ...sorted],
      neighborhoodCounts: counts,
    };
  }, [projects]);

  // Check scroll indicators
  const updateScrollIndicators = useCallback(() => {
    const el = neighborhoodScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 6);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 6);
  }, []);

  useEffect(() => {
    updateScrollIndicators();
    const el = neighborhoodScrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollIndicators, { passive: true });
      window.addEventListener("resize", updateScrollIndicators);
    }
    return () => {
      if (el) el.removeEventListener("scroll", updateScrollIndicators);
      window.removeEventListener("resize", updateScrollIndicators);
    };
  }, [updateScrollIndicators, neighborhoodList]);

  const scrollNeighborhoods = (amount: number) => {
    if (neighborhoodScrollRef.current) {
      neighborhoodScrollRef.current.scrollBy({ left: amount, behavior: "smooth" });
      setTimeout(updateScrollIndicators, 320);
    }
  };

  // Enable mouse wheel horizontal scrolling over the filter bar
  const handleFilterWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (e.deltaY !== 0 && neighborhoodScrollRef.current) {
      neighborhoodScrollRef.current.scrollLeft += e.deltaY;
      updateScrollIndicators();
    }
  };

  // Filter & sort projects
  const filteredProjects = useMemo(() => {
    const list = projects.filter((p) => {
      // 1. Neighborhood
      if (selectedNeighborhood !== "All") {
        const normSelected = selectedNeighborhood.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normNeigh = (p.neighborhood || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!normNeigh.includes(normSelected) && !normSelected.includes(normNeigh)) {
          return false;
        }
      }

      // 2. Stage
      if (selectedStage !== "all") {
        if (p.stage !== selectedStage) {
          return false;
        }
      }

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchNeigh = (p.neighborhood || "").toLowerCase().includes(q);
        const matchDev = (p.developer || "").toLowerCase().includes(q);
        const matchArch = (p.architect || "").toLowerCase().includes(q);
        if (!matchName && !matchNeigh && !matchDev && !matchArch) return false;
      }

      return true;
    });

    // Sorting
    if (sortBy === "price-asc") {
      list.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    } else if (sortBy === "name-asc") {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "completion") {
      list.sort((a, b) => (a.completion || "").localeCompare(b.completion || ""));
    }

    return list;
  }, [projects, selectedNeighborhood, selectedStage, searchQuery, sortBy]);

  const hasActiveFilters = selectedNeighborhood !== "All" || selectedStage !== "all" || searchQuery.trim().length > 0;

  const resetFilters = () => {
    setSelectedNeighborhood("All");
    setSelectedStage("all");
    setSearchQuery("");
    setSortBy("featured");
  };

  return (
    <main className="min-h-screen bg-[#121622] text-white flex flex-col">
      {/* Top Unified Navbar */}
      <Navbar variant="dark" inquiryContext="Find My Project Directory" />

      {/* Hero Intro Section */}
      <section className="border-b border-white/10 bg-[#141a29] px-5 pt-24 pb-10 md:px-8 md:pt-28 md:pb-14">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <p className="text-xs uppercase tracking-[0.26em] text-[#c9a84c] font-medium mb-2">
                Miami-Dade Pre-Construction · Master Development Directory
              </p>
              <h1
                className="text-3xl md:text-5xl font-normal text-white leading-tight"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                Find Your Miami Pre-Construction Project
              </h1>
              <p className="mt-3 max-w-3xl text-sm md:text-base text-white/60 leading-relaxed">
                Browse South Florida&apos;s active pre-construction condominium developments, branded hospitality residences, and luxury waterfront towers. Filter by neighborhood, construction stage, and delivery timeline.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setIsMatcherOpen(true)}
                className="inline-flex items-center gap-2 rounded border border-[#c9a84c] bg-[#c9a84c]/10 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#c9a84c] transition-all hover:bg-[#c9a84c] hover:text-[#14171e] cursor-pointer"
              >
                <span>✨</span> Start Project Matcher Quiz
              </button>
              <button
                type="button"
                onClick={() => openInquiry("General Consultation")}
                className="rounded border border-white/20 bg-white/5 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-white/80 transition-colors hover:border-white hover:text-white cursor-pointer"
              >
                Schedule Consultation
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* STICKY FILTERING & SEARCH CONTROLS */}
      <section className="sticky top-[57px] z-30 border-b border-white/10 bg-[#141a29]/95 backdrop-blur-md px-5 py-4 md:px-8 shadow-xl">
        <div className="mx-auto max-w-7xl flex flex-col gap-3.5">
          {/* Top Row: Search Input + Stage Pills + Sort Dropdown */}
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search by project name, developer, or area..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-10 pr-9 text-xs text-white placeholder-white/40 focus:border-[#c9a84c] focus:outline-none transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-base text-white/40 hover:text-white cursor-pointer"
                  title="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Stage Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-none">
              {STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSelectedStage(s.id)}
                  className={`whitespace-nowrap rounded px-3 py-1.5 text-xs font-medium uppercase tracking-wider transition-all cursor-pointer ${
                    selectedStage === s.id
                      ? "bg-[#c9a84c] text-[#14171e] shadow-sm"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/30 hover:text-white"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 shrink-0">
              <label htmlFor="project-sort-select" className="text-xs text-white/50 uppercase tracking-wider hidden sm:inline">
                Sort:
              </label>
              <select
                id="project-sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                aria-label="Sort pre-construction developments"
                className="rounded border border-white/15 bg-[#161e30] px-3 py-1.5 text-xs text-white/90 focus:border-[#c9a84c] focus:outline-none cursor-pointer"
              >
                <option value="featured">Featured Developments</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
                <option value="completion">Delivery Timeline</option>
              </select>
            </div>
          </div>

          {/* Bottom Row: Fully Scrollable Neighborhood Filter Bar */}
          <div className="relative flex items-center pt-1 border-t border-white/5">
            <span className="text-[11px] uppercase tracking-wider text-white/40 mr-2 shrink-0 hidden sm:inline">
              Neighborhoods:
            </span>

            {/* Left Chevron Button */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollNeighborhoods(-260)}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#161e30] border border-[#c9a84c]/50 text-white shadow-lg transition-transform hover:scale-110 hover:bg-[#c9a84c] hover:text-[#14171e] cursor-pointer"
                aria-label="Scroll neighborhoods left"
              >
                ‹
              </button>
            )}

            {/* Left fade gradient when scrollable */}
            {canScrollLeft && (
              <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#141a29] to-transparent z-10" />
            )}

            {/* Scrollable Neighborhood Pills Container */}
            <div
              ref={neighborhoodScrollRef}
              onWheel={handleFilterWheel}
              className="flex-1 flex items-center gap-2 overflow-x-auto py-1 scroll-smooth touch-pan-x"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(255,255,255,0.2) transparent",
              }}
            >
              {neighborhoodList.map((n) => {
                const count = n === "All" ? projects.length : neighborhoodCounts[n] || 0;
                const isSelected = selectedNeighborhood === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setSelectedNeighborhood(n)}
                    className={`whitespace-nowrap rounded-full px-3.5 py-1 text-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                      isSelected
                        ? "bg-[#c9a84c] text-[#14171e] font-semibold shadow-md"
                        : "border border-white/10 bg-white/[0.04] text-white/70 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    <span>{n}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? "bg-[#14171e] text-[#c9a84c]" : "bg-white/10 text-white/60"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right fade gradient when scrollable */}
            {canScrollRight && (
              <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#141a29] to-transparent z-10" />
            )}

            {/* Right Chevron Button */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollNeighborhoods(260)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-[#161e30] border border-[#c9a84c]/50 text-white shadow-lg transition-transform hover:scale-110 hover:bg-[#c9a84c] hover:text-[#14171e] cursor-pointer"
                aria-label="Scroll neighborhoods right"
              >
                ›
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Active Filter Badges & Results Counter Bar */}
      <section className="px-5 py-4 md:px-8 border-b border-white/5 bg-[#121622]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span className="font-semibold text-white">{filteredProjects.length}</span> Developments Available
            {selectedNeighborhood !== "All" && (
              <span className="inline-flex items-center gap-1 rounded bg-[#c9a84c]/15 text-[#c9a84c] px-2 py-0.5 border border-[#c9a84c]/30">
                {selectedNeighborhood}
                <button
                  type="button"
                  onClick={() => setSelectedNeighborhood("All")}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove neighborhood filter"
                >
                  &times;
                </button>
              </span>
            )}
            {selectedStage !== "all" && (
              <span className="inline-flex items-center gap-1 rounded bg-white/10 text-white/90 px-2 py-0.5 border border-white/20">
                {formatStage(selectedStage)}
                <button
                  type="button"
                  onClick={() => setSelectedStage("all")}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove stage filter"
                >
                  &times;
                </button>
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center gap-1 rounded bg-white/10 text-white/90 px-2 py-0.5 border border-white/20">
                &ldquo;{searchQuery}&rdquo;
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="hover:text-white ml-0.5"
                  aria-label="Remove search query"
                >
                  &times;
                </button>
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetFilters}
              className="text-[#c9a84c] hover:underline cursor-pointer flex items-center gap-1 font-medium"
            >
              <span>↺</span> Reset all filters
            </button>
          )}
        </div>
      </section>

      {/* MAIN PROJECT LISTING GRID */}
      <section className="flex-1 px-5 py-8 md:px-8 md:py-12">
        <div className="mx-auto max-w-7xl">
          {filteredProjects.length === 0 ? (
            <div className="text-center py-20 bg-white/[0.02] border border-white/10 rounded-xl p-8 max-w-2xl mx-auto">
              <span className="text-4xl block mb-3">🏢</span>
              <h2
                className="text-xl md:text-2xl font-normal text-white mb-2"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                No developments found matching your criteria
              </h2>
              <p className="text-sm text-white/60 mb-6">
                Try searching for another neighborhood, adjusting the construction stage, or clearing your active filters.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="rounded border border-[#c9a84c] bg-[#c9a84c] px-6 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#14171e] transition-colors hover:bg-[#d4b068] cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((p) => {
                const stageStyle = STAGE_COLORS[p.stage] || {
                  bg: "bg-[#c9a84c]/15",
                  text: "text-[#c9a84c]",
                  border: "border-[#c9a84c]/30",
                };

                return (
                  <article
                    key={p.id}
                    onClick={() => router.push(`/property/${p.slug}`)}
                    className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/10 bg-[#161e30] transition-all duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-2xl hover:shadow-black/60"
                  >
                    {/* Image Preview */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                      <img
                        src={imageUrl(p.img)}
                        alt={p.name}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                        onError={handleImageError}
                        loading="lazy"
                      />
                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#161e30] via-transparent to-black/30" />

                      {/* Top Badges */}
                      <div className="absolute top-2.5 left-2.5 right-2.5 flex justify-between items-center text-[10px]">
                        <span className="rounded bg-black/70 px-2.5 py-0.5 uppercase tracking-wider text-white backdrop-blur-md border border-white/10">
                          {p.neighborhood}
                        </span>
                        <span
                          className={`rounded px-2.5 py-0.5 font-medium uppercase tracking-wider border backdrop-blur-md ${stageStyle.bg} ${stageStyle.text} ${stageStyle.border}`}
                        >
                          {formatStage(p.stage)}
                        </span>
                      </div>

                      {/* Bottom Image Info */}
                      {p.completion && (
                        <div className="absolute bottom-2 left-3 text-[11px] text-white/80 font-mono">
                          Est. Delivery: {p.completion}
                        </div>
                      )}
                    </div>

                    {/* Card Body */}
                    <div className="flex flex-1 flex-col justify-between p-5">
                      <div>
                        <h2
                          className="text-lg font-normal text-white transition-colors duration-200 group-hover:text-[#c9a84c] line-clamp-1"
                          style={{ fontFamily: "var(--font-serif), serif" }}
                        >
                          {p.name}
                        </h2>

                        <div className="mt-2 flex items-center gap-3 text-xs text-white/50">
                          {p.units && <span>{p.units} Residences</span>}
                          {p.units && p.stories && <span>·</span>}
                          {p.stories && <span>{p.stories} Stories</span>}
                        </div>

                        {p.developer && (
                          <p className="mt-1 text-[11px] text-white/40 line-clamp-1">
                            Dev: {p.developer}
                          </p>
                        )}
                      </div>

                      {/* Pricing & CTA */}
                      <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-3.5">
                        <div>
                          <span className="block text-[10px] uppercase tracking-wider text-white/40">
                            Starting From
                          </span>
                          <strong className="text-sm font-semibold text-[#c9a84c]">
                            {p.priceFrom || "Upon Request"}
                          </strong>
                        </div>

                        <span className="text-xs font-semibold uppercase tracking-wider text-white/70 transition-all duration-200 group-hover:text-[#c9a84c] group-hover:translate-x-1 inline-flex items-center gap-1">
                          View Details <span>→</span>
                        </span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Guided Matcher Quiz Modal (when requested) */}
      {isMatcherOpen && (
        <FindMyProjectModal
          onClose={() => setIsMatcherOpen(false)}
          onDone={(results) => {
            setIsMatcherOpen(false);
            if (results.exactMatches && results.exactMatches.length > 0) {
              const first = results.exactMatches[0];
              if (first.slug) {
                router.push(`/property/${first.slug}`);
              }
            }
          }}
        />
      )}

      {/* Global Site Footer */}
      <SiteFooter />
    </main>
  );
}
