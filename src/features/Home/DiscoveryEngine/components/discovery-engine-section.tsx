"use client";

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { handleImageError } from "@/src/lib/image-utils";

type DiscoveryProject = {
  id: number;
  slug: string;
  name: string;
  neighborhood: string;
  minPrice: number | null;
  maxPrice: number | null;
  priceFrom: string;
  completion?: string;
  stage?: string;
  units?: string | number;
  img: string;
  listingOffice?: string;
};

type DiscoveryEngineSectionProps = {
  projectNames?: string[];
  featuredProjects?: unknown;
  initialProjects?: DiscoveryProject[];
};

const NEIGHBORHOOD_OPTIONS = [
  "All",
  "Brickell",
  "Edgewater",
  "Miami Beach",
  "Sunny Isles Beach",
  "Coconut Grove",
  "Downtown Miami",
  "Bal Harbour",
  "Fisher Island",
  "Surfside",
  "Key Biscayne",
];

const PRICE_PRESETS = [
  { label: "All Prices", range: [0, 50000] as [number, number] },
  { label: "Under $3M", range: [0, 3000] as [number, number] },
  { label: "$3M–$6M", range: [3000, 6000] as [number, number] },
  { label: "$6M–$12M", range: [6000, 12000] as [number, number] },
  { label: "$12M+", range: [12000, 50000] as [number, number] },
];

function imageUrl(path: string) {
  if (!path || path.includes("api.cotality.com") || path.includes("cotality.com")) {
    return "/images/anantara/aerial-helipad-day.webp";
  }
  return path.startsWith("http")
    ? path
    : `https://frasermiami.s3.amazonaws.com/${path.replace(/^\//, "")}`;
}

function formatStageLabel(stage?: string): string {
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
    default:
      return "Pre-Construction";
  }
}

