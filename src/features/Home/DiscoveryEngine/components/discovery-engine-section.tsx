"use client";

import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";
import { handleImageError } from "@/src/lib/image-utils";

type DiscoveryProject = {
  id: number;
  slug: string;
  name: string;
  neighborhood: string;
  minPrice: number | null;
  maxPrice: number | null;
  priceFrom: string;
  img: string;
  wellnessScore?: number | null;
  listingOffice?: string;
  discoveryEngine?: {
    lifestyle?: string[];
    investmentProfile?: string[];
    priceCategory?: string;
    vibeMatch?: string[];
    goodFor?: string[];
  };
};

type DiscoveryEngineSectionProps = {
  projectNames?: string[];
  featuredProjects?: unknown;
  initialProjects?: DiscoveryProject[];
};

// All neighborhoods present in miami-projects.json
const NEIGHBORHOOD_OPTIONS = [
  "All",
  "Miami Beach",
  "Fisher Island",
  "Sunny Isles Beach",
  "Brickell",
  "Key Biscayne",
  "Coconut Grove",
  "Surfside",
  "Downtown Miami",
  "Bal Harbour",
  "Edgewater",
];

// Curated Price Presets (matching the actual pre-construction project price spectrum)
const PRICE_PRESETS = [
  { label: "All Prices", range: [0, 50000] as [number, number] },
  { label: "Under $3M", range: [0, 3000] as [number, number] },
  { label: "$3M–$6M", range: [3000, 6000] as [number, number] },
  { label: "$6M–$12M", range: [6000, 12000] as [number, number] },
  { label: "$12M+", range: [12000, 50000] as [number, number] },
];

// 0 = ultra-private enclave; 100 = dense urban core
const LOCATION_SCORES: Record<string, number> = {
  "Fisher Island": 5,
  "Key Biscayne": 10,
  "Coconut Grove": 18,
  "Surfside": 25,
  "Bal Harbour": 30,
  "Sunny Isles Beach": 42,
  "South of Fifth": 50,
  "Miami Beach": 60,
  "Edgewater": 75,
  "Design District": 80,
  "Miami": 82,
  "Downtown Miami": 90,
  "Brickell": 96,
};

function wellnessSignal(project: DiscoveryProject): number {
  if (typeof project.wellnessScore === "number") return project.wellnessScore;
  let score = 50;
  const lifestyles = project.discoveryEngine?.lifestyle || [];
  if (lifestyles.includes("waterfront")) score += 30;
  if (lifestyles.includes("luxury-estate")) score += 15;
  if (["Fisher Island", "Key Biscayne", "Surfside", "Bal Harbour"].includes(project.neighborhood)) {
    score += 10;
  }
  return Math.min(100, Math.max(0, score));
}

function formatBandValue(value: number) {
  if (value >= 50000) return "$50M+";
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}M`;
  return `$${value}K`;
}

function imageUrl(path: string) {
  if (!path || path.includes("api.cotality.com") || path.includes("cotality.com")) {
    return "/images/anantara/aerial-helipad-day.webp";
  }
  return path.startsWith("http")
    ? path
    : `https://frasermiami.s3.amazonaws.com/${path.replace(/^\//, "")}`;
}

