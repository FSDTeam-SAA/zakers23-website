"use client";

import Image from "next/image";
import Link from "next/link";
import mapboxgl from "mapbox-gl";
import { useEffect, useMemo, useRef, useState } from "react";
import { AdvisorSection } from "@/src/features/Home/components/advisor-section";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import waterfrontMlsRaw from "@/src/data/waterfront-mls.json";
import { handleImageError, getSafeImageUrl, FALLBACK_IMAGE_URL } from "@/src/lib/image-utils";

type Tier = "sovereign" | "ultra-prime" | "prime";
type BridgeAccess = "no-fixed-bridges" | "bridge-limited";

type Sale = {
  id: string;
  address: string;
  enclave: string;
  price: number;
  displayPrice: string;
  closeDate: string;
  lat: number;
  lng: number;
  tier: Tier;
  note?: string;
  waterfrontFt?: number;
  lotNote?: string;
  bridgeAccess?: BridgeAccess;
};

type Enclave = {
  name: string;
  slug: string;
  security: string;
  tagline: string;
  dockageNote: string;
  priceFrom: string;
  bridgeAccess: BridgeAccess;
};

const bronze = "#c9a84c";

const tierConfig: { label: string; tier: Tier }[] = [
  { label: "$50M and above", tier: "sovereign" },
  { label: "$30M to $50M", tier: "ultra-prime" },
  { label: "$25M to $30M", tier: "prime" },
];