export function DiscoveryEngineSection({
  initialProjects,
}: DiscoveryEngineSectionProps) {
  const [projectsList, setProjectsList] = useState<DiscoveryProject[]>(initialProjects || []);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
  const [budget, setBudget] = useState<[number, number]>([0, 50000]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!initialProjects || initialProjects.length === 0) {
      fetch("/api/idx/properties")
        .then((res) => res.json())
        .then((data) => {
          if (data.projects && Array.isArray(data.projects)) {
            setProjectsList(data.projects);
          }
        })
        .catch(console.error);
    }
  }, [initialProjects]);

  const matches = useMemo(() => {
    const minVal = budget[0] * 1000;
    const maxVal = budget[1] >= 50000 ? Infinity : budget[1] * 1000;

    return projectsList.filter((project) => {
      // 1. Neighborhood Filter
      if (selectedNeighborhood !== "All") {
        const normSelected = selectedNeighborhood.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normNeigh = (project.neighborhood || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!normNeigh.includes(normSelected) && !normSelected.includes(normNeigh)) {
          return false;
        }
      }

      // 2. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (project.name || "").toLowerCase().includes(q);
        const matchNeigh = (project.neighborhood || "").toLowerCase().includes(q);
        if (!matchName && !matchNeigh) return false;
      }

      // 3. Price Filter
      const low = project.minPrice ?? project.maxPrice ?? 0;
      const high = project.maxPrice ?? low;
      if (maxVal !== Infinity && low > maxVal) return false;
      if (minVal > 0 && high < minVal) return false;

      return true;
    });
  }, [projectsList, selectedNeighborhood, searchQuery, budget]);

  const activePreset = PRICE_PRESETS.find(
    (preset) => preset.range[0] === budget[0] && preset.range[1] === budget[1]
  )?.label;

  const isFiltered =
    selectedNeighborhood !== "All" ||
    searchQuery !== "" ||
    budget[0] !== 0 ||
    budget[1] !== 50000;

  const handleResetFilters = () => {
    setSelectedNeighborhood("All");
    setSearchQuery("");
    setBudget([0, 50000]);
  };

  return (
    <section className="section section-dark" id="discovery-engine">
      <div className="section-header section-header-dark">
        <span className="eyebrow">Pre-Construction Discovery</span>
        <h2>
          Explore New <em>Developments</em>.
        </h2>
        <p>
          Search Miami&apos;s premier luxury residential towers by neighborhood, price range, or name.
        </p>
      </div>

      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        {/* Search Bar & Filters */}
        <div className="mb-8 space-y-4 rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm md:p-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Search Input */}
            <div className="relative flex-1">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
              <input
                type="text"
                placeholder="Search by project name or neighborhood..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/[0.04] py-3 pl-11 pr-10 text-sm text-white placeholder-white/40 transition-colors focus:border-[#bb9751] focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-lg text-white/40 hover:text-white"
                  aria-label="Clear search"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Price Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={`rounded-md px-3 py-1.5 text-xs uppercase tracking-wider transition-all ${
                    activePreset === preset.label
                      ? "bg-[#bb9751] text-[#161e30] font-medium"
                      : "border border-white/10 bg-white/[0.03] text-white/70 hover:border-white/20 hover:text-white"
                  }`}
                  onClick={() => setBudget(preset.range)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Neighborhood Pills */}
          <div className="flex items-center gap-2 overflow-x-auto border-t border-white/5 pt-3 scrollbar-none">
            {NEIGHBORHOOD_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                className={`whitespace-nowrap rounded-full px-3.5 py-1 text-xs transition-colors ${
                  selectedNeighborhood === name
                    ? "bg-[#bb9751]/20 text-[#bb9751] border border-[#bb9751]/50 font-medium"
                    : "text-white/60 hover:text-white hover:bg-white/[0.05]"
                }`}
                onClick={() => setSelectedNeighborhood(name)}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Results Count & Filter Status */}
        <div className="mb-6 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span className="h-2 w-2 rounded-full bg-[#bb9751]" />
            <span>
              Showing <strong className="text-white">{matches.length}</strong> pre-construction developments
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs text-[#bb9751] transition-colors hover:text-[#e5c583]"
            >
              Reset Filters ↺
            </button>
          )}
        </div>

        {/* Project Cards Grid */}
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {matches.slice(0, 9).map((project) => (
              <Link
                key={project.id}
                href={`/property/${project.slug}`}
                className="group relative flex flex-col overflow-hidden rounded-lg border border-white/10 bg-[#161e30] transition-all duration-300 hover:-translate-y-1 hover:border-[#bb9751]/60 hover:shadow-xl hover:shadow-[#bb9751]/5"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                  <img
                    src={imageUrl(project.img)}
                    alt={project.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#161e30] via-transparent to-transparent opacity-60" />
                  
                  {/* Badges */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px]">
                    <span className="rounded bg-black/60 px-2 py-0.5 uppercase tracking-wider text-white backdrop-blur-sm">
                      {project.neighborhood}
                    </span>
                    <span className="rounded bg-[#bb9751] px-2 py-0.5 font-medium uppercase tracking-wider text-[#161e30]">
                      {formatStageLabel(project.stage)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3
                      className="m-0 text-xl font-normal leading-snug text-white transition-colors group-hover:text-[#bb9751]"
                      style={{ fontFamily: "var(--font-serif), serif" }}
                    >
                      {project.name}
                    </h3>
                    <p className="mt-2 text-sm text-white/50">
                      {project.completion ? `Delivery: ${project.completion}` : "Pre-Construction"}
                      {project.units ? ` · ${project.units} Residences` : ""}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                    <div>
                      <span className="block text-[10px] uppercase tracking-wider text-white/40">
                        Pricing
                      </span>
                      <strong className="text-sm font-medium text-[#bb9751]">
                        {project.priceFrom || "Upon Request"}
                      </strong>
                    </div>

                    <span className="text-xs uppercase tracking-wider text-white/60 transition-transform group-hover:translate-x-1 group-hover:text-[#bb9751]">
                      View Details →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.02] py-16 text-center">
            <p className="text-base text-white/60">No pre-construction developments match your search criteria.</p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-4 rounded border border-[#bb9751] px-4 py-2 text-xs uppercase tracking-widest text-[#bb9751] transition-colors hover:bg-[#bb9751] hover:text-[#161e30]"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Map CTA Banner */}
        <div className="mt-12 flex flex-col items-center justify-between gap-6 rounded-xl border border-[#bb9751]/30 bg-gradient-to-r from-[#1c2438] to-[#161e30] p-6 text-center sm:text-left md:flex-row md:p-8">
          <div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#bb9751]">
              Geographic Overview
            </span>
            <h4
              className="mt-1 text-2xl font-normal text-white"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Explore All Developments on the Map
            </h4>
            <p className="mt-1 text-sm text-white/60">
              Interactive satellite &amp; vector mapping of every pre-construction tower across South Florida.
            </p>
          </div>
          <Link
            href="/map"
            className="inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-[2px] bg-[#bb9751] px-6 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#161e30] transition-colors hover:bg-[#d4b068]"
          >
            Open Interactive Map →
          </Link>
        </div>
      </div>
    </section>
  );
}
