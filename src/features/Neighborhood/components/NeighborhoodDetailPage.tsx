"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import { Ht, getNeighborhoodNames, getNeighborhoodSlug } from "@/src/data/neighborhoods";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { submitInquiry } from "@/src/lib/inquiry";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { handleImageError, FALLBACK_IMAGE_URL, getSafeImageUrl } from "@/src/lib/image-utils";
import { toast } from "sonner";
import { HoneypotField } from "@/src/components/HoneypotField";
import MobileNavMenu from "@/src/components/MobileNavMenu";
import { Navbar } from "@/src/components/Navbar";

// Type definitions
interface MapProject {
  id: number;
  slug: string;
  name: string;
  neighborhood: string;
  stage: string;
  lat: number;
  lng: number;
  minPrice: number | null;
  maxPrice: number | null;
  minBed: number | null;
  maxBed: number | null;
  priceFrom: string;
  completion: string;
  units: string | number | null;
  stories?: number | null;
  height?: number | null;
  pricePerSqft: number | null;
  comingSoon?: boolean;
  badge?: string;
  img: string;
  listingOffice?: string;
  salesTeam?: string;
}

interface StageConfig {
  label: string;
  dot: string;
  border: string;
}

const STAGES: Record<string, StageConfig> = {
  preconstruction: { label: "Pre-Construction", dot: "#f59e0b", border: "#d97706" },
  under_construction: { label: "Under Construction", dot: "#0284c7", border: "#0369a1" },
  topped_off: { label: "Topped Off", dot: "#6366f1", border: "#4f46e5" },
  move_in_ready: { label: "Move-In Ready", dot: "#10b981", border: "#059669" },
};

function getStageConfig(stage: string): StageConfig {
  return STAGES[stage] || { label: "Pre-Construction", dot: "#f59e0b", border: "#d97706" };
}

// Helper to format price numbers into short text (e.g. $3M, $500K)
function formatPriceNum(val: number): string {
  if (val >= 1000000) {
    const millions = val / 1000000;
    return `$${millions.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}K`;
  }
  return `$${val}`;
}

// Formats a generic string price (e.g., "$1.5M")
function formatPriceStr(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  const str = String(price).trim();
  if (!str) return "—";
  if (str.startsWith("$")) return str;
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(1).replace(/\.0$/, "")}M+`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K+`;
    return `$${num}`;
  }
  return str;
}

// Extracts years from completion text
function extractYears(completion: string | null | undefined): number[] {
  if (!completion) return [];
  const matches = [...String(completion).matchAll(/\b20\d{2}\b/g)];
  return matches.map((m) => parseInt(m[0], 10));
}

// Calculates stats for dashboard
function calculateStats(projects: MapProject[]) {
  const count = projects.length;
  const mins = projects.map((o) => o.minPrice).filter((o): o is number => o != null && o > 0);
  const maxs = projects.map((o) => o.maxPrice).filter((o): o is number => o != null && o > 0);

  const minVal = mins.length ? Math.min(...mins) : null;
  const maxVal = maxs.length ? Math.max(...maxs) : minVal;
  const priceLabel = minVal != null && maxVal != null ? `${formatPriceNum(minVal)} – ${formatPriceNum(maxVal)}` : "Contact for pricing";

  const psfList = projects
    .map((o) => o.pricePerSqft)
    .filter((o): o is number => typeof o === "number" && !Number.isNaN(o));
  const avgSqft = psfList.length > 0 ? Math.round(psfList.reduce((sum, val) => sum + val, 0) / psfList.length) : null;
  const avgPsfLabel = avgSqft != null ? `$${avgSqft.toLocaleString()}/sf` : "—";

  const years = projects.flatMap((o) => extractYears(o.completion));
  let deliveryLabel = "—";
  if (years.length) {
    const minYear = Math.min(...years);
    const maxYear = Math.max(...years);
    deliveryLabel = minYear === maxYear ? `${minYear}` : `${minYear}–${maxYear}`;
  }

  return { count, priceLabel, avgPsfLabel, deliveryLabel };
}

// Helper to get project primary image
function getImageUrl(path: string | null | undefined): string {
  if (!path) return "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp";
  return getSafeImageUrl(path, "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp");
}

