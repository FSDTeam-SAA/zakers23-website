"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import projectsRaw from "@/src/data/miami-projects.json";

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
};

const projects = projectsRaw as DiscoveryProject[];

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
];

// Curated Price Presets (matching the actual project price spectrum)
const PRICE_PRESETS = [
  { label: "All Prices", range: [0, 250000] as [number, number] },
  { label: "Under $15M", range: [0, 15000] as [number, number] },
  { label: "$15M–$25M", range: [15000, 25000] as [number, number] },
  { label: "$25M–$50M", range: [25000, 50000] as [number, number] },
  { label: "$50M+", range: [50000, 250000] as [number, number] },
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
  if (value >= 110000 || value >= 250000) return "$250M+";
  if (value >= 1000) return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}M`;
  return `$${value}K`;
}

function imageUrl(path: string) {
  return path.startsWith("http")
    ? path
    : `https://frasermiami.s3.amazonaws.com/${path.replace(/^\//, "")}`;
}

export function DiscoveryEngineSection({
  projectNames: _projectNames,
}: DiscoveryEngineSectionProps) {
  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
  const [location, setLocation] = useState(50);
  const [wellness, setWellness] = useState(50);
  const [budget, setBudget] = useState<[number, number]>([0, 250000]);
  const [searchQuery, setSearchQuery] = useState("");

  const matches = useMemo(() => {
    const minVal = budget[0] * 1000;
    const maxVal = budget[1] >= 110000 ? Infinity : budget[1] * 1000;

    return projects
      .filter((project) => {
        // 1. Neighborhood Filter
        if (selectedNeighborhood !== "All" && project.neighborhood !== selectedNeighborhood) {
          return false;
        }

        // 2. Search Query Filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = project.name.toLowerCase().includes(q);
          const matchNeigh = project.neighborhood.toLowerCase().includes(q);
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
  }, [budget, location, wellness, selectedNeighborhood, searchQuery]);

  // Total 30 items to show
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
    location !== 50 ||
    wellness !== 50 ||
    budget[0] !== 0 ||
    budget[1] !== 250000;

  const handleResetFilters = () => {
    setSelectedNeighborhood("All");
    setSearchQuery("");
    setLocation(50);
    setWellness(50);
    setBudget([0, 250000]);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {NEIGHBORHOOD_OPTIONS.map((name) => (
              <button
                key={name}
                type="button"
                className={`discovery-pill ${selectedNeighborhood === name ? "is-active" : ""}`}
                onClick={() => setSelectedNeighborhood(name)}
              >
                {name}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
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
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[#bb9751]">
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
            <span className="font-mono uppercase tracking-[0.2em] text-[#bb9751] font-semibold text-[11px]">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#bb9751] hover:bg-[#a88543] text-[#0c1523] text-xs font-semibold uppercase tracking-wider transition-colors rounded-sm cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