export function DiscoveryEngineSection({
  initialProjects,
}: DiscoveryEngineSectionProps) {
  const [projectsList, setProjectsList] = useState<DiscoveryProject[]>(initialProjects || []);
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
  const [location, setLocation] = useState(58);
  const [wellness, setWellness] = useState(58);
  const [budget, setBudget] = useState<[number, number]>([0, 50000]);
  const [searchQuery, setSearchQuery] = useState("");

  const neighborhoodScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasMovedRef = useRef(false);

  useEffect(() => {
    const el = neighborhoodScrollRef.current;
    if (!el) return;

    const check = () => {
      setCanScrollLeft(el.scrollLeft > 6);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 6);
    };

    check();
    const t1 = setTimeout(check, 100);
    const t2 = setTimeout(check, 400);

    el.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);

    // Native wheel with e.preventDefault() so mouse wheel over pills scrolls horizontally
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
        check();
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => check());
      ro.observe(el);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      el.removeEventListener("scroll", check);
      el.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", check);
      if (ro) ro.disconnect();
    };
  }, []);

  const scrollNeighborhoods = (direction: "left" | "right") => {
    const el = neighborhoodScrollRef.current;
    if (!el) return;
    const distance = 260;
    el.scrollBy({ left: direction === "left" ? -distance : distance, behavior: "smooth" });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = neighborhoodScrollRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    startXRef.current = e.pageX - el.offsetLeft;
    scrollLeftRef.current = el.scrollLeft;
    hasMovedRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const el = neighborhoodScrollRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startXRef.current) * 1.5;
    if (Math.abs(walk) > 4) {
      hasMovedRef.current = true;
    }
    el.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUpOrLeave = () => {
    isDraggingRef.current = false;
  };

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

    return projectsList
      .filter((project) => {
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

        // 3. Price Band Filter
        const low = project.minPrice ?? project.maxPrice ?? 0;
        const high = project.maxPrice ?? low;
        if (maxVal !== Infinity && low > maxVal) return false;
        if (minVal > 0 && high < minVal) return false;

        return true;
      })
      .map((project) => {
        const locTarget = LOCATION_SCORES[project.neighborhood] ?? 50;
        const locationFit = 100 - Math.abs(locTarget - location);
        const wellnessFit = 100 - Math.abs(wellnessSignal(project) - wellness);

        const low = project.minPrice ?? project.maxPrice ?? 0;
        const high = project.maxPrice ?? low;
        const effectiveMax = maxVal === Infinity ? 250000000 : maxVal;
        const targetMid = (minVal + effectiveMax) / 2;
        const rangeSpread = Math.max(effectiveMax - minVal, 1000000);
        const priceFit = Math.max(
          0,
          100 - (Math.abs((low + high) / 2 - targetMid) / rangeSpread) * 25
        );

        const score = Math.min(
          100,
          Math.max(60, Math.round(locationFit * 0.4 + wellnessFit * 0.35 + priceFit * 0.25))
        );
        return { ...project, score };
      })
      .sort((a, b) => b.score - a.score || (a.minPrice ?? 0) - (b.minPrice ?? 0));
  }, [budget, location, wellness, selectedNeighborhood, searchQuery, projectsList]);

  // Total 30 items to show in the 3-column index
  const displayedProjects = useMemo(() => matches.slice(0, 30), [matches]);
  const topMatches = useMemo(() => matches.slice(0, 3), [matches]);

  // Divide strictly into 3 columns of up to 10 items each
  const colSize = Math.max(1, Math.ceil(displayedProjects.length / 3));
  const column1 = displayedProjects.slice(0, colSize);
  const column2 = displayedProjects.slice(colSize, colSize * 2);
  const column3 = displayedProjects.slice(colSize * 2, colSize * 3);

  const activePreset = PRICE_PRESETS.find(
    (preset) => preset.range[0] === budget[0] && preset.range[1] === budget[1]
  )?.label;

  const isFiltered =
    selectedNeighborhood !== "All" ||
    searchQuery !== "" ||
    location !== 58 ||
    wellness !== 58 ||
    budget[0] !== 0 ||
    budget[1] !== 50000;

  const handleResetFilters = () => {
    setSelectedNeighborhood("All");
    setSearchQuery("");
    setLocation(58);
    setWellness(58);
    setBudget([0, 50000]);
  };

  return (
    <section className="section section-dark" id="discovery-engine">
      <div className="section-header section-header-dark">
        <span className="eyebrow">Discovery Engine</span>
        <h2>
          Find your <em>home</em>.
        </h2>
        <p>
          Refine by neighborhood, lifestyle, and price band. Three live dimensions rank the top
          matches in real time.
        </p>
      </div>

      {/* Neighborhood Pills & Search Filter */}
      <div className="max-w-[1280px] mx-auto px-4 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-white/10">
          {/* Neighborhood Pills Navigation & Scroll */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {/* Left Scroll Button */}
            <button
              type="button"
              onClick={() => scrollNeighborhoods("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll neighborhoods left"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                canScrollLeft
                  ? "bg-[#182032] border-[#bb9751] text-[#bb9751] hover:bg-[#bb9751] hover:text-[#0c1523] shadow-md"
                  : "bg-white/[0.02] border-white/10 text-white/20 cursor-not-allowed opacity-40"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>

            {/* Scrollable Pills Row with Custom Gold Scrollbar */}
            <div
              ref={neighborhoodScrollRef}
              data-lenis-prevent
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="neighborhood-scroll-track flex items-center gap-2 overflow-x-auto pb-2 pt-1 select-none cursor-grab active:cursor-grabbing px-1 flex-1 min-w-0"
            >
              {NEIGHBORHOOD_OPTIONS.map((name) => (
                <button
                  key={name}
                  type="button"
                  className={`discovery-pill shrink-0 ${selectedNeighborhood === name ? "is-active" : ""}`}
                  onClick={() => {
                    if (hasMovedRef.current) return;
                    setSelectedNeighborhood(name);
                  }}
                >
                  {name}
                </button>
              ))}
            </div>

            {/* Right Scroll Button */}
            <button
              type="button"
              onClick={() => scrollNeighborhoods("right")}
              disabled={!canScrollRight}
              aria-label="Scroll neighborhoods right"
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                canScrollRight
                  ? "bg-[#182032] border-[#bb9751] text-[#bb9751] hover:bg-[#bb9751] hover:text-[#0c1523] shadow-md"
                  : "bg-white/[0.02] border-white/10 text-white/20 cursor-not-allowed opacity-40"
              }`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="relative min-w-[220px] shrink-0">
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/10 rounded-full px-4 py-1.5 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#bb9751] transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dimensional Sliders & Top Matches */}
      <div className="discovery-layout mb-12">
        <div className="sliders">
          <label className="slider-block">
            <div className="flex justify-between items-baseline">
              <span className="slider-label">Location</span>
              <span className="font-mono text-xs text-[#bb9751]">{location}%</span>
            </div>
            <span className="slider-description">
              Quiet enclave (0%) ↔ Urban core (100%)
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={location}
              onChange={(event) => setLocation(Number(event.target.value))}
            />
          </label>

          <label className="slider-block">
            <div className="flex justify-between items-baseline">
              <span className="slider-label">Health &amp; Wellness</span>
              <span className="font-mono text-xs text-[#bb9751]">{wellness}%</span>
            </div>
            <span className="slider-description">
              Standard lifestyle (0%) ↔ Waterfront &amp; Wellness focus (100%)
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={wellness}
              onChange={(event) => setWellness(Number(event.target.value))}
            />
          </label>

          <div className="slider-block">
            <div className="budget-head">
              <span className="slider-label">Price Band</span>
              <strong>
                {formatBandValue(budget[0])} – {formatBandValue(budget[1])}
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max="110000"
              step="2500"
              value={budget[0]}
              onChange={(event) =>
                setBudget(([_, high]) => [
                  Math.min(Number(event.target.value), high - 2500),
                  high,
                ])
              }
            />
            <input
              type="range"
              min="5000"
              max="110000"
              step="2500"
              value={budget[1] >= 110000 ? 110000 : budget[1]}
              onChange={(event) => {
                const val = Number(event.target.value);
                setBudget(([low]) => [low, val >= 110000 ? 250000 : Math.max(val, low + 2500)]);
              }}
            />
            <div className="budget-presets">
              {PRICE_PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  className={activePreset === preset.label ? "is-active" : ""}
                  onClick={() => setBudget(preset.range)}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="match-panel" aria-live="polite">
          <div className="match-header">
            <span className="text-[12px] uppercase tracking-wider font-semibold text-[#bb9751]">
              Top Ranked Matches
            </span>
            <span className="font-mono text-xs text-white/50">
              Live · 3 of {matches.length}
            </span>
          </div>
          {topMatches.length ? (
            topMatches.map((project, index) => (
              <Link
                key={project.id}
                href={`/property/${project.slug}`}
                className={`match-card ${index === 0 ? "is-highlighted" : ""}`}
              >
                <div className="match-rank">#{index + 1}</div>
                <div className="match-thumb">
                  <img
                    src={imageUrl(project.img)}
                    alt={project.name}
                    className="match-thumb-image"
                    onError={handleImageError}
                  />
                </div>
                <div className="match-copy">
                  <span>
                    {project.neighborhood} · {project.priceFrom}
                  </span>
                  <strong>{project.name}</strong>
                </div>
                <div className="match-score">{project.score}%</div>
              </Link>
            ))
          ) : (
            <p className="discovery-empty">No matches found for current filter criteria.</p>
          )}
        </aside>
      </div>

      {/* 3 Columns of 10 items (Total 30 items list) */}
      <div className="discovery-index-container" aria-live="polite">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#bb9751] animate-pulse" />
            <span className="font-mono uppercase tracking-[0.2em] text-[#bb9751] font-semibold text-[12px]">
              Discovery Index
            </span>
            <span className="text-white/30">|</span>
            <span className="text-white/60">
              Showing {displayedProjects.length} listings (3 columns · 10 per column)
              {matches.length > 30 ? ` of ${matches.length} matches` : ""}
            </span>
          </div>

          {isFiltered && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[#bb9751] hover:text-[#e5c583] text-xs transition-colors cursor-pointer self-start sm:self-auto"
            >
              Reset Filters ↺
            </button>
          )}
        </div>

        {displayedProjects.length > 0 ? (
          <div className="discovery-index-grid">
            {/* Column 1 (Items 1-10) */}
            <div className="discovery-col">
              {column1.map((project, idx) => (
                <Link
                  key={project.id}
                  href={`/property/${project.slug}`}
                  className="discovery-item group"
                >
                  <span className="discovery-item-num">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <span className="discovery-item-name">{project.name}</span>
                  <div className="discovery-item-meta">
                    <span>{project.neighborhood}</span>
                    <span className="opacity-40">·</span>
                    <span className="discovery-item-price">{project.priceFrom}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Column 2 (Items 11-20) */}
            <div className="discovery-col">
              {column2.map((project, idx) => (
                <Link
                  key={project.id}
                  href={`/property/${project.slug}`}
                  className="discovery-item group"
                >
                  <span className="discovery-item-num">
                    {String(colSize + idx + 1).padStart(2, "0")}
                  </span>
                  <span className="discovery-item-name">{project.name}</span>
                  <div className="discovery-item-meta">
                    <span>{project.neighborhood}</span>
                    <span className="opacity-40">·</span>
                    <span className="discovery-item-price">{project.priceFrom}</span>
                  </div>
                </Link>
              ))}
            </div>

            {/* Column 3 (Items 21-30) */}
            <div className="discovery-col">
              {column3.map((project, idx) => (
                <Link
                  key={project.id}
                  href={`/property/${project.slug}`}
                  className="discovery-item group"
                >
                  <span className="discovery-item-num">
                    {String(colSize * 2 + idx + 1).padStart(2, "0")}
                  </span>
                  <span className="discovery-item-name">{project.name}</span>
                  <div className="discovery-item-meta">
                    <span>{project.neighborhood}</span>
                    <span className="opacity-40">·</span>
                    <span className="discovery-item-price">{project.priceFrom}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 px-6 border border-white/10 rounded-sm bg-white/[0.02]">
            <p className="text-white/60 text-sm mb-4">
              No listings fall inside your current filter combination.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex min-h-[44px] items-center justify-center gap-2 px-5 py-2.5 bg-[#bb9751] hover:bg-[#a88543] text-[#0c1523] text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* MLS IDX Attribution Notice */}
        <div className="mt-10 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-white/50 gap-2">
          <span>Listing data provided courtesy of participating brokerages via BeachesMLS &amp; Miami Association of Realtors IDX.</span>
          <span className="font-mono text-[#bb9751]">Equal Housing Opportunity · IDX Compliant</span>
        </div>
      </div>
    </section>
  );
}
