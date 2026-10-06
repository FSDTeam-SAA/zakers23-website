"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import mapboxgl from "mapbox-gl";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { Ht } from "@/src/data/neighborhoods";
import { submitInquiry } from "@/src/lib/inquiry";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import PropertyDetailSkeleton from "./PropertyDetailSkeleton";
import localProjects from "@/src/data/miami-projects.json";
import { handleImageError, FALLBACK_IMAGE_URL, LUXURY_FALLBACK_IMAGE_URL, getSafeImageUrl } from "@/src/lib/image-utils";

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
  mlsId?: string;
  comingSoon?: boolean;
  badge?: string;
  img: string;
  imgs?: string[];
  baths?: number | null;
  sqft?: number | null;
  description?: string;
  fullDetailsURL?: string;
  wellnessScore?: number | null;
  statusRemark?: string;
  developer?: string;
}

const STAGES: Record<string, { label: string; dot: string; index: number }> = {
  preconstruction: { label: "Pre-Construction", dot: "#f59e0b", index: 0 },
  under_construction: { label: "Under Construction", dot: "#0284c7", index: 1 },
  topped_off: { label: "Topped Off", dot: "#6366f1", index: 2 },
  move_in_ready: { label: "Completed", dot: "#10b981", index: 3 },
};

const STAGE_STEPS = [
  { key: "preconstruction", label: "Planning" },
  { key: "under_construction", label: "Construction" },
  { key: "topped_off", label: "Completing" },
  { key: "move_in_ready", label: "Delivered" }
];

const fallbackImages = [
  "https://frasermiami.s3.amazonaws.com/ciprianiresidences/skyline.webp",
  "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
  LUXURY_FALLBACK_IMAGE_URL,
  "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
  "https://frasermiami.s3.amazonaws.com/shoreclub/hero-beach-view.webp",
  "https://frasermiami.s3.amazonaws.com/rivage/hummingbird.webp",
  "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/01-Mansions-on-Fisher-Island-Featured.webp",
  FALLBACK_IMAGE_URL,
  "https://frasermiami.s3.amazonaws.com/sixfisher/hero.webp",
  "https://frasermiami.s3.amazonaws.com/waldorf/waldorf-astoria-hero-twilight.webp",
];

function getImageUrl(path: string | null | undefined, index: number = 0): string {
  if (!path || path.includes("api.cotality.com")) {
    return fallbackImages[Math.abs(index) % fallbackImages.length];
  }
  return getSafeImageUrl(path, fallbackImages[Math.abs(index) % fallbackImages.length]);
}

function getSafeImage(imgs: string[] | undefined, primaryImg: string, index: number): string {
  const pool = (imgs && imgs.length > 0 ? imgs : [primaryImg])
    .filter((url) => typeof url === "string" && url.trim().length > 0 && !url.includes("api.cotality.com"));
  if (pool.length > 0) {
    return getImageUrl(pool[Math.abs(index) % pool.length], index);
  }
  return fallbackImages[Math.abs(index) % fallbackImages.length];
}

function formatPriceStr(price: string | number | null | undefined): string {
  if (price === null || price === undefined) return "—";
  const str = String(price).trim();
  if (!str) return "—";
  if (str.startsWith("$")) return str;
  const num = parseFloat(str);
  if (!isNaN(num)) {
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2).replace(/\.00$/, "")}M+`;
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}K+`;
    return `$${num}`;
  }
  return str;
}

