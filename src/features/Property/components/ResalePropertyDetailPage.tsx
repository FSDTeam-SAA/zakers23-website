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
import { toast } from "sonner";
import { HoneypotField } from "@/src/components/HoneypotField";
import MobileNavMenu from "@/src/components/MobileNavMenu";
import { handleImageError, LUXURY_FALLBACK_IMAGE_URL, getSafeImageUrl } from "@/src/lib/image-utils";

export interface ResaleProperty {
  id: number;
  slug: string;
  name: string;
  shortName?: string;
  neighborhood: string;
  stage?: string;
  lat: number;
  lng: number;
  minPrice: number | null;
  maxPrice: number | null;
  minBed: number | null;
  maxBed: number | null;
  baths?: number | null;
  sqft?: number | null;
  priceFrom: string;
  completion?: string;
  yearBuilt?: number | string;
  lotSize?: string;
  acres?: number | null;
  daysOnMarket?: number;
  waterfrontDetails?: string;
  dockDetails?: string | null;
  pricePerSqft?: number | null;
  mlsId?: string;
  badge?: string;
  img: string;
  imgs?: string[];
  description?: string;
  fullDetailsURL?: string;
  address?: string;
  tagline?: string;
  listingOffice?: string;
  listingAgent?: string;
  statusRemark?: string;
  isResale?: boolean;
  propertyType?: string;
  propertySubtype?: string;
  propertySubtypeLabel?: string;
  developer?: string;
  units?: string | number | null;
}

function formatCurrency(val: number | string | null | undefined): string {
  if (val === null || val === undefined) return "Pricing on request";
  if (typeof val === "string" && val.startsWith("$")) return val;
  const num = typeof val === "number" ? val : parseFloat(String(val).replace(/[^0-9.]/g, ""));
  if (isNaN(num)) return String(val);
  return `$${num.toLocaleString("en-US")}`;
}

