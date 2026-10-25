"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { handleImageError } from "@/src/lib/image-utils";

export interface PreconProject {
  id: number;
  slug: string;
  name: string;
  neighborhood: string;
  stage: string;
  lat: number;
  lng: number;
  minPrice: number | null;
  maxPrice: number | null;
  priceFrom: string;
  completion?: string;
  units?: string | number;
  img: string;
  stories?: number | null;
}

const NEIGHBORHOOD_PILLS = [
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
];

const STAGE_COLORS: Record<string, string> = {
  preconstruction: "#f59e0b",
  under_construction: "#0284c7",
  topped_off: "#6366f1",
  move_in_ready: "#10b981",
  coming_soon: "#8b5cf6",
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
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  const [selectedNeighborhood, setSelectedNeighborhood] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProject, setSelectedProject] = useState<PreconProject | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // 1. Neighborhood
      if (selectedNeighborhood !== "All") {
        const normSelected = selectedNeighborhood.toLowerCase().replace(/[^a-z0-9]/g, "");
        const normNeigh = (p.neighborhood || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        if (!normNeigh.includes(normSelected) && !normSelected.includes(normNeigh)) {
          return false;
        }
      }

      // 2. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (p.name || "").toLowerCase().includes(q);
        const matchNeigh = (p.neighborhood || "").toLowerCase().includes(q);
        if (!matchName && !matchNeigh) return false;
      }

      return true;
    });
  }, [projects, selectedNeighborhood, searchQuery]);

  // Initialize Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token =
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      "";

    if (!token) {
      console.warn("NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN is missing");
      return;
    }

    mapboxgl.accessToken = token;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-80.185, 25.80],
      zoom: 12,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.resize();
    });

    const resizeTimer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 300);

    return () => {
      clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when filtered projects change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    const validCoords = filteredProjects.filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0
    );

    validCoords.forEach((proj) => {
      const isSelected = selectedProject?.id === proj.id;
      const markerColor = STAGE_COLORS[proj.stage] || "#c2a36a";

      const el = document.createElement("div");
      el.className = "precon-map-marker";
      el.style.cssText = `
        width: ${isSelected ? "26px" : "18px"};
        height: ${isSelected ? "26px" : "18px"};
        border-radius: 50%;
        background-color: ${isSelected ? "#c2a36a" : "rgba(18, 24, 38, 0.9)"};
        border: 2px solid ${isSelected ? "#ffffff" : markerColor};
        box-shadow: 0 0 12px ${isSelected ? "rgba(194, 163, 106, 0.8)" : "rgba(0, 0, 0, 0.5)"};
        cursor: pointer;
        transition: all 0.25s ease;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      const innerDot = document.createElement("div");
      innerDot.style.cssText = `
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background-color: ${isSelected ? "#182235" : markerColor};
      `;
      el.appendChild(innerDot);

      const popup = new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
        `<div style="font-family: 'DM Sans', sans-serif; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; color: #1c1f26; padding: 4px;">
          ${proj.name}
          <div style="font-size: 10px; color: #b89354; font-weight: 400; margin-top: 2px;">${proj.priceFrom || "Upon Request"}</div>
        </div>`
      );

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([proj.lng, proj.lat])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener("click", () => {
        setSelectedProject(proj);
        map.flyTo({ center: [proj.lng, proj.lat], zoom: 14.5, duration: 1200 });
      });

      markersRef.current.push(marker);
      bounds.extend([proj.lng, proj.lat]);
    });

    // Auto fit bounds
    if (validCoords.length > 1 && !selectedProject) {
      map.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    }
  }, [filteredProjects, selectedProject]);

  const handleSelectProject = (proj: PreconProject) => {
    setSelectedProject(proj);
    if (mapRef.current && typeof proj.lat === "number" && typeof proj.lng === "number") {
      mapRef.current.flyTo({ center: [proj.lng, proj.lat], zoom: 14.5, duration: 1200 });
    }
  };

  return (
    <main className="flex h-screen w-screen flex-col overflow-hidden bg-[#121622] text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-white/10 bg-[#161e30]/90 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/mcs-symbol.svg"
              alt="Miami New Development"
              width={40}
              height={40}
              className="h-9 w-9 object-contain"
            />
            <span
              className="text-lg font-normal tracking-tight text-white hidden sm:inline"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Miami Pre-Construction Map
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {/* Mode Switch */}
          <div className="inline-flex rounded-md border border-white/10 bg-white/5 p-1 text-xs">
            <button
              onClick={() => setViewMode("map")}
              className={`rounded px-3 py-1 uppercase tracking-wider transition-colors ${
                viewMode === "map" ? "bg-[#bb9751] text-[#161e30] font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              Map View
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`rounded px-3 py-1 uppercase tracking-wider transition-colors ${
                viewMode === "list" ? "bg-[#bb9751] text-[#161e30] font-medium" : "text-white/60 hover:text-white"
              }`}
            >
              List View
            </button>
          </div>

          <Link
            href="/"
            className="hidden md:inline-flex rounded border border-white/20 px-3.5 py-1.5 text-xs uppercase tracking-wider text-white/80 transition-colors hover:border-white hover:text-white"
          >
            Home
          </Link>

          <button
            onClick={() => openInquiry("Find My Project Map")}
            className="rounded bg-[#bb9751] px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#161e30] transition-colors hover:bg-[#d4b068]"
          >
            Inquire
          </button>
        </div>
      </header>

      {/* Filter / Search Bar */}
      <div className="z-20 shrink-0 border-b border-white/10 bg-[#141a29] px-5 py-3 md:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Search pre-construction towers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-white/10 bg-white/5 py-2 pl-9 pr-8 text-xs text-white placeholder-white/40 focus:border-[#bb9751] focus:outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-sm text-white/40 hover:text-white"
              >
                &times;
              </button>
            )}
          </div>

          {/* Neighborhood Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {NEIGHBORHOOD_PILLS.map((n) => (
              <button
                key={n}
                onClick={() => setSelectedNeighborhood(n)}
                className={`whitespace-nowrap rounded-full px-3 py-1 text-xs transition-colors ${
                  selectedNeighborhood === n
                    ? "bg-[#bb9751] text-[#161e30] font-medium"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                }`}
              >
                {n}
              </button>
            ))}
          </div>

          <div className="text-right text-xs text-white/40 hidden lg:block">
            {filteredProjects.length} Developments
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Map View */}
        <div className={`h-full w-full ${viewMode === "map" ? "block" : "hidden"}`}>
          <div ref={mapContainerRef} className="h-full w-full" />

          {/* Selected Project Drawer / Floating Card */}
          {selectedProject && (
            <div className="absolute bottom-5 left-5 right-5 z-30 mx-auto max-w-lg md:left-8 md:right-auto md:w-[420px]">
              <div className="relative flex overflow-hidden rounded-xl border border-[#bb9751]/50 bg-[#161e30]/95 p-4 shadow-2xl backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="absolute right-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white/70 hover:text-white"
                  aria-label="Close details"
                >
                  &times;
                </button>

                <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-lg bg-white/5">
                  <img
                    src={imageUrl(selectedProject.img)}
                    alt={selectedProject.name}
                    className="h-full w-full object-cover"
                    onError={handleImageError}
                  />
                </div>

                <div className="ml-4 flex flex-1 flex-col justify-between pr-6">
                  <div>
                    <span className="text-[10px] uppercase tracking-wider text-[#bb9751]">
                      {selectedProject.neighborhood} · {formatStage(selectedProject.stage)}
                    </span>
                    <h3
                      className="mt-0.5 text-base font-normal leading-snug text-white"
                      style={{ fontFamily: "var(--font-serif), serif" }}
                    >
                      {selectedProject.name}
                    </h3>
                    <p className="mt-1 text-xs text-white/50">
                      {selectedProject.completion ? `Delivery: ${selectedProject.completion}` : ""}
                    </p>
                  </div>

                  <div className="mt-2 flex items-center justify-between">
                    <strong className="text-sm font-medium text-[#bb9751]">
                      {selectedProject.priceFrom || "Upon Request"}
                    </strong>

                    <button
                      type="button"
                      onClick={() => router.push(`/property/${selectedProject.slug}`)}
                      className="rounded bg-[#bb9751] px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-[#161e30] transition-colors hover:bg-[#d4b068]"
                    >
                      View Project →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* List View */}
        <div
          className={`h-full w-full overflow-y-auto px-5 py-8 md:px-12 ${
            viewMode === "list" ? "block" : "hidden"
          }`}
        >
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center justify-between">
              <h2
                className="text-2xl font-normal text-white"
                style={{ fontFamily: "var(--font-serif), serif" }}
              >
                Miami Pre-Construction Developments ({filteredProjects.length})
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProjects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => router.push(`/property/${p.slug}`)}
                  className="group flex cursor-pointer flex-col overflow-hidden rounded-lg border border-white/10 bg-[#161e30] transition-all hover:-translate-y-1 hover:border-[#bb9751]/60"
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-white/5">
                    <img
                      src={imageUrl(p.img)}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      onError={handleImageError}
                    />
                    <div className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px]">
                      <span className="rounded bg-black/60 px-2 py-0.5 uppercase tracking-wider text-white backdrop-blur-sm">
                        {p.neighborhood}
                      </span>
                      <span className="rounded bg-[#bb9751] px-2 py-0.5 font-medium uppercase tracking-wider text-[#161e30]">
                        {formatStage(p.stage)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col justify-between p-4">
                    <div>
                      <h4
                        className="text-base font-normal text-white transition-colors group-hover:text-[#bb9751]"
                        style={{ fontFamily: "var(--font-serif), serif" }}
                      >
                        {p.name}
                      </h4>
                      <p className="mt-1 text-xs text-white/50">
                        {p.completion ? `Delivery: ${p.completion}` : "Pre-Construction"}
                      </p>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="text-xs font-medium text-[#bb9751]">
                        {p.priceFrom || "Upon Request"}
                      </span>
                      <span className="text-xs text-white/60 transition-transform group-hover:translate-x-1 group-hover:text-[#bb9751]">
                        View Details →
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