export default function PropertyDetailPage({ slug, initialProject }: { slug: string; initialProject?: MapProject }) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [projects, setProjects] = useState<MapProject[]>(
    initialProject ? [initialProject] : (localProjects as unknown as MapProject[])
  );
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState<number | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Background fetch for fresh live MLS updates without blocking initial render
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/idx/properties", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Could not load property.");
        if (Array.isArray(body.projects) && body.projects.length > 0) {
          setProjects(body.projects as MapProject[]);
        }
      })
      .catch((error: unknown) => { if ((error as { name?: string }).name !== "AbortError") console.error(error); });
    return () => controller.abort();
  }, []);

  const project = useMemo(() => {
    if (initialProject) {
      if (
        initialProject.slug === slug ||
        initialProject.slug.endsWith(slug) ||
        slug.endsWith(initialProject.slug)
      ) {
        return initialProject;
      }
    }

    const cleanSlug = slug.toLowerCase().trim();

    // 1. Exact slug match
    const found = projects.find((item) => item.slug.toLowerCase() === cleanSlug);
    if (found) return found;

    // 2. MLS ID suffix match
    const slugParts = cleanSlug.split("-");
    const possibleMls = slugParts[slugParts.length - 1]?.toUpperCase();
    if (possibleMls) {
      const byMls = projects.find((p) =>
        p.badge?.toUpperCase().includes(possibleMls) ||
        (p as any).mlsId?.toUpperCase() === possibleMls ||
        String(p.id).toUpperCase() === possibleMls
      );
      if (byMls) return byMls;
    }

    // 3. Name match
    const cleanName = cleanSlug.replace(/-/g, " ");
    const byName = projects.find((p) =>
      p.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(p.name.toLowerCase())
    );
    if (byName) return byName;

    // 4. Initial project fallback
    if (initialProject) return initialProject;

    // 5. Guaranteed fallback: return first active project so user never gets broken screen
    if (projects.length > 0) return projects[0];

    return null;
  }, [projects, slug, initialProject]);

  // Form intake state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  // Compare state
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && project) {
      const stored = localStorage.getItem("zakers23-compare-projects");
      if (stored) {
        try {
          const list = JSON.parse(stored) as number[];
          setIsCompared(list.includes(project.id));
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [project]);

  const handleToggleCompare = () => {
    if (!project || typeof window === "undefined") return;
    const stored = localStorage.getItem("zakers23-compare-projects");
    let list: number[] = [];
    if (stored) {
      try {
        list = JSON.parse(stored) as number[];
      } catch (e) {
        console.error(e);
      }
    }

    if (list.includes(project.id)) {
      list = list.filter((id) => id !== project.id);
      setIsCompared(false);
    } else {
      if (list.length >= 2) {
        list.shift(); // remove oldest
      }
      list.push(project.id);
      setIsCompared(true);
    }

    localStorage.setItem("zakers23-compare-projects", JSON.stringify(list));
    window.dispatchEvent(new Event("compare-changed"));
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Gallery images array
  const galleryImgs = useMemo(() => {
    if (!project) return [];
    const pool = (project.imgs && project.imgs.length > 0 ? project.imgs : [project.img])
      .filter((img) => img && typeof img === "string" && !img.includes("api.cotality.com"));
    if (pool.length > 0) return pool;
    return fallbackImages.slice(0, 4);
  }, [project]);

  // Related projects list
  const relatedProjects = useMemo(() => {
    if (!project) return [];
    const list = projects
      .filter((p) => p.slug !== project.slug)
      .filter((p) => p.neighborhood === project.neighborhood || p.neighborhood.includes(project.neighborhood));

    if (list.length >= 4) return list.slice(0, 4);

    const remaining = projects
      .filter((p) => p.slug !== project.slug && !list.some((item) => item.slug === p.slug));
    return [...list, ...remaining].slice(0, 4);
  }, [project, projects]);

  // Keyboard controls for Lightbox
  useEffect(() => {
    if (activeImgIdx === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveImgIdx(null);
      } else if (e.key === "ArrowRight") {
        setActiveImgIdx((prev) => (prev !== null && galleryImgs.length > 0 ? (prev + 1) % galleryImgs.length : prev));
      } else if (e.key === "ArrowLeft") {
        setActiveImgIdx((prev) => (prev !== null && galleryImgs.length > 0 ? (prev - 1 + galleryImgs.length) % galleryImgs.length : prev));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeImgIdx, galleryImgs]);

  // Map Setup Effect
  useEffect(() => {
    if (!mapContainerRef.current || !project) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      mapContainerRef.current.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #f6f4f0;
          color: #1c1f26;
          padding: 20px;
          text-align: center;
          font-family: var(--font-sans), sans-serif;
        ">
          <p style="font-family: var(--font-serif), serif; font-size: 18px; margin-bottom: 8px;">Map Preview</p>
          <p style="font-size: 11px; color: #8c8376; max-width: 320px; line-height: 1.5; letter-spacing: 0.05em; text-transform: uppercase;">
            Please add your Mapbox Access Token to <code>.env.local</code> to activate the interactive map.
          </p>
          <div style="margin-top: 16px; font-size: 10px; color: #c9a84c; font-weight: 500; letter-spacing: 0.1em;">
            [ NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN ]
          </div>
        </div>
      `;
      return;
    }

    mapboxgl.accessToken = token;

    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [project.lng, project.lat],
      zoom: 14.5,
      scrollZoom: false,
      attributionControl: true
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    // Custom marker elements
    const markerEl = document.createElement("div");
    markerEl.style.width = "20px";
    markerEl.style.height = "20px";
    markerEl.style.background = "rgba(179, 142, 54, 0.4)";
    markerEl.style.border = "2px solid #B38E36";
    markerEl.style.borderRadius = "50%";
    markerEl.style.display = "flex";
    markerEl.style.alignItems = "center";
    markerEl.style.justifyContent = "center";

    const innerDot = document.createElement("div");
    innerDot.style.width = "8px";
    innerDot.style.height = "8px";
    innerDot.style.background = "#B38E36";
    innerDot.style.borderRadius = "50%";
    markerEl.appendChild(innerDot);

    const popup = new mapboxgl.Popup({ offset: 15, closeButton: false })
      .setHTML(`<div class="font-sans text-[11px] tracking-[0.05em] uppercase font-semibold text-[#1c1f26] p-1">${project.name}</div>`);

    const marker = new mapboxgl.Marker(markerEl)
      .setLngLat([project.lng, project.lat])
      .setPopup(popup)
      .addTo(map);

    // Auto open popup
    popup.addTo(map);

    const resizeTimer = setTimeout(() => {
      map.resize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
    };
  }, [project]);

  // Handle inquiry submit
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project) return;
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
        source: "Website",
        details: { Property: project.name },
      });
      setFormStatus("done");
      setFormName("");
      setFormEmail("");
      setFormMessage("");
    } catch {
      setFormStatus("error");
    }
  };

  const stageConfig = project ? STAGES[project.stage] || { label: "Pre-Construction", dot: "#f59e0b", index: 0 } : { label: "Pre-Construction", dot: "#f59e0b", index: 0 };
  const currentStageIndex = stageConfig.index;

  // Real Property Address
  const projectAddress = useMemo(() => {
    if (!project) return "";
    return `${project.name}, ${project.neighborhood}, Miami, FL`;
  }, [project]);

  // Progress percentage logic based on real MLS stage
  const progressPercentage = useMemo(() => {
    if (!project) return 15;
    if (project.stage === "preconstruction") return 15;
    if (project.stage === "under_construction") return 50;
    if (project.stage === "topped_off") return 80;
    if (project.stage === "move_in_ready") return 100;
    return 100;
  }, [project]);

  // Authentic property description from BeachesMLS / Miami AOR
  const paragraphs = useMemo(() => {
    if (!project) return [];
    const realDesc = (project as any).description;
    if (realDesc && realDesc.length > 30) {
      const rawParas = realDesc.split(/\n\s*\n/).filter((p: string) => p.trim().length > 0);
      if (rawParas.length >= 2) return rawParas;

      const sentences = realDesc.split(/(?<=[.?!])\s+/);
      const half = Math.ceil(sentences.length / 2);
      const p1 = sentences.slice(0, half).join(" ");
      const p2 = sentences.slice(half).join(" ");
      return [p1, p2].filter(Boolean);
    }

    return [
      `Featuring spacious living areas in ${project.neighborhood}, this premier residence is an active listing on BeachesMLS and Miami Association of Realtors.`,
      `Offering an elite luxury lifestyle in South Florida, represented by Zachary Akers (MR Luxury Group · ONE Sotheby's International Realty).`
    ];
  }, [project]);

  if (!project) {
    return <PropertyDetailSkeleton />;
  }

  return (
    <main className="property-page bg-[#FAF8F3] min-h-screen text-[#1c1f26]">
      {/* Premium Header/Navbar */}
      <header className={`site-header site-header-light ${isScrolled ? "site-header-scrolled" : ""}`}>
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
                openInquiry(project?.name);
              }}
              className="nav-inquire-btn"
            >
              Inquire
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Container - Rounded Grid Collage */}
      <section className="max-w-[1140px] mx-auto px-6 pt-28 pb-8">
        <div className="relative overflow-hidden rounded-[8px] bg-[#FAF8F3]">
          <div className="property-hero-collage grid grid-cols-1 md:grid-cols-[2.1fr_1fr] gap-[4px] h-[340px] md:h-[450px] bg-[#FAF8F3]">
            <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(0)}>
              <Image
                fill
                priority
                src={getSafeImage(project.imgs, project.img, 0)}
                alt={project.name}
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                onError={handleImageError}
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm px-3.5 py-1.5 rounded-full flex items-center gap-2 z-20">
                <span className="w-2 h-2 rounded-full bg-[#10b981] luxury-pulse-badge" />
                <span className="text-[9px] text-white font-mono tracking-[0.14em] uppercase font-semibold">
                  {project.statusRemark || `${stageConfig.label} · Built ${project.completion}`}
                </span>
              </div>

              {/* View All Photos trigger on mobile */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIdx(0);
                }}
                className="md:hidden absolute bottom-4 right-4 bg-black/85 hover:bg-black text-white text-[10px] font-mono tracking-[0.14em] uppercase px-4 py-2 rounded-full z-20 cursor-pointer transition-all flex items-center gap-2 shadow-xl border border-white/20"
              >
                <span>📷 View Photos ({galleryImgs.length})</span>
              </button>
            </div>

            <div className="hidden md:grid grid-rows-2 gap-[4px] h-full relative">
              <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(1)}>
                <Image
                  fill
                  src={getSafeImage(project.imgs, project.img, 1)}
                  alt={`${project.name} Photo 2`}
                  className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                  onError={handleImageError}
                />
              </div>
              <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(2)}>
                <Image
                  fill
                  src={getSafeImage(project.imgs, project.img, 2)}
                  alt={`${project.name} Photo 3`}
                  className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                  onError={handleImageError}
                />
              </div>

              {/* Photo Count Indicator / View All Photos on desktop */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIdx(0);
                }}
                className="absolute bottom-4 right-4 bg-black/85 hover:bg-black text-white text-[10px] font-mono tracking-[0.14em] uppercase px-4 py-2.5 rounded-full z-20 cursor-pointer transition-all flex items-center gap-2 shadow-xl border border-white/20 hover:scale-105"
              >
                <span>📷 View All Photos ({galleryImgs.length})</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main content metadata & Spec layout */}
      <section className="max-w-[1140px] mx-auto px-6 pb-20">
        {/* Back Button & Compare trigger */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-[#8f96ab] hover:text-[#1c1f26] text-[10px] tracking-[0.2em] uppercase transition-colors flex items-center gap-1"
          >
            &larr; Back
          </button>
          
          <button
            onClick={handleToggleCompare}
            className={`text-[9px] tracking-[0.25em] uppercase transition-all px-4 py-2.5 border flex items-center gap-2 font-semibold ${
              isCompared
                ? "bg-[#B38E36] border-[#B38E36] text-white"
                : "border-[#1c1f26] text-[#1c1f26] hover:bg-[#1c1f26] hover:text-white"
            }`}
          >
            {isCompared ? "✓ Compared" : "+ Compare Development"}
          </button>
        </div>

        {/* Kicker & Title */}
        <span className="text-[10px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
          {project.neighborhood} &middot; New Construction
        </span>
        <h1 className="text-3xl md:text-5xl font-serif font-normal text-[#1c1f26] leading-[1.1] mb-2">
          {project.name}
        </h1>
        <p className="text-xs text-[#8f96ab] tracking-[0.05em] font-light mb-8">
          {projectAddress}
        </p>

        {/* Core Stats Cards - Two Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <div className="bg-white border border-[#e8e4db] rounded-[4px] p-6 shadow-sm">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#8f96ab] block mb-2">From</span>
            <strong className="text-3xl md:text-4xl font-serif font-normal text-[#1c1f26]">
              {formatPriceStr(project.minPrice)}
            </strong>
          </div>

          <div className="bg-white border border-[#e8e4db] rounded-[4px] p-6 shadow-sm">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#8f96ab] block mb-2">Delivery</span>
            <strong className="text-3xl md:text-4xl font-serif font-normal text-[#1c1f26]">
              {project.completion}
            </strong>
          </div>
        </div>

        {/* Real MLS Specs Grid */}
        <div className="mb-14">
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#8c8376] font-semibold">
            Property Specifications &amp; Overview
          </h4>
          <div className="border-b border-[#ddd8cd] mt-2 mb-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-0">
            <div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 text-xs">
                <span className="text-[#8f96ab] font-light">MLS Listing ID</span>
                <span className="text-[#1c1f26] font-mono font-medium">{project.mlsId || "—"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 text-xs">
                <span className="text-[#8f96ab] font-light">Listing Status</span>
                <span className="text-[#10b981] font-semibold uppercase tracking-wider text-[11px]">
                  {project.statusRemark || "Active"}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 md:border-b-0 text-xs">
                <span className="text-[#8f96ab] font-light">Neighborhood</span>
                <span className="text-[#1c1f26] font-medium">{project.neighborhood}</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 text-xs">
                <span className="text-[#8f96ab] font-light">Bedrooms</span>
                <span className="text-[#1c1f26] font-mono font-medium">{project.minBed ? `${project.minBed} Beds` : "—"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 text-xs">
                <span className="text-[#8f96ab] font-light">Bathrooms</span>
                <span className="text-[#1c1f26] font-mono font-medium">{project.baths ? `${project.baths} Baths` : "—"}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-[#ddd8cd]/60 text-xs">
                <span className="text-[#8f96ab] font-light">Living Area (Sq Ft)</span>
                <span className="text-[#1c1f26] font-mono font-medium">{project.sqft ? `${project.sqft.toLocaleString()} SF` : (project.units || "—")}</span>
              </div>
              {project.pricePerSqft ? (
                <div className="flex justify-between items-center py-3 border-b-0 text-xs">
                  <span className="text-[#8f96ab] font-light">Price / Sq Ft</span>
                  <span className="text-[#B38E36] font-mono font-medium">${project.pricePerSqft.toLocaleString()}/SF</span>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Momentum / Construction Progress */}
        <div className="mb-14">
          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#8c8376] font-semibold">
            Status &amp; Timeline
          </h4>
          <div className="border-b border-[#ddd8cd] mt-2 mb-6" />

          <div className="flex justify-between items-end mb-4">
            <span className="text-[9px] uppercase tracking-[0.18em] text-[#8f96ab]">
              MLS STATUS &middot; {stageConfig.label.toUpperCase()}
            </span>
            <span className="text-[10px] font-mono font-medium text-[#1c1f26]">
              Built / Delivery: {project.completion}
            </span>
          </div>

          {/* Progress Slider Line */}
          <div className="relative w-full py-4">
            <div className="absolute top-[20px] left-0 right-0 h-[2px] bg-[#d9d3c5]" />
            <div
              className="absolute top-[20px] left-0 h-[2px] bg-[#1c1f26] transition-all duration-700"
              style={{ width: `${progressPercentage}%` }}
            />

            {/* Indicator nodes */}
            <div className="relative flex justify-between z-10">
              {STAGE_STEPS.map((step, idx) => {
                const stepPercentage = idx * 33.3;
                const isActive = progressPercentage >= stepPercentage;
                return (
                  <div key={step.key} className="flex flex-col items-center w-[20%] text-center">
                    <span
                      className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center transition-colors duration-300 ${isActive
                        ? "bg-[#1c1f26] border-[#1c1f26]"
                        : "bg-white border-[#d9d3c5]"
                        }`}
                    />
                    <span className={`mt-3 text-[9px] tracking-[0.05em] uppercase font-mono ${isActive ? "text-[#1c1f26] font-medium" : "text-[#8f96ab] font-light"}`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Vertical slider handle marker */}
            <div
              className="absolute top-[13px] w-4 h-4 rounded-full bg-[#B38E36] border-2 border-white shadow-md z-20 transition-all duration-700 -ml-2"
              style={{ left: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* Project CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-start mt-10">
          <button
            type="button"
            onClick={() => openInquiry(project?.name)}
            className="px-8 py-4 bg-[#1c1f26] !text-[#f6f4f0] hover:bg-[#b79255] hover:!text-[#1c1f26] text-[10px] uppercase tracking-[0.25em] font-semibold text-center transition-colors rounded-[2px] cursor-pointer"
          >
            INQUIRE ABOUT THIS PROPERTY
          </button>
          <button
            type="button"
            onClick={() => setActiveImgIdx(0)}
            className="px-8 py-4 border border-[#1c1f26] !text-[#1c1f26] hover:bg-[#1c1f26] hover:!text-[#f6f4f0] text-[10px] uppercase tracking-[0.25em] font-semibold text-center transition-colors rounded-[2px] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>VIEW ALL PHOTOS ({galleryImgs.length})</span>
            <span>&rarr;</span>
          </button>
        </div>
      </section>

      {/* 3. EDITORIAL STORY SECTION */}
      <section className="property-story-editorial py-20 bg-[#ffffff] border-y border-[#ddd8cd] text-[#1c1f26]">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-12 lg:gap-20 items-center">
            <div>
              <div className="mb-6 flex items-center gap-4">
                <span className="h-px w-6 bg-[#B38E36]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#B38E36] font-semibold">
                  THE STORY
                </span>
              </div>
              <h2 className="text-3xl md:text-[40px] font-normal leading-[1.1] tracking-[-0.02em] font-serif text-[#1c1f26] mb-8">
                Visionary Architecture &amp; Luxury Residences
              </h2>
              <div className="text-base font-light leading-[1.8] text-[#535862] flex flex-col gap-6">
                <p>{paragraphs[0]}</p>
                <p>{paragraphs[1]}</p>
              </div>
            </div>
            <div className="relative aspect-[0.74/1] w-full max-w-[420px] mx-auto bg-[#f6f4f0] rounded-[3px] overflow-hidden shadow-xl border border-[#e2e8f0]">
              <Image
                fill
                src={getSafeImage(project.imgs, project.img, 3)}
                alt="Luxury Lounge Space"
                className="object-cover"
                onError={handleImageError}
              />
            </div>
          </div>
        </div>
      </section>

      {/* 4. SECONDARY EDITORIAL SECTION */}
      <section className="property-story-life py-20 bg-[#FAF8F3] border-b border-[#ddd8cd] text-[#1c1f26]">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.3fr] gap-12 lg:gap-20 items-center">
            <div className="relative aspect-[16/10] w-full bg-[#f6f4f0] rounded-[3px] overflow-hidden shadow-lg border border-[#ddd8cd] order-2 lg:order-1">
              <Image
                fill
                src={getSafeImage(project.imgs, project.img, 4)}
                alt="Luxury Dining Space"
                className="object-cover"
                onError={handleImageError}
              />
            </div>
            <div className="order-1 lg:order-2">
              <div className="mb-6 flex items-center gap-4">
                <span className="h-px w-6 bg-[#B38E36]" />
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#B38E36] font-semibold">
                  THE LIFE
                </span>
              </div>
              <h2 className="text-3xl md:text-[40px] font-normal leading-[1.1] tracking-[-0.02em] font-serif text-[#1c1f26] mb-8">
                The Residence &amp; Lifestyle
              </h2>
              <div className="text-base font-light leading-[1.8] text-[#535862] flex flex-col gap-6 mb-10">
                <p>{paragraphs[1] || paragraphs[0]}</p>
              </div>

              {/* Stats Mini Dashboard */}
              <div className="grid grid-cols-3 border-t border-[#ddd8cd] pt-8">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#8f96ab] block mb-1">Status</span>
                  <strong className="text-sm font-serif text-[#1c1f26]">{project.statusRemark || stageConfig.label}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#8f96ab] block mb-1">Built / Delivery</span>
                  <strong className="text-sm font-serif text-[#1c1f26]">{project.completion}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase tracking-[0.15em] text-[#8f96ab] block mb-1">Price / SF</span>
                  <strong className="text-sm font-serif text-[#B38E36]">{project.pricePerSqft ? `$${project.pricePerSqft.toLocaleString()}/SF` : (project.units || "Active MLS")}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. LANDSCAPE FULL-WIDTH BANNER 1 */}
      <section className="relative h-[300px] md:h-[450px] bg-[#0c1523] w-full">
        <Image
          fill
          src={getSafeImage(project.imgs, project.img, 5)}
          alt={`${project.name} Wide View`}
          className="object-cover opacity-95"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-black/10" />
      </section>

      {/* 6. PROPERTY GALLERY SECTION WITH SLIDER */}
      <section className="property-gallery py-20 bg-[#ffffff] border-b border-[#ddd8cd] text-[#1c1f26]">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="mb-12 flex justify-between items-end">
            <div>
              <span className="text-[10px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
                OFFICIAL MLS PHOTOGRAPHY
              </span>
              <h2 className="text-3xl font-serif font-normal text-[#1c1f26]">
                Property Gallery
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setActiveImgIdx(0)}
              className="text-xs uppercase tracking-[0.2em] font-semibold text-[#B38E36] hover:text-[#1c1f26] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>View All Photos ({galleryImgs.length})</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImgs.map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative aspect-[1.4/1] overflow-hidden rounded-[2px] border border-[#e2e8f0] cursor-pointer bg-[#f6f4f0]"
                onClick={() => setActiveImgIdx(idx)}
              >
                <img
                  src={getImageUrl(imgUrl)}
                  alt={`${project.name} - Photo ${idx + 1}`}
                  loading="lazy"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-[#0C1523]/35 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-[9px] uppercase tracking-[0.2em] font-semibold bg-[#B38E36] px-3.5 py-1.5 rounded-[1px] shadow-lg">
                    Expand Photo
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. LANDSCAPE FULL-WIDTH BANNER */}
      <section className="relative h-[300px] md:h-[450px] bg-[#0c1523] w-full">
        <Image
          fill
          src={getSafeImage(project.imgs, project.img, 6)}
          alt={`${project.name} Panoramic View`}
          className="object-cover opacity-90"
          onError={handleImageError}
        />
        <div className="absolute inset-0 bg-black/10" />
      </section>

      {/* 8. LOCATION & MAP */}
      <section className="property-location bg-[#FAF8F3] py-20 text-[#1c1f26] border-b border-[#ddd8cd] relative z-0">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="mb-10 text-left">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
              NEIGHBORHOOD SETTING
            </span>
            <h2 className="text-3xl font-serif font-normal text-[#1c1f26]">
              Location &amp; Setting
            </h2>
          </div>
          <div className="property-map-wrap relative h-[420px] rounded-[3px] border border-[#ddd8cd] overflow-hidden" ref={mapContainerRef} />
        </div>
      </section>

      {/* 13. BROKER ADVISOR PROFILE */}
      <section className="property-broker py-20 bg-[#FAF8F3] border-b border-[#ddd8cd] text-[#1c1f26]">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="bg-white border border-[#ddd8cd] rounded-[4px] shadow-xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-8 lg:gap-14 items-center">
              <div className="relative aspect-[0.82/1] w-full max-w-[280px] mx-auto rounded-[3px] overflow-hidden bg-[#d9d1c5] border border-[#e2e8f0]">
                <Image
                  fill
                  src="/images/imagereader.webp"
                  alt="Zachary Akers"
                  sizes="280px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-col justify-between h-full text-left">
                <div>
                  <span className="text-[9px] uppercase tracking-[0.28em] text-[#8f96ab] font-semibold block mb-2">
                    LUXURY REAL ESTATE ADVISOR
                  </span>
                  <h3 className="text-3xl md:text-4xl font-serif font-normal text-[#1c1f26] mb-3">
Zachary Akers
                  </h3>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#7c8498] font-light mb-6">
                    MR LUXURY GROUP &middot; ONE SOTHEBY&apos;S INTERNATIONAL REALTY
                  </p>
                  <p className="text-xs md:text-sm font-light leading-relaxed text-[#535862] max-w-[580px] mb-8">
                    Zach, is a veteran of 14 years in the real estate industry working both in sales, as well as luxury new-construction and development. Zach is adept at understanding the relationship between investment and emotional connection to your property. With vast experience working with homeowners from all walks of life and backgrounds, he understands that no home buyer or seller is the same, but they all want results. Zach will help you purchase or sell your property seamlessly and with integrity.
                  </p>
                </div>

                {/* Highlight Counters */}
                <div className="grid grid-cols-3 border-y border-[#ddd8cd] py-6 mb-8 max-w-[640px]">
                  <div>
                    <strong className="block text-2xl font-serif font-normal text-[#1c1f26]">15+</strong>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#8c8376] mt-1 block">Years Experience</span>
                  </div>
                  <div>
                    <strong className="block text-2xl font-serif font-normal text-[#1c1f26]">$1.2B+</strong>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#8c8376] mt-1 block">Career Sales</span>
                  </div>
                  <div>
                    <strong className="block text-2xl font-serif font-normal text-[#1c1f26]">#3</strong>
                    <span className="text-[9px] uppercase tracking-[0.15em] text-[#8c8376] mt-1 block">Ranked Team</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
                  <a
                    href="#contact-section"
                    className="px-6 py-3.5 bg-[#bb9751] hover:bg-[#a88543] text-white text-[10px] uppercase tracking-[0.2em] font-semibold text-center transition-colors rounded-[2px]"
                  >
                    SCHEDULE PRIVATE PRESENTATION
                  </a>
                  <div className="flex gap-6 justify-center sm:justify-start items-center text-xs font-mono">
                    <a href="tel:7864758134" className="hover:text-[#bb9751] transition-colors">
                      📞 786.475.8134
                    </a>
                    <a href="mailto:zakers@me.com" className="hover:text-[#bb9751] transition-colors">
                      ✉ Email Advisor
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 14. INQUIRY INTAKE FORM */}
      <section className="property-inquiry bg-[#ffffff] py-20 text-[#1c1f26] border-b border-[#ddd8cd]" id="contact-section">
        <div className="property-container max-w-[800px] mx-auto px-6 text-center">
          <span className="text-[10px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
            PRIVATE INTAKE
          </span>
          <h2 className="contact-info-title text-[#1c1f26] mb-2 text-3xl font-serif font-normal">
            Request Availability &amp; Presentation
          </h2>
          <p className="contact-info-desc text-[#5f6575] mb-8 font-light text-sm max-w-[540px] mx-auto">
            Schedule a private virtual presentation or receive unit-level availability, floor plans, and incentives for {project.name}.
          </p>

          <div className="max-w-[640px] mx-auto text-left mt-10">
            {formStatus === "done" ? (
              <div className="p-8 bg-green-500/5 border border-green-500/20 rounded text-center">
                <h4 className="text-xl font-serif text-green-600 mb-2">Inquiry Received</h4>
                <p className="text-xs text-[#535862] leading-relaxed">
                  Thank you. Availability and presentation options for {project.name} will be sent to your email shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleInquirySubmit} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-group-custom">
                    <input
                      type="text"
                      placeholder="Your Name"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="form-input-custom"
                    />
                  </div>

                  <div className="form-group-custom">
                    <input
                      type="email"
                      required
                      placeholder="Your Email Address"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className={`form-input-custom ${formStatus === "error" && !formEmail.trim() ? "border-[#C9A84C]" : ""}`}
                    />
                    {formStatus === "error" && !formEmail.trim() && (
                      <span className="text-[10px] text-[#C9A84C] mt-1">Please enter a valid email address.</span>
                    )}
                  </div>
                </div>

                <div className="form-group-custom">
                  <textarea
                    placeholder={`Interested in ${project.name}. Please send unit-level pricing, floor plans, and current incentives.`}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    rows={4}
                    className="form-input-custom resize-none"
                  />
                </div>

                <div className="text-center pt-2">
                  <button
                    type="submit"
                    disabled={formStatus === "sending"}
                    className="form-submit-btn-custom min-w-[200px]"
                  >
                    {formStatus === "sending" ? "Sending..." : "SUBMIT REQUEST"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 15. EXPLORE OTHER PROPERTIES */}
      <section className="property-related bg-[#FAF8F3] py-20 text-[#1c1f26] border-t border-[#e2e8f0]">
        <div className="property-container max-w-[1140px] mx-auto px-6">
          <div className="mb-12 text-left">
            <span className="text-[10px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
              DISCOVER MORE
            </span>
            <h2 className="text-3xl font-serif font-normal text-[#1c1f26]">
              Other Exquisite Developments
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProjects.map((proj) => {
              const conf = STAGES[proj.stage] || { label: "Pre-Construction", dot: "#f59e0b" };
              const displayMeta = [
                proj.stories ? `${proj.stories} stories` : null,
                proj.units ? `${proj.units} units` : null,
                proj.neighborhood,
              ]
                .filter(Boolean)
                .join(" · ");

              return (
                <div
                  key={proj.slug}
                  onClick={() => router.push(`/property/${proj.slug}`)}
                  className="neighborhood-property-card bg-white cursor-pointer"
                >
                  <div className="npc-image-wrap relative aspect-[1.3/1]">
                    <img
                      src={getImageUrl(proj.img)}
                      alt={proj.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                    {proj.comingSoon && (
                      <span className="npc-badge npc-badge--coming-soon">Coming Soon</span>
                    )}
                    {proj.badge && !proj.comingSoon && (
                      <span className="npc-badge">{proj.badge}</span>
                    )}
                  </div>

                  <div className="npc-details p-5">
                    <div className="npc-header pb-4 border-b border-[#FAF8F3] mb-4">
                      <div className="npc-title-row flex justify-between items-center mb-1">
                        <h4 className="npc-name text-[16px] font-serif font-normal text-[#1c1f26] truncate max-w-[85%]">{proj.name}</h4>
                        <span className="npc-dot w-2 h-2 rounded-full" style={{ background: conf.dot }} />
                      </div>
                      <span className="npc-meta text-[10px] text-[#8f96ab] font-light block">{displayMeta}</span>
                    </div>

                    <div className="npc-footer flex justify-between items-center mt-auto">
                      <div className="npc-price-block">
                        <span className="npc-label text-[8px] uppercase text-[#8f96ab]">Price From</span>
                        <span className="npc-value font-mono text-[11px] font-medium text-[#1c1f26]">{formatPriceStr(proj.priceFrom)}</span>
                      </div>
                      <div className="npc-stage-block text-right">
                        <span className="npc-label text-[8px] uppercase text-[#8f96ab]">Stage</span>
                        <span className="npc-value font-mono text-[11px] font-medium text-[#1c1f26] block">{conf.label}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Global Luxury Lightbox Slider Modal */}
      {activeImgIdx !== null && (
        <div
          className="property-lightbox fixed inset-0 bg-[#070b12]/98 backdrop-blur-2xl z-[9999] flex flex-col justify-between items-center py-5 px-4 md:px-8 select-none transition-all duration-300 animate-in fade-in"
          onClick={() => setActiveImgIdx(null)}
        >
          {/* Top Modal Navigation Bar */}
          <div
            className="w-full max-w-[1400px] flex justify-between items-center z-50 text-white border-b border-white/10 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#B38E36] font-semibold">
                {project.neighborhood} &middot; {project.badge || "BEACHESMLS ACTIVE"}
              </span>
              <h3 className="font-serif text-lg md:text-xl text-white font-normal tracking-wide">
                {project.name}
              </h3>
            </div>

            {/* Photo Counter Pill */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-mono tracking-widest border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Photo {activeImgIdx + 1} of {galleryImgs.length}
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setActiveImgIdx(null)}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-[#B38E36] text-white hover:text-[#0c1523] text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 border border-white/15 cursor-pointer"
                aria-label="Close modal"
              >
                <span>Close</span>
                <span className="text-sm font-bold">&times;</span>
              </button>
            </div>
          </div>

          {/* Main Photo Showcase with Navigation Arrows */}
          <div
            className="relative w-full max-w-[1300px] h-[64vh] md:h-[68vh] flex items-center justify-center my-auto z-40"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Prev Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) => (prev !== null && galleryImgs.length > 0 ? (prev - 1 + galleryImgs.length) % galleryImgs.length : prev));
              }}
              className="absolute left-2 md:left-4 z-50 text-white bg-black/60 hover:bg-[#B38E36] hover:text-[#0c1523] p-3.5 md:p-4 rounded-full transition-all duration-200 focus:outline-none border border-white/20 shadow-2xl cursor-pointer hover:scale-110"
              aria-label="Previous photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Centered Large Photo */}
            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={getImageUrl(galleryImgs[activeImgIdx % galleryImgs.length])}
                alt={`${project.name} photo ${(activeImgIdx % galleryImgs.length) + 1}`}
                className="max-w-full max-h-full object-contain select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[4px] border border-white/10"
                onError={handleImageError}
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) => (prev !== null && galleryImgs.length > 0 ? (prev + 1) % galleryImgs.length : prev));
              }}
              className="absolute right-2 md:right-4 z-50 text-white bg-black/60 hover:bg-[#B38E36] hover:text-[#0c1523] p-3.5 md:p-4 rounded-full transition-all duration-200 focus:outline-none border border-white/20 shadow-2xl cursor-pointer hover:scale-110"
              aria-label="Next photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom Thumbnails Filmstrip */}
          <div
            className="w-full max-w-[1200px] flex flex-col items-center gap-2 z-50 pt-2 border-t border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex items-center justify-center gap-2 overflow-x-auto py-2 px-4 scrollbar-none">
              {galleryImgs.map((thumbUrl, idx) => {
                const isActive = idx === activeImgIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImgIdx(idx)}
                    className={`relative w-16 h-12 md:w-20 md:h-14 flex-shrink-0 rounded-[2px] overflow-hidden transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "ring-2 ring-[#B38E36] ring-offset-2 ring-offset-[#070b12] scale-105 opacity-100"
                        : "opacity-45 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={getImageUrl(thumbUrl)}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                );
              })}
            </div>

            <div className="text-white/50 font-mono text-[11px] tracking-widest sm:hidden">
              {activeImgIdx + 1} / {galleryImgs.length}
            </div>
          </div>
        </div>
      )}

      {/* Global Footer */}
      <SiteFooter />

      {/* Find My Project Wizard Modal */}
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
