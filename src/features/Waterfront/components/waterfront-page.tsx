"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AdvisorSection } from "@/src/features/Home/components/advisor-section";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { getSafeImageUrl, getDistinctFallback, LUXURY_FALLBACK_IMAGE_URL } from "@/src/lib/image-utils";
import MobileNavMenu from "@/src/components/MobileNavMenu";

type Enclave = {
  name: string;
  slug: string;
  security: string;
  tagline: string;
  dockageNote: string;
  priceFrom: string;
  bridgeAccess: "no-fixed-bridges" | "bridge-limited";
};

const bridgeCopy: Record<string, string> = {
  "no-fixed-bridges": "No fixed bridges",
  "bridge-limited": "Bridge limited",
};

const enclaves: Enclave[] = [
  {
    name: "Indian Creek",
    slug: "indian-creek",
    security: "Guarded island",
    tagline: "A private island village with its own police force.",
    dockageNote: "Deep-water lots with direct bay access and no fixed bridges to open water.",
    priceFrom: "from $30M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "La Gorce Island",
    slug: "la-gorce-island",
    security: "Guarded island",
    tagline: "The most active high-end waterfront market of the last two years.",
    dockageNote: "Guard-gated island inside La Gorce with deep-water frontage.",
    priceFrom: "from $30M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "Gables Estates",
    slug: "gables-estates",
    security: "Guarded mainland",
    tagline: "Coral Gables' most exclusive guard-gated enclave.",
    dockageNote: "Large lots with private docks and deep-water access to Biscayne Bay.",
    priceFrom: "from $25M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "Tahiti Beach",
    slug: "tahiti-beach",
    security: "Guarded mainland",
    tagline: "Double-gated estates on Biscayne Bay.",
    dockageNote: "Private docks, private beach, and true open-water access.",
    priceFrom: "from $30M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "Golden Beach",
    slug: "golden-beach",
    security: "Atlantic access",
    tagline: "Oceanfront town with its own police force.",
    dockageNote: "Intracoastal docks with quick Atlantic access and no high-rises.",
    priceFrom: "from $25M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "Bay Point",
    slug: "bay-point",
    security: "Guarded mainland",
    tagline: "Guard-gated bayfront in Miami's urban core.",
    dockageNote: "Private streets, resident-owned roads, and direct bay lots.",
    priceFrom: "from $25M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "North Bay Road",
    slug: "north-bay-road",
    security: "Open bayfront",
    tagline: "The benchmark bayfront street in Miami Beach.",
    dockageNote: "Wide western-exposure lots with sunset views and deep-water dockage.",
    priceFrom: "from $25M+",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    name: "Sunset Islands",
    slug: "sunset-islands",
    security: "Guarded island",
    tagline: "Four islands with steady high-end turnover.",
    dockageNote: "Controlled entry and consistent activity, but vessel clearance is limited.",
    priceFrom: "from $25M+",
    bridgeAccess: "bridge-limited",
  },
];