export default function NeighborhoodDetailPage({ slug, initialProjects }: { slug: string; initialProjects?: MapProject[] }) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [projectsList, setProjectsList] = useState<MapProject[]>(initialProjects || []);

  useEffect(() => {
    if (initialProjects && initialProjects.length > 0) {
      setProjectsList(initialProjects);
    }
  }, [initialProjects]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Form intake state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formHoneypot, setFormHoneypot] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Retrieve neighborhood metadata
  const hood = Ht[slug];

  // Get matching projects in this neighborhood
  const allHoodProjects = useMemo(() => {
    const names = getNeighborhoodNames(slug);
    return projectsList.filter((p) => names.includes(p.neighborhood));
  }, [slug, projectsList]);

  // Compute stats
  const stats = useMemo(() => calculateStats(allHoodProjects), [allHoodProjects]);

  // Compute list of available stages in this neighborhood
  const availableStages = useMemo(() => {
    const stages = new Set(allHoodProjects.map((p) => p.stage).filter(Boolean));
    return Object.keys(STAGES).filter((key) => stages.has(key));
  }, [allHoodProjects]);

  // Apply stage filter
  const filteredProjects = useMemo(() => {
    if (stageFilter === "all") return allHoodProjects;
    return allHoodProjects.filter((p) => p.stage === stageFilter);
  }, [allHoodProjects, stageFilter]);

  // Group by tier if neighborhood has tiers defined (e.g. Coconut Grove)
  const tieredSections = useMemo(() => {
    if (!hood?.tiers) return null;
    const boutique = filteredProjects.filter((p) => (p as any).neighborhoodTier === "boutique");
    const main = filteredProjects.filter((p) => (p as any).neighborhoodTier !== "boutique");
    return [
      { key: "main", ...hood.tiers.main, projects: main },
      { key: "boutique", ...hood.tiers.boutique, projects: boutique },
    ].filter((section) => section.projects.length > 0);
  }, [hood, filteredProjects]);

  // Handle Form Submit
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEmail.trim()) {
      setFormStatus("error");
      return;
    }
    setFormStatus("sending");

    try {
      await submitInquiry({
        name: formName,
        email: formEmail,
        message: formMessage,
        website: formHoneypot,
        projectName: hood.name,
        buttonClicked: "Request Dossier",
        source: "Website",
        details: { Neighborhood: hood.name },
      });
      setFormStatus("done");
      toast.success(`Inquiry received for ${hood.name}! Zachary will follow up with private dossier details.`);
      setFormName("");
      setFormEmail("");
      setFormMessage("");
      setFormHoneypot("");
    } catch {
      setFormStatus("error");
      toast.error("Failed to submit inquiry. Please try again.");
    }
  };

  // Setup Mapbox map
  useEffect(() => {
    if (!mapContainerRef.current || allHoodProjects.length === 0) return;

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

    // Determine center
    let center: [number, number] = [-80.19179, 25.761681]; // Brickell fallback
    if (slug === "south-of-fifth") center = [-80.134, 25.767];

    const validCoordProjects = allHoodProjects.filter(
      (p) => typeof p.lat === "number" && typeof p.lng === "number" && !isNaN(p.lat) && !isNaN(p.lng) && p.lat !== 0
    );

    if (validCoordProjects.length > 0) {
      const lats = validCoordProjects.map((p) => p.lat);
      const lngs = validCoordProjects.map((p) => p.lng);
      center = [
        lngs.reduce((a, b) => a + b, 0) / lngs.length,
        lats.reduce((a, b) => a + b, 0) / lats.length,
      ];
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: center,
      zoom: 13,
      scrollZoom: false,
      attributionControl: true,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    map.on("load", () => {
      map.resize();

      const prices = validCoordProjects
        .map((p) => p.maxPrice ?? p.minPrice)
        .filter((v): v is number => v != null && v > 0);
      const minP = prices.length ? Math.min(...prices) : null;
      const maxP = prices.length ? Math.max(...prices) : null;

      const bounds = new mapboxgl.LngLatBounds();

      validCoordProjects.forEach((proj) => {
        const priceVal = proj.maxPrice ?? proj.minPrice;
        let diameter = 18;
        if (priceVal && minP && maxP && minP !== maxP) {
          diameter = 12 + Math.min(1, Math.max(0, (priceVal - minP) / (maxP - minP))) * 16;
        }

        const isTrophy = priceVal != null && maxP != null && priceVal >= maxP * 0.85;

        const markerEl = document.createElement("div");
        markerEl.className = "cursor-pointer group relative";
        markerEl.style.width = `${diameter}px`;
        markerEl.style.height = `${diameter}px`;
        markerEl.style.borderRadius = "50%";
        markerEl.style.backgroundColor = isTrophy ? "rgba(201, 168, 76, 0.45)" : "rgba(201, 168, 76, 0.2)";
        markerEl.style.border = "2px solid #C9A84C";
        markerEl.style.display = "flex";
        markerEl.style.alignItems = "center";
        markerEl.style.justifyContent = "center";
        markerEl.style.boxShadow = "0 0 10px rgba(201, 168, 76, 0.3)";
        markerEl.style.transition = "transform 0.2s ease, background-color 0.2s ease";

        if (isTrophy) {
          const dot = document.createElement("div");
          dot.style.width = "6px";
          dot.style.height = "6px";
          dot.style.backgroundColor = "#C9A84C";
          dot.style.borderRadius = "50%";
          markerEl.appendChild(dot);
        }

        const popup = new mapboxgl.Popup({ offset: diameter / 2 + 6, closeButton: false }).setHTML(
          `<div style="font-family: 'DM Sans', sans-serif; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; font-weight: 600; color: #1c1f26; padding: 4px 6px;">
            ${proj.name}
            <div style="font-size: 10px; color: #b89354; font-weight: 400; margin-top: 2px;">${formatPriceStr(proj.priceFrom)}</div>
          </div>`
        );

        new mapboxgl.Marker(markerEl)
          .setLngLat([proj.lng, proj.lat])
          .setPopup(popup)
          .addTo(map);

        markerEl.addEventListener("click", () => {
          router.push(`/property/${proj.slug}`);
        });

        bounds.extend([proj.lng, proj.lat]);
      });

      if (validCoordProjects.length > 1) {
        map.fitBounds(bounds, { padding: 50, maxZoom: 15 });
      }
    });

    // Handle container resize
    const resizeTimer = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.resize();
      }
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [allHoodProjects, slug, router]);

  if (!hood) {
    return (
      <div className="min-h-screen bg-[#0C1523] text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-serif mb-4">Neighborhood Not Found</h1>
        <p className="text-sm text-[#A3A8B6] mb-6">The requested neighborhood does not exist.</p>
        <Link href="/neighborhood" className="text-[#C9A84C] hover:underline">
          &larr; Back to all neighborhoods
        </Link>
      </div>
    );
  }

  // Filter labels and message configurations
  const hasInventory = allHoodProjects.length > 0;
  const contactFormSubtitle = !hasInventory
    ? `New construction rarely comes to ${hood.name}. Register to hear first when a resale or off-market residence opens up here.`
    : "Request current availability. Unit-level pricing, floor plans, and current incentives.";
  const contactFormBtnLabel = !hasInventory ? "Register for first access" : "Submit Inquiry";
  const contactFormSuccessMsg = !hasInventory
    ? `You're on the list. I'll reach out the moment something worth seeing comes up in ${hood.name}.`
    : `${hood.name} availability details will be sent your way shortly.`;

  return (
    <main className="neighborhood-page">
      {/* Unified Navbar */}
      <Navbar variant="light" inquiryContext={`Neighborhood — ${hood.name}`} />

      {/* Main Neighborhood Banner & Intro */}
      <section className="neighborhood-header">
        <div className="neighborhood-container">
          <nav className="neighborhood-breadcrumbs">
            <Link href="/">Home</Link>
            <span className="mx-2">&middot;</span>
            <Link href="/neighborhood">Neighborhoods</Link>
            <span className="mx-2">&middot;</span>
            <span className="text-[#1c1f26]">{hood.name}</span>
          </nav>

          <h1 className="neighborhood-title">{hood.headline}</h1>
          <p className="neighborhood-lead">{hood.description}</p>

          {/* Stats Dashboard Grid */}
          {hasInventory && (
            <div className="neighborhood-stats-grid">
              <div className="ns-item">
                <span className="ns-label">Active Projects</span>
                <span className="ns-value">{stats.count}</span>
              </div>
              <div className="ns-item">
                <span className="ns-label">Price Range</span>
                <span className="ns-value">{stats.priceLabel}</span>
              </div>
              <div className="ns-item">
                <span className="ns-label">Avg $/SF</span>
                <span className="ns-value">{stats.avgPsfLabel}</span>
              </div>
              <div className="ns-item">
                <span className="ns-label">Est. Delivery</span>
                <span className="ns-value">{stats.deliveryLabel}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Leaflet Dark map section */}
      {hasInventory && (
        <section className="neighborhood-map-section">
          <div className="neighborhood-container">
            <div className="neighborhood-map-wrap" ref={mapContainerRef} />
          </div>
        </section>
      )}

      {/* Editorial Content */}
      <section className="neighborhood-editorial-section">
        <div className="neighborhood-container">
          <div className="editorial-layout">
            <div className="editorial-sidebar">
              <h2 className="editorial-sidebar-title">Local Insight</h2>
            </div>
            <div className="editorial-content">
              {hood.editorial.map((para, idx) => (
                <p key={idx}>{para}</p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Inventory & Projects List */}
      {hasInventory && (
        <section className="neighborhood-inventory-section">
          <div className="neighborhood-container">
            <div className="inventory-header-row">
              <span className="inventory-count-text">
                {filteredProjects.length} {filteredProjects.length === 1 ? "Project" : "Projects"} in {hood.name}
              </span>

              {/* Construction stage filter pills */}
              <div className="stage-tabs">
                <button
                  type="button"
                  onClick={() => setStageFilter("all")}
                  className={`stage-tab-btn ${stageFilter === "all" ? "stage-tab-btn--active" : ""}`}
                >
                  All
                </button>
                {availableStages.map((stage) => {
                  const conf = getStageConfig(stage);
                  return (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => setStageFilter(stage)}
                      className={`stage-tab-btn ${stageFilter === stage ? "stage-tab-btn--active" : ""}`}
                      style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: conf.dot }} />
                      {conf.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grid display */}
            {tieredSections ? (
              <div className="space-y-12">
                {tieredSections.map((tier) => (
                  <div key={tier.key}>
                    <h3 className="project-tier-title">{tier.label}</h3>
                    {tier.description && <p className="project-tier-description">{tier.description}</p>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {tier.projects.map((proj) => {
                        const conf = getStageConfig(proj.stage);
                        const displayMeta = [
                          proj.stories ? `${proj.stories} stories` : null,
                          proj.units ? `${proj.units} residences` : null,
                          proj.neighborhood,
                        ]
                          .filter(Boolean)
                          .join(" · ");

                        return (
                          <div
                            key={proj.slug}
                            onClick={() => router.push(`/property/${proj.slug}`)}
                            className="neighborhood-property-card"
                          >
                            <div className="npc-image-wrap">
                              <img
                                src={getImageUrl(proj.img)}
                                alt={proj.name}
                                loading="lazy"
                                onError={handleImageError}
                              />
                              {proj.comingSoon && (
                                <span className="npc-badge npc-badge--coming-soon">Coming Soon</span>
                              )}
                              {proj.badge && !proj.comingSoon && (
                                <span className="npc-badge">{proj.badge}</span>
                              )}
                            </div>

                            <div className="npc-details">
                              <div className="npc-header">
                                <div className="npc-title-row">
                                  <h4 className="npc-name">{proj.name}</h4>
                                  <span className="npc-dot" style={{ background: conf.dot }} />
                                </div>
                                <span className="npc-meta">{displayMeta}</span>
                              </div>

                              <div className="npc-footer">
                                <div className="npc-price-block">
                                  <span className="npc-label">Price From</span>
                                  <span className="npc-value">{formatPriceStr(proj.priceFrom)}</span>
                                </div>
                                <div className="npc-stage-block">
                                  <span className="npc-label">Construction Stage</span>
                                  <span className="npc-value">{conf.label}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredProjects.map((proj) => {
                    const conf = getStageConfig(proj.stage);
                    const displayMeta = [
                      proj.stories ? `${proj.stories} stories` : null,
                      proj.units ? `${proj.units} residences` : null,
                      proj.neighborhood,
                    ]
                      .filter(Boolean)
                      .join(" · ");

                    return (
                      <div
                        key={proj.slug}
                        onClick={() => router.push(`/property/${proj.slug}`)}
                        className="neighborhood-property-card"
                      >
                        <div className="npc-image-wrap">
                          <img
                            src={getImageUrl(proj.img)}
                            alt={proj.name}
                            loading="lazy"
                            onError={handleImageError}
                          />
                          {proj.comingSoon && (
                            <span className="npc-badge npc-badge--coming-soon">Coming Soon</span>
                          )}
                          {proj.badge && !proj.comingSoon && (
                            <span className="npc-badge">{proj.badge}</span>
                          )}
                        </div>

                        <div className="npc-details">
                          <div className="npc-header">
                            <div className="npc-title-row">
                              <h4 className="npc-name">{proj.name}</h4>
                              <span className="npc-dot" style={{ background: conf.dot }} />
                            </div>
                            <span className="npc-meta">{displayMeta}</span>
                          </div>

                          <div className="npc-footer">
                            <div className="npc-price-block">
                              <span className="npc-label">Price From</span>
                              <span className="npc-value">{formatPriceStr(proj.priceFrom)}</span>
                            </div>
                            <div className="npc-stage-block">
                              <span className="npc-label">Construction Stage</span>
                              <span className="npc-value">{conf.label}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredProjects.length === 0 && (
                  <p className="mt-8 text-[#7b8089] text-sm">No projects in this stage.</p>
                )}
              </div>
            )}
            {/* MLS IDX Attribution & Disclaimer */}
            <div className="mt-12 p-6 bg-[#FAF8F3] border border-[#e8e4db] rounded-[4px] text-[12px] text-[#788092] leading-relaxed">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#e2dcd2] pb-3 mb-3">
                <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-[#B38E36] font-semibold">
                  IDX Listing Attribution &amp; Disclaimer
                </span>
                <span className="text-[11px] font-mono text-[#8f96ab]">
                  BeachesMLS / Miami Association of Realtors
                </span>
              </div>
              <p className="m-0 mb-2">
                Listing information displayed on this page is provided courtesy of participating brokerages via the IDX program of BeachesMLS and the Miami Association of Realtors.
              </p>
              <p className="m-0 text-[11px] text-[#8f96ab]">
                All data deemed reliable but not guaranteed. Properties subject to prior sale, change, or withdrawal. Neither BeachesMLS, Miami Association of Realtors, ONE Sotheby&apos;s International Realty, nor Zachary Akers shall be held responsible for typographical errors or misinformation. Equal Housing Opportunity.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Private Inquiry Intake Form */}
      <section className="neighborhood-contact-section">
        <div className="neighborhood-container max-w-[800px] mx-auto px-6 text-center">
          <h2 className="contact-info-title text-[#1c1f26] mb-2">Considering {hood.name}?</h2>
          <p className="contact-info-desc text-[#5f6575] mb-8">{contactFormSubtitle}</p>

          <div className="max-w-[640px] mx-auto text-left">
            {formStatus === "done" ? (
              <div className="p-6 bg-green-500/10 border border-green-500/20 rounded text-center">
                <h4 className="text-xl font-serif text-green-600 mb-2">Request Received</h4>
                <p className="text-[16px] text-[#535862] leading-relaxed">{contactFormSuccessMsg}</p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <HoneypotField value={formHoneypot} onChange={setFormHoneypot} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group-custom">
                    <input
                      type="text"
                      placeholder="Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="form-input-custom"
                    />
                  </div>

                  <div className="form-group-custom">
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={`form-input-custom ${formStatus === "error" && !formEmail.trim() ? "border-[#C9A84C]" : ""}`}
                    />
                    {formStatus === "error" && !formEmail.trim() && (
                      <span className="text-[12px] text-[#C9A84C] mt-1">Please enter a valid email address.</span>
                    )}
                  </div>
                </div>

                <div className="form-group-custom">
                  <textarea
                    placeholder="What are you looking for? (optional)"
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={4}
                    className="form-input-custom resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={formStatus === "sending"}
                  className="form-submit-btn-custom"
                >
                  {formStatus === "sending" ? "Sending..." : "SUBMIT"}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Explore other neighborhoods section */}
      <section className="explore-neighborhoods-section">
        <div className="neighborhood-container max-w-[1125px] mx-auto px-6 text-left">
          <span className="text-[12px] tracking-[0.25em] uppercase text-[#B38E36] font-semibold mb-6 block">
            Explore Other Neighborhoods
          </span>

          <div className="flex flex-wrap gap-3">
            {Object.entries(Ht)
              .filter(([s]) => s !== slug)
              .map(([s, data]) => (
                <Link
                  key={s}
                  href={`/neighborhood/${s}`}
                  className="px-5 py-2.5 bg-[#f1f3f6] hover:bg-[#C9A84C]/10 text-[#5f6575] hover:text-[#C9A84C] rounded-full text-[12px] font-medium tracking-wider transition-all duration-200 border border-transparent hover:border-[#C9A84C]/30"
                >
                  {data.name}
                </Link>
              ))}
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Matcher wizard modal */}
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