const bridgeCopy: Record<BridgeAccess, string> = {
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

const sales: Sale[] = [
  {
    id: "indian-creek-7",
    address: "7 Indian Creek Island Rd",
    enclave: "Indian Creek",
    price: 170_000_000,
    displayPrice: "$170M",
    closeDate: "2026-03-02",
    lat: 25.88061,
    lng: -80.141376,
    tier: "sovereign",
    note: "New Miami-Dade single-family record.",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "lagorce-18",
    address: "18 La Gorce Cir",
    enclave: "La Gorce Island",
    price: 122_125_121,
    displayPrice: "$122.13M",
    closeDate: "2024-10-25",
    lat: 25.846868,
    lng: -80.130173,
    tier: "sovereign",
    lotNote: "2.87-acre lot",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "star-26",
    address: "26 E Star Island Dr",
    enclave: "Star Island",
    price: 120_000_000,
    displayPrice: "$120M",
    closeDate: "2025-02-24",
    lat: 25.779645,
    lng: -80.150572,
    tier: "sovereign",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "brickell-compound",
    address: "3031/3115 Brickell Ave",
    enclave: "Coconut Grove",
    price: 106_875_000,
    displayPrice: "$106.88M",
    closeDate: "2022-08-08",
    lat: 25.74753,
    lng: -80.207978,
    tier: "sovereign",
    note: "Off-market. Four-acre bayfront compound.",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "north-bay-5940",
    address: "5940 N Bay Rd",
    enclave: "North Bay Road",
    price: 105_000_000,
    displayPrice: "$105M",
    closeDate: "2025-07-21",
    lat: 25.841159,
    lng: -80.131554,
    tier: "sovereign",
    note: "Off-market acquisition, directly brokered.",
    lotNote: "2.34-acre lot",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "bay-point-4445",
    address: "4445 Sabal Palm Rd",
    enclave: "Bay Point",
    price: 85_200_000,
    displayPrice: "$85.2M",
    closeDate: "2025-01-07",
    lat: 25.818866,
    lng: -80.18089,
    tier: "sovereign",
    note: "Bay Point record sale.",
    lotNote: "1.68-acre lot",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "lagorce-88",
    address: "88 La Gorce Cir",
    enclave: "La Gorce Island",
    price: 74_250_000,
    displayPrice: "$74.25M",
    closeDate: "2025-04-24",
    lat: 25.849077,
    lng: -80.126839,
    tier: "sovereign",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "north-bay-4736",
    address: "4736 N Bay Rd",
    enclave: "North Bay Road",
    price: 72_250_000,
    displayPrice: "$72.25M",
    closeDate: "2024-10-11",
    lat: 25.824097,
    lng: -80.135731,
    tier: "sovereign",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "bal-bay-276",
    address: "276 Bal Bay Dr",
    enclave: "Bal Harbour",
    price: 69_500_000,
    displayPrice: "$69.5M",
    closeDate: "2025-03-03",
    lat: 25.898589,
    lng: -80.126451,
    tier: "sovereign",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "gables-41",
    address: "41 Arvida Pkwy",
    enclave: "Gables Estates",
    price: 50_000_000,
    displayPrice: "$50M",
    closeDate: "2025-10-10",
    lat: 25.68995,
    lng: -80.250247,
    tier: "sovereign",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "palm-40",
    address: "40 Palm Ave",
    enclave: "Palm Island",
    price: 45_000_000,
    displayPrice: "$45M",
    closeDate: "2025-02-27",
    lat: 25.778148,
    lng: -80.158401,
    tier: "ultra-prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "bal-bay-56",
    address: "56 Bal Bay Dr",
    enclave: "Bal Harbour",
    price: 42_973_750,
    displayPrice: "$42.97M",
    closeDate: "2026-06-16",
    lat: 25.889177,
    lng: -80.127553,
    tier: "ultra-prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "hibiscus-101",
    address: "101 N Hibiscus Dr",
    enclave: "Hibiscus Island",
    price: 40_250_000,
    displayPrice: "$40.25M",
    closeDate: "2024-08-28",
    lat: 25.782453,
    lng: -80.157758,
    tier: "ultra-prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "sunset-3080",
    address: "3080 N Bay Rd",
    enclave: "Sunset Islands",
    price: 40_000_000,
    displayPrice: "$40M",
    closeDate: "2025-04-25",
    lat: 25.80612,
    lng: -80.139749,
    tier: "ultra-prime",
    bridgeAccess: "bridge-limited",
  },
  {
    id: "star-33",
    address: "33 E Star Island Dr",
    enclave: "Star Island",
    price: 38_700_000,
    displayPrice: "$38.7M",
    closeDate: "2025-01-14",
    lat: 25.777161,
    lng: -80.149775,
    tier: "ultra-prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "north-bay-5300",
    address: "5300 N Bay Rd",
    enclave: "North Bay Road",
    price: 27_000_000,
    displayPrice: "$27M",
    closeDate: "2026-05-27",
    lat: 25.831283,
    lng: -80.129951,
    tier: "prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "gables-555",
    address: "555 Arvida Pkwy",
    enclave: "Gables Estates",
    price: 26_202_689,
    displayPrice: "$26.2M",
    closeDate: "2026-05-29",
    lat: 25.68982,
    lng: -80.263825,
    tier: "prime",
    bridgeAccess: "no-fixed-bridges",
  },
  {
    id: "venetian-1417",
    address: "1417 N Venetian Way",
    enclave: "Venetian Islands",
    price: 27_500_000,
    displayPrice: "$27.5M",
    closeDate: "2026-04-03",
    lat: 25.790999,
    lng: -80.166946,
    tier: "prime",
    bridgeAccess: "bridge-limited",
  },
];

function markerRadius(price: number) {
  return 7 + ((Math.sqrt(price) - Math.sqrt(25_000_000)) / (Math.sqrt(170_000_000) - Math.sqrt(25_000_000))) * 10;
}

function formatCloseDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function WaterfrontPage() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});
  const [selectedSale, setSelectedSale] = useState<Sale | null>(sales[0]);
  const [hoveredSaleId, setHoveredSaleId] = useState<string | null>(null);
  const { openInquiry } = useInquiry();

  // Active MLS Listings State
  const [mlsSearch, setMlsSearch] = useState<string>("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState<string>("All");
  const [mlsSort, setMlsSort] = useState<string>("price-desc");
  const [visibleMlsCount, setVisibleMlsCount] = useState<number>(12);

  const filteredMls = useMemo(() => {
    let list = [...waterfrontMlsRaw];
    if (selectedNeighborhood !== "All") {
      list = list.filter((item) => item.neighborhood === selectedNeighborhood);
    }
    if (mlsSearch.trim()) {
      const q = mlsSearch.toLowerCase().trim();
      list = list.filter(
        (item) =>
          item.name?.toLowerCase().includes(q) ||
          item.mlsId?.toLowerCase().includes(q) ||
          item.neighborhood?.toLowerCase().includes(q)
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
  }, [mlsSearch, selectedNeighborhood, mlsSort]);

  const groupedSales = useMemo(
    () =>
      tierConfig.map((group) => ({
        ...group,
        items: sales
          .filter((sale) => sale.tier === group.tier)
          .sort((left, right) => right.price - left.price),
      })),
    [],
  );

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const token = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    if (!token) {
      mapContainerRef.current.innerHTML = `
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          background: #10131a;
          color: #ffffff;
          padding: 20px;
          text-align: center;
          font-family: var(--font-sans), sans-serif;
        ">
          <p style="font-family: var(--font-serif), serif; font-size: 18px; margin-bottom: 8px; color: #f3e7c4;">Map Preview</p>
          <p style="font-size: 11px; color: rgba(250, 250, 248, 0.44); max-width: 320px; line-height: 1.5; letter-spacing: 0.05em; text-transform: uppercase;">
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
      style: "mapbox://styles/mapbox/dark-v11",
      center: [-80.16, 25.81],
      zoom: 11,
      attributionControl: true
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

    const bounds = new mapboxgl.LngLatBounds();

    sales.forEach((sale) => {
      const diameter = markerRadius(sale.price) * 2;

      const markerEl = document.createElement("div");
      markerEl.style.width = `${diameter}px`;
      markerEl.style.height = `${diameter}px`;
      markerEl.style.borderRadius = "50%";
      markerEl.style.border = `2px solid ${bronze}`;
      markerEl.style.backgroundColor = sale.price >= 50_000_000 ? "rgba(201, 168, 76, 0.46)" : "rgba(201, 168, 76, 0.08)";
      markerEl.style.cursor = "pointer";
      markerEl.style.transition = "transform 0.2s ease, background-color 0.2s ease, border-color 0.2s ease";

      const popup = new mapboxgl.Popup({ offset: diameter / 2 + 5, closeButton: false })
        .setHTML(`<div class="font-sans text-[11px] tracking-[0.05em] uppercase font-semibold text-[#1c1f26] p-1">${sale.address} <span class="text-[#B38E36] font-mono">${sale.displayPrice}</span></div>`);

      const marker = new mapboxgl.Marker(markerEl)
        .setLngLat([sale.lng, sale.lat])
        .setPopup(popup)
        .addTo(map);

      markerEl.addEventListener("click", () => {
        setSelectedSale(sale);
      });

      markerEl.addEventListener("mouseenter", () => {
        setHoveredSaleId(sale.id);
        popup.addTo(map);
      });

      markerEl.addEventListener("mouseleave", () => {
        setHoveredSaleId((current) => (current === sale.id ? null : current));
        popup.remove();
      });

      markersRef.current[sale.id] = marker;
      bounds.extend([sale.lng, sale.lat]);
    });

    map.fitBounds(bounds, {
      padding: 36,
      maxZoom: 12,
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    Object.entries(markersRef.current).forEach(([id, marker]) => {
      const sale = sales.find((entry) => entry.id === id);
      if (!sale) return;
      const isSelected = sale.id === selectedSale?.id;
      const isHovered = sale.id === hoveredSaleId;
      
      const el = marker.getElement();
      if (el) {
        el.style.borderColor = isSelected ? "#ffffff" : bronze;
        el.style.borderWidth = isSelected ? "3px" : isHovered ? "2.5px" : "2px";
        el.style.backgroundColor = isSelected 
          ? bronze 
          : isHovered 
            ? "rgba(201, 168, 76, 0.7)" 
            : sale.price >= 50_000_000 
              ? "rgba(201, 168, 76, 0.46)" 
              : "rgba(201, 168, 76, 0.08)";
        el.style.transform = isSelected ? "scale(1.2)" : isHovered ? "scale(1.15)" : "scale(1)";
        el.style.zIndex = isSelected ? "10" : isHovered ? "5" : "1";
      }
    });
  }, [hoveredSaleId, selectedSale]);

  const focusSale = (sale: Sale) => {
    setSelectedSale(sale);
    mapRef.current?.flyTo({ center: [sale.lng, sale.lat], zoom: 13.5, duration: 1200 });
  };

  return (
    <main className="waterfront-page">
      <header className="waterfront-header">
        <div className="site-header-inner">
          <Link href="/" aria-label="Miami New Development home" className="brand">
            <Image src="/images/logo.png" alt="Miami New Development" width={220} height={58} priority className="site-logo h-auto w-[52px]" />
          </Link>
          <nav className="waterfront-nav" aria-label="Primary">
            <Link href="/map">Explore Map</Link>
            <Link href="/neighborhood">Neighborhoods</Link>
            <Link className="waterfront-nav-active" href="/waterfront">
              Waterfront Homes
            </Link>
            <Link href="/insights">Insights</Link>
            <button type="button" className="nav-inquire-btn" onClick={() => openInquiry("Waterfront Homes")}>
              Inquire
            </button>
          </nav>
        </div>
      </header>

      <section className="waterfront-intro">
        <div className="waterfront-intro-inner">
          <p className="waterfront-kicker">Miami-Dade County · Active MLS Waterfront Listings & Ultra-Prime Enclaves</p>
          <h1>Miami Waterfront Homes & Luxury Estates</h1>
          <p>
            Explore active MLS waterfront single-family listings, gated island estates, and benchmark record sales across Miami-Dade&apos;s most exclusive coastal enclaves.
          </p>
        </div>
      </section>

      <section className="waterfront-market" aria-label="Waterfront market activity">
        <div className="waterfront-map-shell">
          <div className="waterfront-map" ref={mapContainerRef} />
          <div className="waterfront-map-legend">
            <span className="waterfront-legend-title">Circle size = sale price</span>
            <div className="waterfront-legend-item">
              <span className="waterfront-legend-dot waterfront-legend-dot-solid" />
              <span>$50M and above</span>
            </div>
            <div className="waterfront-legend-item">
              <span className="waterfront-legend-dot waterfront-legend-dot-outline" />
              <span>Below $50M</span>
            </div>
            <div className="waterfront-legend-bridge">
              <span className="waterfront-legend-title">Vessel clearance</span>
              <div className="waterfront-bridge-pills">
                <span className="waterfront-bridge-pill is-open">No fixed bridges</span>
                <span className="waterfront-bridge-pill">Bridge limited</span>
              </div>
            </div>
          </div>
        </div>

        <aside className="waterfront-ledger">
          <div className="waterfront-sales-list">
            {groupedSales.map((group) => (
              <section key={group.tier}>
                <div className="waterfront-ledger-group">
                  <span className="waterfront-ledger-group-dot" />
                  <span>{group.label}</span>
                </div>
                {group.items.map((sale) => (
                  <button
                    key={sale.id}
                    type="button"
                    className={sale.id === selectedSale?.id ? "waterfront-sale is-selected" : "waterfront-sale"}
                    onClick={() => focusSale(sale)}
                    onMouseEnter={() => setHoveredSaleId(sale.id)}
                    onMouseLeave={() => setHoveredSaleId((current) => (current === sale.id ? null : current))}
                  >
                    <div className="waterfront-sale-main">
                      <span className="waterfront-sale-address">{sale.address}</span>
                      <span className="waterfront-sale-enclave">{sale.enclave}</span>
                      {sale.lotNote && <span className="waterfront-sale-detail">{sale.lotNote}</span>}
                      {sale.waterfrontFt && (
                        <span className="waterfront-sale-detail">{sale.waterfrontFt} ft waterfront</span>
                      )}
                      {sale.bridgeAccess && (
                        <span
                          className={
                            sale.bridgeAccess === "no-fixed-bridges"
                              ? "waterfront-sale-bridge is-open"
                              : "waterfront-sale-bridge"
                          }
                        >
                          {bridgeCopy[sale.bridgeAccess]}
                        </span>
                      )}
                      <span className="waterfront-sale-meta">Closed {formatCloseDate(sale.closeDate)}</span>
                      {sale.note && <span className="waterfront-sale-note">{sale.note}</span>}
                    </div>
                    <span className="waterfront-sale-price">{sale.displayPrice}</span>
                  </button>
                ))}
              </section>
            ))}
          </div>
          <div className="waterfront-ledger-help">
            <div className="waterfront-bridge-pills">
              <span className="waterfront-bridge-pill is-open">No fixed bridges</span>
              <span className="waterfront-bridge-pill">Bridge limited</span>
            </div>
            <p>Hover a transaction to locate it. Click to zoom in. Select a pin to open the record.</p>
          </div>
        </aside>
      </section>

      {/* ACTIVE MLS WATERFRONT LISTINGS SECTION */}
      <section className="py-20 px-5 md:px-8 max-w-[1340px] mx-auto border-b border-[rgba(255,255,255,0.08)]" id="active-mls-listings">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 pb-6 border-b border-[rgba(255,255,255,0.08)] gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-pulse" />
              <span className="text-[10px] uppercase tracking-[0.24em] text-[#c9a84c] font-semibold">
                Live MLS Feed · Verified Inventory
              </span>
            </div>
            <h2 className="text-3xl md:text-5xl font-serif font-normal text-[#fafaf8] m-0">
              Active MLS Waterfront Listings
            </h2>
            <p className="text-xs text-[rgba(250,250,248,0.5)] mt-2 max-w-xl leading-relaxed">
              Curated luxury single-family homes with deep-water dockage, open bay panoramas, and direct oceanfront access across Miami-Dade County.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-mono text-[#c9a84c]">
              {filteredMls.length} Active Waterfront Listings
            </span>
            <a
              href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20inquire%20about%20Miami%20waterfront%20homes."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-semibold px-4 py-2.5 transition-all shadow-sm hover:brightness-105"
              style={{ backgroundColor: "#25D366", color: "#ffffff" }}
            >
              <span style={{ color: "#ffffff" }}>💬 WhatsApp Zachary</span>
            </a>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-stretch md:items-center">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search by address, MLS #, or neighborhood..."
              value={mlsSearch}
              onChange={(e) => setMlsSearch(e.target.value)}
              className="w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.12)] rounded px-4 py-2.5 text-xs text-[#fafaf8] placeholder:text-[rgba(250,250,248,0.35)] focus:outline-none focus:border-[#c9a84c]"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={mlsSort}
              onChange={(e) => setMlsSort(e.target.value)}
              aria-label="Sort waterfront listings"
              className="bg-[#14171e] border border-[rgba(255,255,255,0.12)] text-[11px] text-[rgba(250,250,248,0.7)] px-3 py-2 rounded focus:outline-none focus:border-[#c9a84c]"
            >
              <option value="price-desc">Price: High to Low</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="beds-desc">Bedrooms: Most to Least</option>
            </select>
          </div>
        </div>

        {/* Neighborhood Filter Pills */}
        <div className="flex flex-wrap gap-2 mb-10 overflow-x-auto pb-2">
          {["All", "Key Biscayne", "Miami Beach", "Fisher Island", "Brickell", "Coconut Grove", "Bal Harbour", "Surfside", "Sunny Isles Beach"].map((n) => (
            <button
              key={n}
              onClick={() => setSelectedNeighborhood(n)}
              className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.16em] border transition-all ${
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMls.slice(0, visibleMlsCount).map((item) => (
            <article
              key={item.id}
              className="group bg-[#181c25] border border-[rgba(255,255,255,0.08)] hover:border-[rgba(201,168,76,0.6)] transition-all duration-300 flex flex-col justify-between overflow-hidden"
            >
              <div>
                <div className="relative aspect-[16/10] overflow-hidden bg-[#10131a]">
                  <Image
                    fill
                    src={getSafeImageUrl(item.img, FALLBACK_IMAGE_URL)}
                    alt={item.name}
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-3 left-3 bg-[rgba(14,16,22,0.88)] backdrop-blur-md px-2.5 py-1 text-[8.5px] uppercase tracking-[0.18em] text-[#c9a84c] border border-[rgba(201,168,76,0.3)]">
                    {item.badge || "MLS · ACTIVE"}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-[rgba(14,16,22,0.92)] backdrop-blur-md px-3 py-1 text-xs font-serif font-medium text-white border border-[rgba(255,255,255,0.1)]">
                    {item.priceFrom}
                  </div>
                </div>

                <div className="p-5">
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#c9a84c] mb-1">
                    {item.neighborhood}
                  </div>
                  <h3 className="text-lg font-serif text-[#fafaf8] m-0 mb-3 truncate">
                    {item.name}
                  </h3>
                  <div className="flex items-center gap-3 text-[11px] text-[rgba(250,250,248,0.5)] border-t border-[rgba(255,255,255,0.06)] pt-3 font-mono">
                    {item.minBed ? <span>{item.minBed} Beds</span> : null}
                    {item.baths ? <span>· {item.baths} Baths</span> : null}
                    {item.sqft ? <span>· {item.sqft.toLocaleString()} SF</span> : null}
                  </div>
                </div>
              </div>

              <div className="p-5 pt-0 flex items-center gap-3">
                <Link
                  href={`/property/${item.slug}`}
                  className="flex-1 text-center py-2.5 bg-[rgba(255,255,255,0.06)] hover:bg-[#c9a84c] hover:text-[#14171e] text-[10px] uppercase tracking-[0.2em] text-[#fafaf8] transition-all"
                >
                  View Details
                </Link>
                <a
                  href={`https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27m%20interested%20in%20${encodeURIComponent(item.name)}%20(${encodeURIComponent(item.badge || '')}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2.5 flex items-center justify-center transition-colors rounded-[2px] hover:brightness-105"
                  style={{ backgroundColor: "#25D366", color: "#ffffff" }}
                  title="WhatsApp Zachary"
                >
                  <span style={{ color: "#ffffff" }}>💬</span>
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Load More Pagination */}
        {visibleMlsCount < filteredMls.length && (
          <div className="mt-12 text-center">
            <button
              onClick={() => setVisibleMlsCount((prev) => prev + 12)}
              className="px-8 py-3.5 bg-transparent border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c] hover:text-[#14171e] text-[11px] uppercase tracking-[0.24em] transition-all cursor-pointer"
            >
              Load More Waterfront Listings ({filteredMls.length - visibleMlsCount} Remaining)
            </button>
          </div>
        )}
      </section>

      <section className="waterfront-enclaves">
        <div className="waterfront-section-heading">
          <h2>The enclaves</h2>
          <p>
            Gated islands, guarded mainland estates, and open waterfront. What separates them is
            privacy and whether the largest yachts can reach open water.
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
          Fixed bridges set a permanent height limit between a dock and open water. Homes with no
          fixed bridges can berth the largest yachts and reach the ocean without clearance
          restrictions.
        </p>
      </section>

      <section className="waterfront-inquiry" id="waterfront-inquiry">
        <div className="waterfront-inquiry-inner">
          <div className="waterfront-inquiry-copy">
            <span className="waterfront-inquiry-kicker">Private advisory</span>
            <h2>Tell me what you&apos;re looking for.</h2>
            <p>
              On-market, off-market, teardown, or turnkey. If you&apos;re targeting Miami-Dade
              waterfront above $25M, this is where the real search starts.
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