export default function ResalePropertyDetailPage({
  slug,
  initialProject,
}: {
  slug: string;
  initialProject?: ResaleProperty;
}) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [properties, setProperties] = useState<ResaleProperty[]>(
    initialProject ? [initialProject] : []
  );
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeImgIdx, setActiveImgIdx] = useState<number | null>(null);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);

  // Form intake state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formMessage, setFormMessage] = useState("");
  const [formHoneypot, setFormHoneypot] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  // Fetch all properties to supply "Similar Resale Properties"
  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/idx/properties", { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => {
        if (data.projects && Array.isArray(data.projects)) {
          setProperties(data.projects);
        }
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name !== "AbortError") {
          console.error(error);
        }
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Resolve active property
  const property = useMemo(() => {
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
    const found = properties.find((item) => item.slug.toLowerCase() === cleanSlug);
    if (found) return found;

    const slugParts = cleanSlug.split("-");
    const possibleMls = slugParts[slugParts.length - 1]?.toUpperCase();
    if (possibleMls) {
      const byMls = properties.find(
        (p) =>
          p.mlsId?.toUpperCase() === possibleMls ||
          p.badge?.toUpperCase().includes(possibleMls) ||
          String(p.id).toUpperCase() === possibleMls
      );
      if (byMls) return byMls;
    }

    if (initialProject) return initialProject;
    return properties[0] || null;
  }, [properties, slug, initialProject]);

  // Gallery images with fallbacks
  const galleryImgs = useMemo(() => {
    if (!property) return [];
    const pool = (property.imgs && property.imgs.length > 0 ? property.imgs : [property.img])
      .filter((url): url is string => typeof url === "string" && url.trim().length > 0)
      .filter((url) => !url.toLowerCase().includes("waldorf"));
    return pool.length > 0 ? pool : [LUXURY_FALLBACK_IMAGE_URL];
  }, [property]);

  // Related resale estates (excluding current and pre-construction developments)
  const relatedResaleHomes = useMemo(() => {
    if (!property) return [];
    return properties
      .filter(
        (p) =>
          p.slug !== property.slug &&
          (p.isResale || p.propertyType === "resale" || (!p.developer && p.mlsId))
      )
      .slice(0, 4);
  }, [properties, property]);

  // Format and sanitize description text
  const formattedDescription = useMemo(() => {
    if (!property?.description) return "";
    return property.description
      .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s*,/gi, '“Winter White House” of President Richard Nixon,')
      .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s+(?!President|Richard)/gi, '“Winter White House” of President Richard Nixon, ');
  }, [property?.description]);

  // Mapbox initialization
  useEffect(() => {
    if (!property || !mapContainerRef.current) return;
    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      mapContainerRef.current.innerHTML = `
        <div style="display:flex;height:100%;align-items:center;justify-content:center;background:#0c1523;color:#8f96ab;font-family:sans-serif;font-size:12px;letter-spacing:0.15em;text-transform:uppercase;">
          Interactive Map Setting Available
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
      center: [property.lng, property.lat],
      zoom: 14.5,
      scrollZoom: false,
      attributionControl: true,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

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

    const popup = new mapboxgl.Popup({ offset: 15, closeButton: false }).setHTML(
      `<div class="font-sans text-[12px] tracking-[0.05em] uppercase font-semibold text-[#1c1f26] p-1">${property.name}</div>`
    );

    new mapboxgl.Marker(markerEl)
      .setLngLat([property.lng, property.lat])
      .setPopup(popup)
      .addTo(map);

    popup.addTo(map);

    const timer = setTimeout(() => {
      map.resize();
    }, 250);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
    };
  }, [property]);

  // Intake submission handler
  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formHoneypot) return;
    if (!formEmail.trim()) {
      setFormStatus("error");
      toast.error("Please enter your email address.");
      return;
    }

    setFormStatus("sending");
    try {
      const res = await submitInquiry({
        name: formName || "Resale Inquiry",
        email: formEmail,
        phone: formPhone || undefined,
        message:
          formMessage ||
          `Interested in resale estate: ${property?.name} (${property?.mlsId || "MLS Active"}). Please arrange a private showing and send documentation.`,
        projectName: property?.name || "Resale Home",
        source: "resale-property-detail",
        buttonClicked: "Request Private Showing",
      });

      if (res.success) {
        setFormStatus("done");
        toast.success("Private showing request received. Zachary Akers will be in touch shortly.");
      } else {
        setFormStatus("error");
        toast.error("Unable to submit showing request. Please call or WhatsApp Zachary directly.");
      }
    } catch {
      setFormStatus("error");
      toast.error("Network error. Please contact Zachary Akers directly.");
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="font-serif text-2xl text-[#1c1f26] mb-2">Listing Loading...</h2>
          <p className="text-xs text-[#8f96ab] uppercase tracking-widest font-mono">
            Loading property details...
          </p>
        </div>
      </div>
    );
  }

  // Derived formatted resale fields
  const displayPrice = property.minPrice
    ? formatCurrency(property.minPrice)
    : (property.priceFrom || "Pricing on request");

  const displayBeds = property.minBed
    ? `${property.minBed} Beds`
    : (property.maxBed ? `${property.maxBed} Beds` : "—");

  const displayBaths = property.baths ? `${property.baths} Baths` : "—";

  const displaySqft = property.sqft
    ? `${property.sqft.toLocaleString("en-US")} SF`
    : (property.units && !String(property.units).includes("Luxury") ? String(property.units) : "—");

  const displayYearBuilt = property.yearBuilt
    ? String(property.yearBuilt)
    : (property.completion && !isNaN(Number(property.completion)) ? property.completion : "Custom Built");

  const displayLotSize = property.lotSize || (property.acres ? `${property.acres} Acres` : "Prime Estate Parcel");

  const displayDaysOnMarket = property.daysOnMarket
    ? `${property.daysOnMarket} Days`
    : "Active on MLS";

  const displayPpsf = property.pricePerSqft
    ? `$${property.pricePerSqft.toLocaleString("en-US")}/SF`
    : (property.minPrice && property.sqft ? `$${Math.round(property.minPrice / property.sqft).toLocaleString("en-US")}/SF` : null);

  const addressDisplay = property.address || `${property.name}, ${property.neighborhood}, FL`;

  return (
    <main className="min-h-screen bg-[#FAF8F3] text-[#1c1f26] font-sans antialiased selection:bg-[#B38E36]/20">
      {/* Premium Header/Navbar */}
      <header className={`site-header site-header-light ${isScrolled ? "site-header-scrolled" : ""}`}>
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <Image
              src="/images/mcs-symbol.svg"
              alt="Miami New Development"
              width={56}
              height={56}
              className="site-logo h-10 w-10 md:h-12 md:w-12 object-contain"
              priority
            />
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/map">Explore Map</Link>
            <Link href="/find-my-project">Find My Project</Link>
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
            <Link href="/waterfront">Waterfront Homes</Link>
            <Link href="/insights">Insights</Link>
            <a
              href="/#contact"
              onClick={(event) => {
                event.preventDefault();
                openInquiry(`Resale Inquiry — ${property.name}`);
              }}
              className="nav-inquire-btn"
            >
              Inquire
            </a>
          </nav>
          <MobileNavMenu onOpenMatcher={() => setIsMatcherOpen(true)} isLightHeader={true} projectName={property?.name} />
        </div>
      </header>

      {/* Hero Showcase Photography Section - Rounded Grid Collage */}
      <section className="max-w-[1140px] mx-auto px-6 pt-28 pb-8">
        <div className="relative overflow-hidden rounded-[8px] bg-[#FAF8F3]">
          <div className="property-hero-collage grid grid-cols-1 md:grid-cols-[2.1fr_1fr] gap-[4px] h-[340px] md:h-[450px] bg-[#FAF8F3]">
            <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(0)}>
              <Image
                fill
                priority
                src={getSafeImageUrl(galleryImgs[0], LUXURY_FALLBACK_IMAGE_URL)}
                alt={property.name}
                className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                onError={handleImageError}
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-black/75 backdrop-blur-md px-3.5 py-1.5 rounded-full flex items-center gap-2 z-20 border border-white/20">
                <span className="w-2 h-2 rounded-full bg-[#10b981] luxury-pulse-badge" />
                <span className="text-[12px] text-white font-mono tracking-[0.14em] uppercase font-semibold">
                  {property.mlsId ? `MLS® #${property.mlsId} · ACTIVE RESALE` : "ACTIVE RESALE"}
                </span>
              </div>

              {/* View All Photos trigger on mobile */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImgIdx(0);
                }}
                className="md:hidden absolute bottom-4 right-4 bg-black/85 hover:bg-black text-white text-[12px] font-mono tracking-[0.14em] uppercase min-h-[44px] px-4 py-2.5 rounded-full z-20 cursor-pointer transition-all flex items-center gap-2 shadow-xl border border-white/20"
              >
                <span>📷 View Photos ({galleryImgs.length})</span>
              </button>
            </div>

            <div className="hidden md:grid grid-rows-2 gap-[4px] h-full relative">
              <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(1)}>
                <Image
                  fill
                  src={getSafeImageUrl(galleryImgs[1] || galleryImgs[0], LUXURY_FALLBACK_IMAGE_URL)}
                  alt={`${property.name} Photo 2`}
                  className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                  onError={handleImageError}
                />
              </div>
              <div className="relative h-full w-full overflow-hidden cursor-pointer" onClick={() => setActiveImgIdx(2)}>
                <Image
                  fill
                  src={getSafeImageUrl(galleryImgs[2] || galleryImgs[0], LUXURY_FALLBACK_IMAGE_URL)}
                  alt={`${property.name} Photo 3`}
                  className="object-cover transition-transform duration-700 hover:scale-[1.02]"
                  onError={handleImageError}
                />

                {/* Photo Count Indicator / View All Photos on desktop */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveImgIdx(0);
                  }}
                  className="absolute bottom-4 right-4 bg-black/85 hover:bg-black text-white text-[12px] font-mono tracking-[0.14em] uppercase min-h-[44px] px-4 py-2.5 rounded-full z-20 cursor-pointer transition-all flex items-center gap-2 shadow-xl border border-white/20 hover:scale-105"
                >
                  <span>📷 View All Photos ({galleryImgs.length})</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content & Resale Specifications */}
      <section className="max-w-[1140px] mx-auto px-6 pb-20">
        {/* Navigation & Breadcrumb (NO COMPARE DEVELOPMENT BUTTON) */}
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#ddd8cd]">
          <button
            onClick={() => router.back()}
            className="text-[#8f96ab] hover:text-[#1c1f26] text-[12px] tracking-[0.2em] uppercase transition-colors inline-flex items-center gap-1 font-medium"
          >
            &larr; Back to Listings
          </button>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#8f96ab]">
              Status: <span className="text-[#10b981] font-semibold">{property.statusRemark || "Active"}</span>
            </span>
          </div>
        </div>

        {/* Resale Estate Headline Kicker & Title */}
        <div className="mb-10">
          <span className="text-[12px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
            {property.neighborhood} &middot;{" "}
            {property.propertySubtypeLabel ||
              (property.propertySubtype === "penthouse"
                ? "Waterfront Penthouse Residence"
                : property.propertySubtype === "condo" ||
                  /[\s#]+(?:unit|apt|ph)?\s*[0-9]+[a-z]?$/i.test((property.name || "").trim())
                ? "Waterfront Condominium Residence"
                : "Single-Family Waterfront Estate")}
          </span>
          <h2 className="text-3xl md:text-5xl font-serif font-normal text-[#1c1f26] leading-[1.1] mb-2">
            {property.name}
          </h2>
          <p className="text-sm text-[#8f96ab] tracking-[0.05em] font-light">
            {addressDisplay} &middot; {property.neighborhood}, South Florida
          </p>
        </div>

        {/* ========================================================================= */}
        {/* CORE RESALE SPECIFICATIONS GRID (THE 8 REQUIRED RESALE FIELDS)             */}
        {/* Price, Beds, Baths, SF, Lot size, Year built, Waterfront, Days on market */}
        {/* ========================================================================= */}
        <div className="mb-14">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs uppercase tracking-[0.25em] text-[#8c8376] font-semibold">
              Official Property Specifications
            </h3>
            <span className="text-[11px] font-mono text-[#8f96ab]">
              BeachesMLS Verified Data
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Price */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Offering Price
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displayPrice}
              </strong>
              {displayPpsf && (
                <span className="text-xs font-mono text-[#B38E36] mt-1 block">
                  {displayPpsf}
                </span>
              )}
            </div>

            {/* 2. Bedrooms */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Bedrooms
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displayBeds}
              </strong>
              <span className="text-xs text-[#788092] mt-1 block font-light">
                Spacious luxury suites
              </span>
            </div>

            {/* 3. Bathrooms */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Bathrooms
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displayBaths}
              </strong>
              <span className="text-xs text-[#788092] mt-1 block font-light">
                Full &amp; powder baths
              </span>
            </div>

            {/* 4. Square Footage (SF) */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Living Area (SF)
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displaySqft}
              </strong>
              <span className="text-xs text-[#788092] mt-1 block font-light">
                Interior living space
              </span>
            </div>

            {/* 5. Lot Size */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Lot Size
              </span>
              <strong className="text-xl sm:text-2xl font-serif font-normal text-[#1c1f26] block leading-tight">
                {displayLotSize}
              </strong>
              <span className="text-xs text-[#788092] mt-1 block font-light">
                Private estate grounds
              </span>
            </div>

            {/* 6. Year Built */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Year Built
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displayYearBuilt}
              </strong>
              <span className="text-xs text-[#788092] mt-1 block font-light">
                Original construction
              </span>
            </div>

            {/* 7. Waterfront / Dock Details */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Waterfront &amp; Dock
              </span>
              <strong className="text-lg sm:text-xl font-serif font-normal text-[#1c1f26] block leading-snug">
                {property.dockDetails ? "Private Dock / Marina" : "Direct Waterfront"}
              </strong>
              <span className="text-xs text-[#B38E36] mt-1 block font-mono">
                Direct bay &amp; ocean access
              </span>
            </div>

            {/* 8. Days on Market */}
            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-5 shadow-xs">
              <span className="text-[11px] uppercase tracking-[0.22em] text-[#8f96ab] block mb-1.5 font-medium">
                Days on Market
              </span>
              <strong className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] block">
                {displayDaysOnMarket}
              </strong>
              <span className="text-xs text-[#10b981] mt-1 block font-mono font-medium">
                Active MLS Listing
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* DEDICATED WATERFRONT & DOCK DETAILS SHOWCASE SECTION                       */}
        {/* ========================================================================= */}
        {(property.waterfrontDetails || property.dockDetails) && (
          <div className="mb-14 bg-gradient-to-br from-[#0c1523] to-[#162236] text-white rounded-[4px] p-8 md:p-10 shadow-xl border border-white/10">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-6 bg-[#B38E36]" />
              <span className="text-[12px] uppercase tracking-[0.3em] text-[#B38E36] font-semibold">
                BOATING &amp; WATERFRONT PRIVILEGES
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-normal text-white mb-6">
              Waterfront &amp; Dock Specifications
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {property.waterfrontDetails && (
                <div className="bg-white/5 border border-white/10 rounded-[4px] p-6 backdrop-blur-xs">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#B38E36] block mb-2 font-medium">
                    ✦ Waterfront Setting &amp; Frontage
                  </span>
                  <p className="text-sm text-white/90 font-light leading-relaxed">
                    {property.waterfrontDetails}
                  </p>
                </div>
              )}

              {property.dockDetails ? (
                <div className="bg-white/5 border border-white/10 rounded-[4px] p-6 backdrop-blur-xs">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#B38E36] block mb-2 font-medium">
                    ⚓ Dockage &amp; Private Marina Details
                  </span>
                  <p className="text-sm text-white/90 font-light leading-relaxed">
                    {property.dockDetails}
                  </p>
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-[4px] p-6 backdrop-blur-xs">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-[#B38E36] block mb-2 font-medium">
                    ⚓ Water Access &amp; Navigation
                  </span>
                  <p className="text-sm text-white/90 font-light leading-relaxed">
                    Direct access to open Biscayne Bay and the Atlantic Ocean with unrestricted boating access and no fixed bridges to open water.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Narrative Property Description */}
        {property.description && (
          <div className="mb-14">
            <div className="flex items-center gap-3 mb-2">
              <span className="h-px w-6 bg-[#B38E36]" />
              <span className="text-[12px] uppercase tracking-[0.3em] text-[#B38E36] font-semibold">
                THE ESTATE
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26] mb-6">
              Property Overview &amp; Residence Narrative
            </h3>

            <div className="bg-white border border-[#e8e4db] rounded-[4px] p-8 shadow-xs">
              <div className="text-sm md:text-base font-light leading-[1.8] text-[#535862] whitespace-pre-line space-y-4">
                {formattedDescription}
              </div>
            </div>
          </div>
        )}

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-start mb-16">
          <button
            type="button"
            onClick={() => openInquiry(`Private Showing — ${property.name}`)}
            className="px-8 py-4 bg-[#1c1f26] hover:bg-[#B38E36] text-white text-[12px] uppercase tracking-[0.25em] font-semibold text-center transition-colors rounded-[2px] cursor-pointer shadow-md"
          >
            SCHEDULE PRIVATE ESTATE SHOWING
          </button>
          <a
            href={`https://wa.me/13053435371?text=${encodeURIComponent(
              `Hi Zachary, I'm inquiring about the resale estate at ${property.name} (${property.neighborhood}) [MLS #${property.mlsId || ""}]. Please send full property disclosures and schedule a tour.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-8 py-4 font-semibold text-[12px] uppercase tracking-[0.25em] text-center transition-all duration-200 rounded-[2px] cursor-pointer flex items-center justify-center gap-2 hover:brightness-105 shadow-md"
            style={{ backgroundColor: "#25D366", color: "#ffffff" }}
          >
            <span>💬 WhatsApp Zachary Akers</span>
          </a>
          <button
            type="button"
            onClick={() => setActiveImgIdx(0)}
            className="px-8 py-4 border border-[#1c1f26] text-[#1c1f26] hover:bg-[#1c1f26] hover:text-white text-[12px] uppercase tracking-[0.25em] font-semibold text-center transition-colors rounded-[2px] cursor-pointer flex items-center justify-center gap-2"
          >
            <span>VIEW ALL PHOTOS ({galleryImgs.length})</span>
            <span>&rarr;</span>
          </button>
        </div>

        {/* Gallery Showcase Grid */}
        <div className="mb-16">
          <div className="flex justify-between items-end mb-6">
            <div>
              <span className="text-[12px] uppercase tracking-[0.3em] text-[#B38E36] font-semibold block mb-1">
                PHOTOGRAPHY ARCHIVE
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26]">
                Official MLS Property Gallery
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveImgIdx(0)}
              className="text-xs uppercase tracking-[0.2em] font-semibold text-[#B38E36] hover:text-[#1c1f26] transition-colors flex items-center gap-1.5 cursor-pointer font-mono"
            >
              <span>View Lightbox ({galleryImgs.length})</span>
              <span>&rarr;</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {galleryImgs.slice(0, 8).map((imgUrl, idx) => (
              <div
                key={idx}
                className="group relative aspect-[1.35/1] overflow-hidden rounded-[2px] border border-[#e2e8f0] cursor-pointer bg-[#f6f4f0]"
                onClick={() => setActiveImgIdx(idx)}
              >
                <img
                  src={getSafeImageUrl(imgUrl, LUXURY_FALLBACK_IMAGE_URL)}
                  alt={`${property.name} - Photo ${idx + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                  onError={handleImageError}
                />
                <div className="absolute inset-0 bg-[#0C1523]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="text-white text-[11px] uppercase tracking-[0.2em] font-semibold bg-[#B38E36] px-3 py-1.5 rounded-[1px] shadow-lg">
                    Expand
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location & Map Setting */}
        <div className="mb-16">
          <div className="mb-6 text-left">
            <span className="text-[12px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-1">
              PARCEL LOCATION &amp; SETTING
            </span>
            <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26]">
              {property.neighborhood} Estate Setting
            </h3>
            <p className="text-xs text-[#8f96ab] mt-1 font-light">
              Coordinates: {property.lat.toFixed(5)}° N, {Math.abs(property.lng).toFixed(5)}° W
            </p>
          </div>
          <div
            className="relative h-[420px] rounded-[3px] border border-[#ddd8cd] overflow-hidden shadow-xs"
            ref={mapContainerRef}
          />
        </div>

        {/* Advisor Profile Card */}
        <div className="bg-white border border-[#ddd8cd] rounded-[4px] shadow-xl p-8 md:p-12 mb-16">
          <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 lg:gap-12 items-center">
            <div className="relative aspect-[0.82/1] w-full max-w-[260px] mx-auto rounded-[3px] overflow-hidden bg-[#d9d1c5] border border-[#e2e8f0]">
              <Image
                fill
                src="/images/imagereader.webp"
                alt="Zachary Akers"
                sizes="260px"
                className="object-cover"
              />
            </div>

            <div className="flex flex-col justify-between text-left">
              <div>
                <span className="text-[12px] uppercase tracking-[0.28em] text-[#8f96ab] font-semibold block mb-2">
                  LUXURY REAL ESTATE ADVISOR
                </span>
                <h3 className="text-3xl md:text-4xl font-serif font-normal text-[#1c1f26] mb-2">
                  Zachary Akers
                </h3>
                <p className="text-[12px] uppercase tracking-[0.2em] text-[#7c8498] font-medium mb-4">
                  ONE SOTHEBY&apos;S INTERNATIONAL REALTY
                </p>
                <p className="text-[15px] font-light leading-relaxed text-[#535862] max-w-[620px] mb-6">
                  Zachary Akers brings 14+ years of South Florida luxury real estate expertise, representing discerning clients in the acquisition and sale of premier waterfront estates and legacy trophy properties across Miami and the Beaches.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 sm:gap-6 items-center text-xs font-mono border-t border-[#ddd8cd] pt-5">
                <a href="tel:3053435371" className="hover:text-[#bb9751] transition-colors font-medium">
                  📞 (305) 343-5371
                </a>
                <a href="mailto:Zakers@onesothebysrealty.com" className="hover:text-[#bb9751] transition-colors font-medium">
                  ✉ Zakers@onesothebysrealty.com
                </a>
                <a
                  href={`https://wa.me/13053435371?text=${encodeURIComponent(
                    `Hi Zachary, I'd like to discuss the estate at ${property.name}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline flex items-center gap-1 font-sans text-xs uppercase tracking-wider font-semibold"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Private Showing Request Intake Form */}
        <div className="bg-white border border-[#ddd8cd] rounded-[4px] p-8 md:p-12 mb-16 shadow-xs max-w-[800px] mx-auto text-center" id="showing-intake">
          <span className="text-[12px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-2">
            PRIVATE INTAKE
          </span>
          <h3 className="text-2xl md:text-3xl font-serif font-normal text-[#1c1f26] mb-2">
            Request Private Showing &amp; Disclosures
          </h3>
          <p className="text-sm text-[#5f6575] font-light max-w-[500px] mx-auto mb-8">
            Schedule an exclusive private tour or receive the official MLS disclosure package for {property.name}.
          </p>

          {formStatus === "done" ? (
            <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-[3px] text-center">
              <h4 className="text-xl font-serif text-green-700 mb-2">Showing Request Received</h4>
              <p className="text-xs text-[#535862] leading-relaxed">
                Thank you. Zachary Akers will coordinate access and contact you directly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleInquirySubmit} className="space-y-4 max-w-[600px] mx-auto text-left">
              <HoneypotField value={formHoneypot} onChange={setFormHoneypot} />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <input
                    type="text"
                    placeholder="Your Full Name"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-[#ddd8cd] rounded-[2px] text-xs focus:outline-none focus:border-[#B38E36]"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    placeholder="Your Email Address *"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-[#faf9f6] border border-[#ddd8cd] rounded-[2px] text-xs focus:outline-none focus:border-[#B38E36]"
                  />
                </div>
              </div>

              <div>
                <input
                  type="tel"
                  placeholder="Phone Number (for showing coordination)"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-4 py-3 bg-[#faf9f6] border border-[#ddd8cd] rounded-[2px] text-xs focus:outline-none focus:border-[#B38E36]"
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  placeholder={`Interested in ${property.name} (MLS #${property.mlsId || ""}). Please arrange a private showing.`}
                  value={formMessage}
                  onChange={(e) => setFormMessage(e.target.value)}
                  className="w-full px-4 py-3 bg-[#faf9f6] border border-[#ddd8cd] rounded-[2px] text-xs focus:outline-none focus:border-[#B38E36] resize-none"
                />
              </div>

              <div className="text-center pt-2">
                <button
                  type="submit"
                  disabled={formStatus === "sending"}
                  className="px-8 py-3.5 bg-[#1c1f26] hover:bg-[#B38E36] text-white text-[12px] uppercase tracking-[0.25em] font-semibold transition-colors rounded-[2px] cursor-pointer min-w-[220px]"
                >
                  {formStatus === "sending" ? "SENDING..." : "SUBMIT SHOWING REQUEST"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Similar Resale Properties */}
        {relatedResaleHomes.length > 0 && (
          <div className="mb-16">
            <div className="mb-8 text-left">
              <span className="text-[12px] tracking-[0.3em] uppercase text-[#B38E36] font-semibold block mb-1">
                CURATED PORTFOLIO
              </span>
              <h3 className="text-2xl sm:text-3xl font-serif font-normal text-[#1c1f26]">
                Other Exclusive Resale Estates
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedResaleHomes.map((item) => (
                <div
                  key={item.slug}
                  onClick={() => router.push(`/property/${item.slug}`)}
                  className="bg-white border border-[#e8e4db] rounded-[3px] overflow-hidden cursor-pointer hover:shadow-lg transition-all group"
                >
                  <div className="relative aspect-[1.3/1] bg-[#0c1523] overflow-hidden">
                    <img
                      src={getSafeImageUrl(item.img, LUXURY_FALLBACK_IMAGE_URL)}
                      alt={item.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={handleImageError}
                    />
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 bg-black/75 text-white text-[10px] font-mono tracking-wider uppercase rounded-full">
                      Resale Estate
                    </span>
                  </div>

                  <div className="p-4">
                    <h4 className="font-serif text-[15px] font-normal text-[#1c1f26] truncate mb-1">
                      {item.name}
                    </h4>
                    <span className="text-[11px] font-mono text-[#8f96ab] uppercase tracking-wider block mb-3">
                      {item.neighborhood}
                    </span>

                    <div className="flex justify-between items-center border-t border-[#f0ece1] pt-3 text-xs font-mono">
                      <div>
                        <span className="text-[10px] uppercase text-[#8f96ab] block">Price</span>
                        <span className="font-semibold text-[#1c1f26]">
                          {formatCurrency(item.minPrice || item.priceFrom)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-[#8f96ab] block">Year Built</span>
                        <span className="font-semibold text-[#1c1f26]">
                          {item.yearBuilt || item.completion || "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Global Luxury Lightbox Slider Modal */}
      {activeImgIdx !== null && (
        <div
          className="fixed inset-0 bg-[#070b12]/98 backdrop-blur-2xl z-[9999] flex flex-col justify-between items-center py-5 px-4 md:px-8 select-none transition-all duration-300 animate-in fade-in"
          onClick={() => setActiveImgIdx(null)}
        >
          {/* Top Modal Navigation Bar */}
          <div
            className="w-full max-w-[1400px] flex justify-between items-center z-50 text-white border-b border-white/10 pb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col">
              <span className="text-[11px] uppercase tracking-[0.25em] text-[#B38E36] font-semibold">
                {property.neighborhood} {property.mlsId ? `· MLS® #${property.mlsId}` : ""}
              </span>
              <h3 className="font-serif text-lg md:text-xl text-white font-normal tracking-wide">
                {property.name}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 text-white text-xs font-mono tracking-widest border border-white/15">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
                Photo {activeImgIdx + 1} of {galleryImgs.length}
              </div>

              <button
                type="button"
                onClick={() => setActiveImgIdx(null)}
                className="flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full bg-white/10 hover:bg-[#B38E36] text-white hover:text-[#0c1523] text-xs uppercase tracking-[0.15em] font-semibold transition-all duration-200 border border-white/15 cursor-pointer"
                aria-label="Close modal"
              >
                <span>Close</span>
                <span className="text-sm font-bold">&times;</span>
              </button>
            </div>
          </div>

          {/* Large Main Photo Showcase */}
          <div
            className="relative w-full max-w-[1300px] h-[64vh] md:h-[68vh] flex items-center justify-center my-auto z-40"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) =>
                  prev !== null && galleryImgs.length > 0
                    ? (prev - 1 + galleryImgs.length) % galleryImgs.length
                    : prev
                );
              }}
              className="absolute left-2 md:left-4 z-50 text-white bg-black/60 hover:bg-[#B38E36] hover:text-[#0c1523] p-3.5 md:p-4 rounded-full transition-all duration-200 focus:outline-none border border-white/20 shadow-2xl cursor-pointer hover:scale-110"
              aria-label="Previous photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="relative w-full h-full flex items-center justify-center p-2">
              <img
                src={getSafeImageUrl(galleryImgs[activeImgIdx % galleryImgs.length], LUXURY_FALLBACK_IMAGE_URL)}
                alt={`${property.name} photo ${(activeImgIdx % galleryImgs.length) + 1}`}
                referrerPolicy="no-referrer"
                className="max-w-full max-h-full object-contain select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-[4px] border border-white/10"
                onError={handleImageError}
              />
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveImgIdx((prev) =>
                  prev !== null && galleryImgs.length > 0 ? (prev + 1) % galleryImgs.length : prev
                );
              }}
              className="absolute right-2 md:right-4 z-50 text-white bg-black/60 hover:bg-[#B38E36] hover:text-[#0c1523] p-3.5 md:p-4 rounded-full transition-all duration-200 focus:outline-none border border-white/20 shadow-2xl cursor-pointer hover:scale-110"
              aria-label="Next photo"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Bottom Thumbnails Strip */}
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
                      src={getSafeImageUrl(thumbUrl, LUXURY_FALLBACK_IMAGE_URL)}
                      alt={`Thumbnail ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                      onError={handleImageError}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MLS / IDX RULES COMPLIANCE ATTRIBUTION & DISCLAIMER */}
      <section className="bg-[#FAF8F3] py-14 px-6 border-t border-[#e2e8f0] text-[#535862]">
        <div className="max-w-[1140px] mx-auto">
          <div className="border border-[#e8e4db] rounded-[4px] p-6 md:p-8 bg-white shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#ddd8cd] pb-4 mb-4">
              <div>
                <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-[#B38E36] font-semibold block mb-1">
                  IDX Listing Attribution
                </span>
                <p className="text-[16px] font-serif font-medium text-[#1c1f26] m-0">
                  Listing Courtesy of {property.listingOffice || "ONE Sotheby's International Realty"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-[#8f96ab]">
                {property.mlsId && (
                  <span className="px-2.5 py-1 bg-[#FAF8F3] border border-[#e8e4db] rounded-[2px] text-[#1c1f26]">
                    MLS® #{property.mlsId}
                  </span>
                )}
                <span>BeachesMLS / Miami Association of Realtors</span>
              </div>
            </div>

            <p className="text-[12px] leading-relaxed text-[#788092] mb-3">
              The data relating to real estate for sale on this website comes in part from the Internet Data Exchange (IDX) program of BeachesMLS and the Miami Association of Realtors. All real estate listings held by brokerage firms other than Zachary Akers / ONE Sotheby&apos;s International Realty are marked with the listing brokerage office name.
            </p>
            <p className="text-[11px] leading-relaxed text-[#8f96ab] mb-4">
              All information provided is deemed reliable but is not guaranteed accurate and should be independently verified. Properties are subject to prior sale, change, or withdrawal. Neither BeachesMLS, Miami Association of Realtors, ONE Sotheby&apos;s International Realty, nor Zachary Akers shall be responsible for any typographical errors, misinformation, or misprints, and shall be held totally harmless.
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-3 border-t border-[#e8e4db] text-[11px] font-mono text-[#8f96ab] uppercase tracking-wider">
              <span>© {new Date().getFullYear()} BeachesMLS &amp; Miami Association of Realtors®. All rights reserved.</span>
              <span className="flex items-center gap-2 text-[#1c1f26]">
                <span>Equal Housing Opportunity</span>
                <span aria-hidden="true">🏠</span>
              </span>
            </div>
          </div>
        </div>
      </section>

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