function isCondoProperty(item: any): boolean {
  if (item.propertySubtype === "condo" || item.propertySubtype === "penthouse") return true;
  if (item.propertySubtype === "single-family") return false;
  const desc = (item.description || "").toLowerCase();
  const name = (item.name || "").toLowerCase();
  const hasUnit =
    Boolean(item.unitNumber) ||
    Boolean(item.unit) ||
    /^(unit|apt|ph|ste|#)\s*\w+/i.test(item.address || "") ||
    /#\s*\w+/i.test(name) ||
    item.slug?.includes("-ph-") ||
    item.slug?.includes("-penthouse-");
  const condoKeywords = [
    "condo", "condominium", "penthouse", "triplex penthouse", "duplex penthouse",
    "tower", "residences atop", "floor unit", "full-floor residence", "sky residence"
  ];
  const hasCondoDesc = condoKeywords.some((kw) => desc.includes(kw));
  const sfKeywords = [
    "single-family", "single family", "estate parcel", "acres", "dockage for yachts",
    "private island lot", "gated estate", "custom estate", "lawn"
  ];
  const hasSfDesc = sfKeywords.some((kw) => desc.includes(kw));
  return hasUnit || (hasCondoDesc && !hasSfDesc);
}

export default function WaterfrontPage({ initialListings }: { initialListings?: any[] }) {
  const { openInquiry } = useInquiry();

  // Active MLS Listings State
  const [mlsListings, setMlsListings] = useState<any[]>(initialListings || []);
  const [propertyTypeFilter, setPropertyTypeFilter] = useState<string>("all");
  const [mlsSearch, setMlsSearch] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("All");
  const [mlsSort, setMlsSort] = useState<string>("price-desc");
  const [visibleMlsCount, setVisibleMlsCount] = useState<number>(12);

  useEffect(() => {
    if (!initialListings || initialListings.length === 0) {
      fetch("/api/idx/properties")
        .then((res) => res.json())
        .then((data) => {
          if (data.projects && Array.isArray(data.projects)) {
            setMlsListings(data.projects);
          }
        })
        .catch(console.error);
    }
  }, [initialListings]);

  const propertyTypeCounts = useMemo(() => {
    let singleFamily = 0;
    let condo = 0;
    mlsListings.forEach((item) => {
      if (isCondoProperty(item)) {
        condo++;
      } else {
        singleFamily++;
      }
    });
    return {
      all: mlsListings.length,
      singleFamily,
      condo,
    };
  }, [mlsListings]);

  // Dynamically compute available neighborhoods with counts
  const availableNeighborhoods = useMemo(() => {
    const counts: Record<string, number> = {};
    mlsListings.forEach((item) => {
      if (item.neighborhood) {
        counts[item.neighborhood] = (counts[item.neighborhood] || 0) + 1;
      }
    });
    const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
    return ["All", ...sorted];
  }, [mlsListings]);

  const filteredMls = useMemo(() => {
    let list = [...mlsListings];
    if (propertyTypeFilter === "single-family") {
      list = list.filter((item) => !isCondoProperty(item));
    } else if (propertyTypeFilter === "condo") {
      list = list.filter((item) => isCondoProperty(item));
    }
    if (selectedNeighborhood !== "All") {
      list = list.filter((item) => item.neighborhood === selectedNeighborhood);
    }
    if (mlsSearch.trim()) {
      const q = mlsSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.mlsId?.toLowerCase().includes(q) ||
          item.neighborhood?.toLowerCase().includes(q) ||
          item.address?.toLowerCase().includes(q)
      );
    }
    if (mlsSort === "price-desc") {
      list.sort((a, b) => (b.minPrice || 0) - (a.minPrice || 0));
    } else if (mlsSort === "price-asc") {
      list.sort((a, b) => (a.minPrice || 0) - (b.minPrice || 0));
    } else if (mlsSort === "beds-desc") {
      list.sort((a, b) => (b.minBed || 0) - (a.minBed || 0));
    }
    return list;
  }, [mlsListings, propertyTypeFilter, selectedNeighborhood, mlsSearch, mlsSort]);

  return (
    <main className="waterfront-page">
      {/* Header */}
      <header className="waterfront-header">
        <div className="site-header-inner">
          <Link href="/" aria-label="Miami New Development home" className="brand">
            <Image
              src="/images/mcs-symbol.svg"
              alt="Miami New Development"
              width={56}
              height={56}
              priority
              className="site-logo h-auto w-[52px]"
            />
          </Link>
          <nav className="waterfront-nav" aria-label="Primary">
            <Link href="/map">Explore Map</Link>
            <Link href="/find-my-project">Find My Project</Link>
            <Link href="/neighborhood">Neighborhoods</Link>
            <Link className="waterfront-nav-active" href="/waterfront">
              Waterfront Homes
            </Link>
            <Link href="/insights">Insights</Link>
            <button type="button" className="nav-inquire-btn" onClick={() => openInquiry("Waterfront Homes")}>
              Inquire
            </button>
          </nav>
          <MobileNavMenu />
        </div>
      </header>

      {/* Hero Intro */}
      <section className="waterfront-intro">
        <div className="waterfront-intro-inner">
          <p className="waterfront-kicker">Miami-Dade County · Active Waterfront MLS Estates &amp; Luxury Residences</p>
          <h1>Miami Waterfront Homes &amp; Luxury Estates</h1>
          <p>
            Explore active MLS waterfront estates, single-family listings, luxury coastal penthouses, and deep-water dockage properties across Miami-Dade&apos;s most exclusive coastal enclaves.
          </p>
        </div>
      </section>

      {/* ACTIVE MLS WATERFRONT LISTINGS SECTION */}
      <section className="py-12 md:py-16 px-5 md:px-8 max-w-[1340px] mx-auto border-b border-[rgba(255,255,255,0.08)]" id="active-mls-listings">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.08)] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[12px] uppercase tracking-[0.24em] text-[#c9a84c] font-semibold">
                Curated Collection · Waterfront Estates &amp; Residences
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-normal text-[#fafaf8] m-0">
              Active Waterfront Estates &amp; Residences
            </h2>
            <p className="text-[15px] text-[rgba(250,250,248,0.7)] mt-2 max-w-xl leading-relaxed">
              Curated luxury single-family homes, private island estates, and waterfront penthouses with deep-water dockage, open bay panoramas, and direct oceanfront access across Miami-Dade County.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-[13px] font-mono text-[#c9a84c] font-semibold">
              {filteredMls.length} Active Listings
            </span>
            <a
              href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20inquire%20about%20Miami%20waterfront%20homes."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center min-h-[44px] gap-2 text-[12px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 transition-all shadow-sm hover:brightness-105"
              style={{ backgroundColor: "#25D366", color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>💬 WhatsApp Zachary</span>
            </a>
          </div>
        </div>

        {/* Property Type Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 items-center">
          <span className="text-[12px] uppercase tracking-[0.2em] text-[#c9a84c] font-semibold mr-1">
            Type:
          </span>
          {[
            { id: "all", label: "All Waterfront", count: propertyTypeCounts.all },
            { id: "single-family", label: "Single-Family Estates", count: propertyTypeCounts.singleFamily },
            { id: "condo", label: "Condos & Penthouses", count: propertyTypeCounts.condo },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setPropertyTypeFilter(tab.id)}
              className={`min-h-[40px] px-4 py-1.5 inline-flex items-center gap-2 text-[12px] uppercase tracking-[0.16em] border transition-all rounded-[2px] cursor-pointer ${
                propertyTypeFilter === tab.id
                  ? "border-[#c9a84c] bg-[#c9a84c] text-[#14171e] font-semibold shadow-md"
                  : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[rgba(250,250,248,0.7)] hover:border-[rgba(255,255,255,0.3)]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                  propertyTypeFilter === tab.id
                    ? "bg-[#14171e] text-[#c9a84c]"
                    : "bg-[rgba(255,255,255,0.1)] text-[rgba(250,250,248,0.6)]"
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-stretch md:items-center">
          <div className="flex-1 max-w-lg">
            <input
              type="text"
              placeholder="Search by address, MLS #, or neighborhood..."
              value={mlsSearch}
              onChange={(e) => setMlsSearch(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] rounded px-4 py-3 text-[15px] text-[#fafaf8] placeholder:text-[rgba(250,250,248,0.35)] focus:outline-none focus:border-[#c9a84c]"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={mlsSort}
              onChange={(e) => setMlsSort(e.target.value)}
              aria-label="Sort waterfront listings"
              className="bg-[#14171e] border border-[rgba(255,255,255,0.12)] text-[12px] text-[rgba(250,250,248,0.7)] min-h-[44px] px-3 py-2 rounded focus:outline-none focus:border-[#c9a84c]"
            >
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="beds-desc">Bedrooms: Most to Least</option>
            </select>
          </div>
        </div>

        {/* Neighborhood Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2">
          {availableNeighborhoods.map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNeighborhood(n)}
              className={`min-h-[40px] px-3.5 py-1.5 inline-flex items-center justify-center text-[12px] uppercase tracking-[0.14em] border transition-all rounded-[2px] cursor-pointer ${
                selectedNeighborhood === n
                  ? "border-[#c9a84c] bg-[#c9a84c] text-[#14171e] font-semibold"
                  : "border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.03)] text-[rgba(250,250,248,0.6)] hover:border-[rgba(255,255,255,0.3)]"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {/* MLS Listings Grid */}
        {filteredMls.length === 0 ? (
          <div className="text-center py-20 bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.08)] rounded p-8">
            <p className="text-lg text-[#fafaf8] font-serif mb-2">No waterfront properties found matching your criteria</p>
            <p className="text-sm text-[rgba(250,250,248,0.5)] mb-6">Try clearing your filters or searching for another neighborhood.</p>
            <button
              type="button"
              onClick={() => {
                setMlsSearch("");
                setSelectedNeighborhood("All");
                setPropertyTypeFilter("all");
              }}
              className="px-6 py-2.5 border border-[#c9a84c] text-[#c9a84c] uppercase tracking-[0.18em] text-[12px]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMls.slice(0, visibleMlsCount).map((item, idx) => {
              const itemFallback =
                item.fallbackImg ||
                (Array.isArray(item.imgs) && item.imgs.find((u: string) => u && !u.includes("api.cotality.com"))) ||
                getDistinctFallback(item.name || item.slug || String(idx));

              return (
                <article
                  key={item.id || item.mlsId || idx}
                  className="group bg-[#181c25] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(201,168,76,0.6)] transition-all duration-300 flex flex-col justify-between overflow-hidden shadow-lg"
                >
                  <div>
                    <div className="relative aspect-[16/10] overflow-hidden bg-[#10131a]">
                      <Image
                        fill
                        src={getSafeImageUrl(item.img, itemFallback)}
                        alt={item.name}
                        data-fallback={itemFallback}
                        onError={(e) => {
                          const fb = (e.currentTarget as HTMLElement).dataset.fallback;
                          if (fb && e.currentTarget.src !== fb) {
                            e.currentTarget.src = fb;
                          }
                        }}
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute top-3 left-3 bg-[rgba(14,16,22,0.88)] backdrop-blur-md px-2.5 py-1 text-[11px] uppercase tracking-[0.18em] text-[#c9a84c] border border-[rgba(201,168,76,0.3)] font-mono">
                        {item.badge || "MLS · ACTIVE"}
                      </div>
                      <div className="absolute bottom-3 right-3 bg-[rgba(14,16,22,0.92)] backdrop-blur-md px-3 py-1 text-xs font-serif font-medium text-white border border-[rgba(255,255,255,0.1)]">
                        {item.priceFrom}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[12px] uppercase tracking-[0.2em] text-[#c9a84c] font-semibold">
                          {item.neighborhood}
                        </span>
                        <span className="text-[11px] uppercase tracking-[0.14em] text-[rgba(250,250,248,0.55)] font-mono">
                          {item.propertySubtypeLabel || (isCondoProperty(item) ? "Waterfront Residence" : "Single-Family Estate")}
                        </span>
                      </div>
                      <h3 className="text-lg font-serif text-[#fafaf8] m-0 mb-3 truncate" title={item.name}>
                        {item.name}
                      </h3>
                      <div className="flex items-center gap-3 text-[12px] text-[rgba(250,250,248,0.7)] border-t border-[rgba(255,255,255,0.06)] pt-3 font-mono">
                        {item.minBed ? <span>{item.minBed} Beds</span> : null}
                        {item.baths ? <span>· {item.baths} Baths</span> : null}
                        {item.sqft ? <span>· {item.sqft.toLocaleString()} SF</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="p-5 pt-0 flex items-center gap-3">
                    <Link
                      href={`/property/${item.slug}`}
                      className="flex-1 text-center min-h-[44px] py-2.5 inline-flex items-center justify-center bg-[rgba(255,255,255,0.06)] hover:bg-[#c9a84c] hover:text-[#14171e] text-[12px] uppercase tracking-[0.2em] text-[#fafaf8] transition-all font-semibold"
                    >
                      View Details
                    </Link>
                    <a
                      href={`https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27m%20interested%20in%20${encodeURIComponent(item.name)}%20(${encodeURIComponent(item.badge || '')}).`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center transition-colors rounded-[2px] hover:brightness-105"
                      style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                      title="WhatsApp Zachary"
                    >
                      <span style={{ color: "#ffffff" }}>💬</span>
                    </a>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Load More Pagination */}
        {visibleMlsCount < filteredMls.length && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleMlsCount((prev) => prev + 12)}
              className="px-8 py-3.5 min-h-[44px] inline-flex items-center justify-center bg-transparent border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#14171e] text-[12px] uppercase tracking-[0.24em] transition-all cursor-pointer font-semibold"
            >
              Load More Waterfront Listings ({filteredMls.length - visibleMlsCount} Remaining)
            </button>
          </div>
        )}

        {/* MLS IDX Attribution & Disclaimer */}
        <div className="mt-14 p-6 bg-[#141720] border border-[rgba(255,255,255,0.08)] rounded-[2px] text-[12px] text-[rgba(250,250,248,0.65)] leading-relaxed">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-3 mb-3">
            <span className="text-[11px] uppercase tracking-[0.2em] font-mono text-[#c9a84c]">
              IDX Listing Attribution &amp; Disclaimer
            </span>
            <span className="text-[11px] font-mono text-[rgba(250,250,248,0.5)]">
              BeachesMLS / Miami Association of Realtors
            </span>
          </div>
          <p className="m-0 mb-2">
            The listing information displayed on this page is provided courtesy of participating brokerages in the IDX program of BeachesMLS and the Miami Association of Realtors. All listings are subject to prior sale, change, or withdrawal.
          </p>
          <p className="m-0 text-[11px] text-[rgba(250,250,248,0.5)]">
            Information is deemed reliable but is not guaranteed and should be independently verified. Neither the listing brokerages, BeachesMLS, Miami Association of Realtors, ONE Sotheby&apos;s International Realty, nor Zachary Akers shall be responsible for typographical errors or misinformation. © {new Date().getFullYear()} All rights reserved. Equal Housing Opportunity.
          </p>
        </div>
      </section>

      {/* Enclaves Section */}
      <section className="waterfront-enclaves">
        <div className="waterfront-section-heading">
          <h2>The Enclaves</h2>
          <p>
            Gated islands, guarded mainland estates, and open waterfront. What separates them is privacy and whether the largest yachts can reach open water.
          </p>
        </div>

        <div className="waterfront-enclave-grid">
          {enclaves.map((enclave) => (
            <article key={enclave.slug} className="waterfront-enclave-card">
              <div className="waterfront-enclave-meta">
                <span>{enclave.security}</span>
                <span>{enclave.priceFrom}</span>
              </div>
              <h3>{enclave.name}</h3>
              <p className="waterfront-enclave-tagline">{enclave.tagline}</p>
              <span
                className={
                  enclave.bridgeAccess === "no-fixed-bridges"
                    ? "waterfront-sale-bridge is-open"
                    : "waterfront-sale-bridge"
                }
              >
                {bridgeCopy[enclave.bridgeAccess]}
              </span>
              <p className="waterfront-enclave-note">{enclave.dockageNote}</p>
            </article>
          ))}
        </div>

        <p className="waterfront-enclave-footnote">
          Fixed bridges set a permanent height limit between a dock and open water. Homes with no fixed bridges can berth the largest yachts and reach the ocean without clearance restrictions.
        </p>
      </section>

      {/* Advisory Section */}
      <section className="waterfront-inquiry" id="waterfront-inquiry">
        <div className="waterfront-inquiry-inner">
          <div className="waterfront-inquiry-copy">
            <span className="waterfront-inquiry-kicker">Private Advisory</span>
            <h2>Tell me what you&apos;re looking for.</h2>
            <p>
              On-market, off-market, teardown, or turnkey. If you&apos;re targeting Miami-Dade waterfront above $25M, this is where the real search starts.
            </p>
          </div>
          <div className="waterfront-inquiry-actions">
            <button
              type="button"
              className="waterfront-inquiry-button"
              onClick={() => openInquiry("Waterfront Homes")}
            >
              Start the conversation
            </button>
            <a href="tel:3053435371" className="waterfront-inquiry-link">
              (305) 343-5371
            </a>
            <a
              href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20connect%20regarding%20Miami%20waterfront%20homes."
              target="_blank"
              rel="noopener noreferrer"
              className="waterfront-inquiry-link text-[#25D366] hover:underline"
            >
              💬 WhatsApp Zachary
            </a>
          </div>
        </div>
      </section>

      <AdvisorSection />
      <SiteFooter />
    </main>
  );
}
