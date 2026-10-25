import fs from "fs";
import path from "path";
import localProjects from "@/src/data/miami-projects.json";
import waterfrontMls from "@/src/data/waterfront-mls.json";

export type IdxProject = {
  id: number;
  mlsId?: string;
  slug: string;
  name: string;
  shortName?: string;
  neighborhood: string;
  stage: "preconstruction" | "under_construction" | "topped_off" | "move_in_ready";
  isActive: boolean;
  isFeatured: boolean;
  lat: number;
  lng: number;
  minPrice: number | null;
  maxPrice: number | null;
  priceFrom: string;
  completion: string;
  statusRemark?: string;
  badge?: string;
  units: string | number;
  imgs: string[];
  img: string;
  fallbackImg?: string;
  minBed: number | null;
  maxBed: number | null;
  baths?: number;
  sqft?: number;
  pricePerSqft?: number | null;
  description?: string;
  fullDetailsURL?: string;
  address?: string;
  tagline?: string;
  editorialLine?: string;
  stories?: number | null;
  height?: number | null;
  hoa?: string | null;
  developer?: string;
  architect?: string;
  interiorDesigner?: string;
  landscapeArchitect?: string;
  salesTeam?: string;
  depositStructure?: any;
  floorPlans?: any[];
  amenities?: any[];
  amenitiesDescription?: string;
  featureVideo?: any;
  featureVideoPlacement?: string;
  videoTourId?: string;
  floorPlanPdf?: string;
  factSheetURL?: string;
  keyMetrics?: any[];
  constructionImgs?: string[];
  constructionNote?: string;
  constructionUpdateDate?: string;
  listingOffice?: string;
  listingAgent?: string;
  isResale?: boolean;
  propertyType?: "resale" | "development";
  yearBuilt?: number | string;
  lotSize?: string;
  acres?: number | null;
  daysOnMarket?: number | null;
  waterfrontDetails?: string;
  dockDetails?: string | null;
  dateAdded?: string;
  propertySubtype?: "single-family" | "condo" | "penthouse";
  propertySubtypeLabel?: string;
};

const DEFAULT_ENDPOINT = "https://api.idxbroker.com/clients/savedlinks/3906/results";
const DEFAULT_API_KEY = "0L2Z42xQg1J1_vEjibNXfX";
function getCacheSeconds(): number {
  const envVal = process.env.IDX_CACHE_SECONDS;
  if (envVal !== undefined && envVal.trim() !== "") {
    const num = Number(envVal);
    return isNaN(num) ? 3600 : Math.max(0, num);
  }
  return 3600; // Default to 3600s (hourly automatic refresh)
}

let cachedProjects: IdxProject[] | null = null;
let cacheTimestamp = 0;
let inFlightRequest: Promise<{
  projects: IdxProject[];
  source: IdxDataSource;
  timestamp: string;
}> | null = null;

const number = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
};

const text = (...values: unknown[]): string =>
  values.find((value) => typeof value === "string" && value.trim())?.toString().trim() || "";

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function detectNeighborhood(record: Record<string, unknown>): string {
  const city = text(record.cityName, record.city, record.neighborhood);
  const addr = text(record.address, record.addressFull, record.name).toLowerCase();
  const desc = text(record.remarksConcat, record.description).toLowerCase();
  const zip = String(record.zipcode || "").slice(0, 5);

  if (city === "Key Biscayne") return "Key Biscayne";
  if (city === "Bal Harbour") return "Bal Harbour";
  if (city === "Surfside") return "Surfside";
  if (city === "Sunny Isles Beach") return "Sunny Isles Beach";
  if (zip === "33109" || addr.includes("fisher island")) return "Fisher Island";
  if (addr.includes("north bay village") || desc.includes("north bay village")) return "North Bay Village";

  if (addr.includes("brickell") || desc.includes("brickell")) return "Brickell";
  if (addr.includes("coconut grove") || desc.includes("coconut grove") || zip === "33133") return "Coconut Grove";
  if (addr.includes("edgewater") || desc.includes("edgewater") || (zip === "33137" && !addr.includes("design"))) return "Edgewater";
  if (addr.includes("design district") || desc.includes("design district")) return "Design District";
  if (addr.includes("wynwood") || desc.includes("wynwood")) return "Wynwood";
  if (addr.includes("biscayne") && (zip === "33132" || zip === "33131")) return "Downtown Miami";
  if (zip === "33132" || zip === "33130" || zip === "33136") return "Downtown Miami";
  if (zip === "33131") return "Brickell";

  if (city === "Miami Beach") {
    if (addr.includes("ocean dr") || addr.includes("south of fifth") || desc.includes("south of fifth")) {
      const numMatch = addr.match(/^(\d+)/);
      if (numMatch && Number(numMatch[1]) < 600) return "South of Fifth";
    }
    return "Miami Beach";
  }

  return city || "Miami";
}

function detectStage(record: Record<string, unknown>): IdxProject["stage"] {
  const status = text(record.status, record.statusRemark, record.constructionStatus, record.propStatus).toLowerCase();
  const desc = text(record.remarksConcat, record.description).toLowerCase();
  const yearBuilt = number(record.yearBuilt);
  const currentYear = new Date().getFullYear();

  if (status.includes("pre") || status.includes("coming soon") || desc.includes("pre-construction")) return "preconstruction";
  if (status.includes("topped")) return "topped_off";
  if (status.includes("under construction") || desc.includes("under construction")) return "under_construction";
  if (yearBuilt && yearBuilt > currentYear + 1) return "preconstruction";
  if (yearBuilt && yearBuilt > currentYear) return "under_construction";
  return "move_in_ready";
}

const LUXURY_FALLBACKS: Record<string, string[]> = {
  brickell: [
    "https://frasermiami.s3.amazonaws.com/ciprianiresidences/skyline.webp",
    "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
    "https://frasermiami.s3.amazonaws.com/baccarat/tower-hero.webp",
    "https://frasermiami.s3.amazonaws.com/baccarat/brickell-panorama.webp",
  ],
  "miami-beach": [
    "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
    "https://frasermiami.s3.amazonaws.com/shoreclub/hero-beach-view.webp",
    "https://frasermiami.s3.amazonaws.com/shoreclub/pool-sunrise.webp",
    "https://frasermiami.s3.amazonaws.com/fivepark/hero.webp",
    "https://frasermiami.s3.amazonaws.com/shoreclub/lobby.webp",
  ],
  "south-of-fifth": [
    "https://frasermiami.s3.amazonaws.com/fivepark/hero.webp",
    "https://frasermiami.s3.amazonaws.com/baccarat/lobby-front-desk.webp",
    "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
  ],
  "bal-harbour": [
    "https://frasermiami.s3.amazonaws.com/rivage/hummingbird.webp",
    "https://frasermiami.s3.amazonaws.com/rivage/hero.webp",
  ],
  surfside: [
    "https://frasermiami.s3.amazonaws.com/surf-house/surf-house-miami-beach-10.webp",
    "https://frasermiami.s3.amazonaws.com/surf-house/hero.webp",
  ],
  "sunny-isles-beach": [
    "https://frasermiami.s3.amazonaws.com/bentley/hero.webp",
    "https://frasermiami.s3.amazonaws.com/stregis-sib/hero.webp",
  ],
  "coconut-grove": [
    "https://frasermiami.s3.amazonaws.com/vita-grove-isle/hero-aerial.webp",
    "https://frasermiami.s3.amazonaws.com/thewellcg/hero.webp",
  ],
  "downtown-miami": [
    "https://frasermiami.s3.amazonaws.com/ciprianiresidences/skyline.webp",
    "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
  ],
  edgewater: [
    "https://frasermiami.s3.amazonaws.com/villamiami/hero-villa.webp",
    "https://frasermiami.s3.amazonaws.com/ariareserve/aria-reserve-exterior-day.webp",
  ],
  "fisher-island": [
    "https://frasermiami.s3.amazonaws.com/sixfisher/hero.webp",
    "https://frasermiami.s3.amazonaws.com/sixfisher/pool.webp",
    "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/hero.webp",
  ],
  "key-biscayne": [
    "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/01-Mansions-on-Fisher-Island-Featured.webp",
    "https://frasermiami.s3.amazonaws.com/sixfisher/pool.webp",
    "https://frasermiami.s3.amazonaws.com/vita-grove-isle/hero-aerial.webp",
  ],
  "coral-gables": [
    "https://frasermiami.s3.amazonaws.com/thewellcg/hero.webp",
    "https://frasermiami.s3.amazonaws.com/vita-grove-isle/hero-aerial.webp",
  ],
  "design-district": [
    "https://frasermiami.s3.amazonaws.com/villamiami/hero-villa.webp",
    "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/01-Mansions-on-Fisher-Island-Featured.webp",
  ],
};

function getLuxuryFallback(neighborhood?: string, index: number = 0): string {
  const slug = (neighborhood || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const pool = LUXURY_FALLBACKS[slug] || LUXURY_FALLBACKS["miami-beach"];
  return pool[Math.abs(index) % pool.length];
}

function normalizeFraserUrl(url: unknown): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/images/")) return trimmed;
  return `https://frasermiami.s3.amazonaws.com/${trimmed.replace(/^\//, "")}`;
}

function isBlockedHost(url: unknown): boolean {
  return typeof url === "string" && (url.includes("api.cotality.com") || url.includes("cotality.com"));
}

function extractImage(record: Record<string, unknown>, neighborhood: string, index: number): { primary: string; gallery: string[] } {
  let primary = "";
  const gallery: string[] = [];
  const fallback = getLuxuryFallback(neighborhood, index);

  if (Array.isArray(record.imgs)) {
    for (const item of record.imgs) {
      const u = normalizeFraserUrl(item);
      if (u && !isBlockedHost(u) && !gallery.includes(u)) gallery.push(u);
    }
  }

  if (record.image && typeof record.image === "object") {
    const imgObj = record.image as Record<string, unknown>;
    for (const [k, v] of Object.entries(imgObj)) {
      if (k === "totalCount") continue;
      if (v && typeof v === "object" && "url" in v && typeof (v as any).url === "string") {
        const u = normalizeFraserUrl((v as any).url);
        if (u && !isBlockedHost(u) && !gallery.includes(u)) gallery.push(u);
      } else if (typeof v === "string") {
        const u = normalizeFraserUrl(v);
        if (u && !isBlockedHost(u) && !gallery.includes(u)) gallery.push(u);
      }
    }
    if (typeof imgObj["0"] === "object" && imgObj["0"] !== null) {
      const zeroObj = imgObj["0"] as Record<string, unknown>;
      if (typeof zeroObj.url === "string" && !isBlockedHost(zeroObj.url)) primary = zeroObj.url;
    } else if (typeof imgObj.url === "string" && !isBlockedHost(imgObj.url)) {
      primary = imgObj.url;
    }
  }

  if (!primary) {
    const candidate = text(record.img, record.imageURL, record.photo, record.primaryPhoto, record.photoURL);
    if (!isBlockedHost(candidate)) {
      primary = candidate;
    }
  }

  if (Array.isArray(record.images)) {
    for (const item of record.images) {
      const u = normalizeFraserUrl(item);
      if (u && !isBlockedHost(u) && !gallery.includes(u)) gallery.push(u);
    }
  }

  const normalizedPrimary = normalizeFraserUrl(primary);
  const safePrimary = (!isBlockedHost(normalizedPrimary) && normalizedPrimary) || gallery[0] || fallback;
  if (safePrimary && !gallery.includes(safePrimary)) {
    gallery.unshift(safePrimary);
  }

  return { primary: safePrimary, gallery };
}

const FLORIDA_BROKERAGE_MAP: Record<string, string> = {
  SEFCBRE: "CBRE Inc.",
  SEFDEOM: "Douglas Elliman",
  SEFOSIR: "ONE Sotheby's International Realty",
  SEFCOMP: "Compass Florida LLC",
  SEFDEZE: "Dezer Platinum Realty LLC",
  SEFFRTR: "Fortune Christie's International Real Estate",
  SEFLXLR: "Luxe Living Realty",
  SEFMRYL: "The Agency Florida",
  SEFMCMA: "The Corcoran Group",
  SEFBSFR: "Brown Harris Stevens Florida",
  SEFFRMP: "Related ISG Realty",
  SEFFINR: "Berkshire Hathaway HomeServices",
  SEFERTN: "Engel & Völkers Miami",
  SEFPMGL: "Premier Estate Properties",
  SEFTCNG: "Coldwell Banker Realty",
  SEFEWM: "BHHS EWM Realty",
  SEFCERN: "Cervera Real Estate",
  SEFEXPP: "eXp Realty LLC",
  SEFTAFL: "The Agency Florida",
  SEFRDFN: "Redfin Corporation",
  SEFCSMG: "Casa Bella Realty",
  SEFKWCG: "Keller Williams Capital Realty",
  SEFBHSM: "Brown Harris Stevens Miami",
  SEFLSIR: "Liv Realty International",
  SEFLLVR: "Luxe Living Realty",
  SEFRREV: "Related Realty",
  SEFSKYR: "Sky Real Estate",
  SEFMOCR: "Modern Concept Realty",
  SEFASTN: "Aston Rose Sports & Entertainment",
  SEFROBR: "Robert Slack LLC",
  SEFAGRA: "Agora Lux Properties",
  SEFPGUT: "Piquet Realty",
  SEFGLLD: "Gables Lifestyle Luxury Realty",
};

export function resolveListingOffice(record: Record<string, unknown>, localMatch?: Record<string, unknown>): string {
  const explicit = text(
    record.listingOfficeName,
    record.listingOffice,
    record.officeName,
    record.brokerage,
    record.listingBroker,
    record.courtesyOf
  );
  if (explicit) return explicit;

  const officeId = text(record.listingOfficeID, record.officeID, record.coListingOfficeID);
  if (officeId) {
    const cleanId = officeId.toUpperCase().trim();
    for (const [prefix, name] of Object.entries(FLORIDA_BROKERAGE_MAP)) {
      if (cleanId.startsWith(prefix)) return name;
    }
  }

  if (localMatch) {
    const salesTeam = text(localMatch.salesTeam);
    if (salesTeam && salesTeam !== "—" && salesTeam !== "Private appointments available") {
      return salesTeam;
    }
    const dev = text(localMatch.developer);
    if (dev) return `${dev} (Development Sales)`;
  }

  const directSales = text(record.salesTeam);
  if (directSales && directSales !== "—" && directSales !== "Private appointments available") {
    return directSales;
  }

  return "ONE Sotheby's International Realty";
}

function parseLotSize(acres: unknown, remarks?: string): string {
  const a = number(acres);
  if (a !== null && a > 0) {
    const sqft = Math.round(a * 43560);
    if (a >= 1) return `${a.toFixed(2)} Acres (${sqft.toLocaleString()} SF)`;
    return `${sqft.toLocaleString()} SF (${a.toFixed(2)} Acres)`;
  }
  if (remarks) {
    const match = remarks.match(/(\d+(?:\.\d+)?)\s*(?:acres?|acre\b)/i);
    if (match) {
      const a2 = Number(match[1]);
      if (!isNaN(a2) && a2 > 0) {
        return `${a2.toFixed(2)} Acres (${Math.round(a2 * 43560).toLocaleString()} SF)`;
      }
    }
    const sqftMatch = remarks.match(/([\d,]+)\s*(?:sq\.?\s*ft\.?|square\s*feet|sf)\s+lot/i);
    if (sqftMatch) return `${sqftMatch[1]} SF Lot`;
  }
  return "Prime Estate Parcel";
}

function parseWaterfrontAndDock(remarks?: string, neighborhood?: string): { waterfront: string; dock: string | null } {
  if (!remarks) {
    return {
      waterfront: neighborhood ? `Direct Waterfront Estate in ${neighborhood}` : "Prime Waterfront Estate",
      dock: null,
    };
  }

  const sentences = remarks.split(/(?<=[.!?])\s+/);
  const wfSentences: string[] = [];
  const dockSentences: string[] = [];

  for (const s of sentences) {
    const lower = s.toLowerCase();
    if (lower.includes("dock") || lower.includes("boat slip") || lower.includes("yacht") || lower.includes("marina") || lower.includes("boat lift") || lower.includes("davits")) {
      dockSentences.push(s.trim());
    }
    if (lower.includes("frontage") || lower.includes("bay front") || lower.includes("oceanfront") || lower.includes("waterfront") || lower.includes("water front") || lower.includes("canal") || lower.includes("biscayne bay") || lower.includes("intracoastal") || lower.includes("water view") || lower.includes("ocean view")) {
      wfSentences.push(s.trim());
    }
  }

  const bestWf = wfSentences.find((s) => /frontage|feet of water|direct water|direct bay|direct ocean/i.test(s)) || wfSentences[0];
  const waterfront = bestWf || (neighborhood ? `Direct Waterfront Property in ${neighborhood}` : "Prime Waterfront Estate");
  const dock = dockSentences[0] || null;

  return { waterfront, dock };
}

function normalize(record: Record<string, unknown>, index: number): IdxProject | null {
  const name = text(record.name, record.projectName, record.address, record.addressFull, record.streetAddress, record.listingAddress);
  const latitude = number(record.latitude ?? record.lat);
  const longitude = number(record.longitude ?? record.lng);
  if (!name || latitude === null || longitude === null) return null;

  const price = number(record.price ?? record.listingPrice ?? record.listPrice);
  const listingId = text(record.listingID, record.listingId, record.mlsId, record.id) || `${index + 1}`;
  const status = text(record.status, record.statusRemark, record.constructionStatus, record.propStatus) || "Active";
  const neighborhood = detectNeighborhood(record);
  const stage = detectStage(record);

  // Match against curated property data by MLS ID or exact name in both waterfrontMls and localProjects
  const localMatch = (waterfrontMls as unknown as Record<string, unknown>[]).find(
    (wp) => (wp.mlsId && listingId && String(wp.mlsId).toUpperCase() === listingId.toUpperCase()) ||
            (wp.name && name && String(wp.name).toLowerCase() === name.toLowerCase())
  ) || (localProjects as unknown as Record<string, unknown>[]).find(
    (lp) => (lp.mlsId && listingId && String(lp.mlsId).toUpperCase() === listingId.toUpperCase()) ||
            (lp.name && name && String(lp.name).toLowerCase() === name.toLowerCase())
  );

  let img = "";
  let imgs: string[] = [];

  // Check if record itself has images (e.g. waterfront-mls or live MLS feed)
  const { primary: rawImg, gallery: rawImgs } = extractImage(record, neighborhood, index);

  let localCuratedImg = "";
  let localCuratedGallery: string[] = [];
  if (localMatch) {
    if (typeof localMatch.img === "string") {
      localCuratedImg = normalizeFraserUrl(localMatch.img);
    }
    if (Array.isArray(localMatch.imgs)) {
      localCuratedGallery = (localMatch.imgs as string[]).map(normalizeFraserUrl).filter(Boolean);
    }
  }

  const neighborhoodFallback = getLuxuryFallback(neighborhood, index);
  const fallbackImg = localCuratedImg || localCuratedGallery[0] || neighborhoodFallback;

  if (rawImg && rawImgs.length > 0 && !isBlockedHost(rawImg) && (Array.isArray(record.imgs) || record.img || record.image)) {
    img = rawImg;
    imgs = rawImgs.filter((u) => !isBlockedHost(u));
  } else if (localCuratedImg && !isBlockedHost(localCuratedImg)) {
    img = localCuratedImg;
    imgs = localCuratedGallery.length > 0 ? localCuratedGallery.filter((u) => !isBlockedHost(u)) : [localCuratedImg];
  } else {
    img = (!isBlockedHost(rawImg) && rawImg) ? rawImg : fallbackImg;
    const cleanRaw = rawImgs.filter((u) => !isBlockedHost(u));
    imgs = cleanRaw.length > 0 ? cleanRaw : (img ? [img] : []);
  }

  if (!img || isBlockedHost(img)) {
    img = fallbackImg;
  }
  if (!Array.isArray(imgs) || imgs.length === 0) {
    imgs = [img];
  } else {
    imgs = imgs.filter((u) => !isBlockedHost(u));
    if (imgs.length === 0) {
      imgs = [img];
    }
  }
  const beds = number(record.bedrooms ?? record.beds);
  const baths = number(record.totalBaths ?? record.baths ?? record.fullBaths);
  const sqft = number(record.sqFt ?? record.sqft);
  const rawAcres = record.acres ?? localMatch?.acres;
  const rawDescription = text(record.remarksConcat, record.description);
  const description = rawDescription
    .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s*,/gi, '“Winter White House” of President Richard Nixon,')
    .replace(/(["'“‘]?Winter White House["'”’]?\s+of)\s+(?!President|Richard)/gi, '“Winter White House” of President Richard Nixon, ');
  const fullDetailsURL = text(record.fullDetailsURL, record.detailsURL);

  const rawYear = record.yearBuilt ?? localMatch?.yearBuilt ?? record.completion;
  const yearBuiltVal = rawYear ? (number(rawYear) ?? String(rawYear)) : (sqft ? "Contact for details" : "");
  const yearBuilt = record.yearBuilt ? String(record.yearBuilt) : (localMatch?.yearBuilt ? String(localMatch.yearBuilt) : "");

  const dateAddedStr = text(record.dateAdded, localMatch?.dateAdded);
  const daysOnMarket = dateAddedStr
    ? Math.max(1, Math.round((Date.now() - new Date(dateAddedStr).getTime()) / (1000 * 60 * 60 * 24)))
    : (number(record.daysOnMarket) ?? (localMatch?.daysOnMarket ? number(localMatch.daysOnMarket) : 45));

  const { waterfront: wfDetails, dock: dDetails } = parseWaterfrontAndDock(description, neighborhood);
  const waterfrontDetails = text(record.waterfrontDetails, localMatch?.waterfrontDetails) || wfDetails;
  const dockDetails = text(record.dockDetails, localMatch?.dockDetails) || dDetails;
  const lotSize = text(record.lotSize, localMatch?.lotSize) || parseLotSize(rawAcres, description);

  // Check if listing is a resale home
  const isPreconDevelopment = Boolean(
    record.depositStructure ||
    record.floorPlans ||
    (record.developer && !record.mlsId) ||
    (localProjects as unknown as Record<string, unknown>[]).some(
      (lp) => (lp.slug && record.slug && String(lp.slug).toLowerCase() === String(record.slug).toLowerCase()) ||
              (lp.name && name && String(lp.name).toLowerCase() === name.toLowerCase())
    )
  );

  const isResale = Boolean(
    record.isResale ??
    localMatch?.isResale ??
    (!isPreconDevelopment && (Boolean(record.mlsId || listingId) || record.propType === "Residential" || Boolean(rawAcres)))
  );

  let pricePerSqft: number | null = number(record.pricePerSqft);
  if (!pricePerSqft && price && sqft && sqft > 0) {
    pricePerSqft = Math.round(price / sqft);
  }

  // Determine property subtype (single-family estate vs condo vs penthouse)
  const resolvedSubtype = text(record.propertySubtype) || (
    (() => {
      const nm = name || "";
      const dsc = description.toLowerCase();
      const hasUnit = /[\s#]+(?:unit|apt|ph|penthouse)?\s*[0-9]+[a-z]?$/i.test(nm.trim()) ||
                      /#\s*[0-9]+/i.test(nm) ||
                      /\bPH[0-9]+/i.test(nm) ||
                      /\b(?:unit|apt|suite)\s*[\w\d-]+/i.test(nm) ||
                      String(record.slug || "").includes("-unit-") ||
                      String(record.slug || "").includes("-ph-") ||
                      String(record.slug || "").includes("-penthouse-");
      const condoKeywords = [
        "condo", "condominium", "penthouse", "triplex penthouse", "duplex penthouse",
        "tower", "residences atop", "floor unit", "full-floor residence", "sky residence"
      ];
      const hasCondoDesc = condoKeywords.some((kw) => dsc.includes(kw));
      const sfKeywords = [
        "single-family", "single family", "estate parcel", "acres", "dockage for yachts",
        "private island lot", "gated estate", "custom estate", "lawn"
      ];
      const hasSfDesc = sfKeywords.some((kw) => dsc.includes(kw));
      if (hasUnit || (hasCondoDesc && !hasSfDesc)) {
        const isPh = dsc.includes("penthouse") || nm.toLowerCase().includes("ph") || String(record.slug || "").includes("-ph");
        return isPh ? "penthouse" : "condo";
      }
      return "single-family";
    })()
  );
  const propertySubtype = (resolvedSubtype as "single-family" | "condo" | "penthouse") || "single-family";
  const propertySubtypeLabel = text(record.propertySubtypeLabel) || (
    propertySubtype === "penthouse"
      ? "Waterfront Penthouse"
      : propertySubtype === "condo"
        ? "Waterfront Condominium"
        : "Single-Family Estate"
  );

  return {
    id: (typeof record.id === "number" ? record.id : Number(listingId.replace(/\D/g, ""))) || index + 1,
    mlsId: listingId,
    slug: record.slug ? String(record.slug) : slugify(`${name}-${listingId}`),
    name,
    shortName: text(record.shortName, name),
    neighborhood,
    stage,
    isActive: !/sold|withdrawn|closed/i.test(status),
    isFeatured: Boolean(record.isFeatured || (record.featured === "y") || index < 6),
    lat: latitude,
    lng: longitude,
    minPrice: (number(record.minPrice) ?? price),
    maxPrice: (number(record.maxPrice) ?? price),
    priceFrom: text(record.priceFrom) || (price ? `$${price.toLocaleString("en-US")}` : "Pricing on request"),
    completion: text(record.completion, record.completionDate) || (yearBuilt ? String(yearBuilt) : "Contact for details"),
    statusRemark: text(record.statusRemark, status),
    badge: text(record.badge) || `MLS #${listingId} · ACTIVE`,
    units: text(record.units) || (sqft ? `${sqft.toLocaleString("en-US")} SF` : "—"),
    img,
    imgs,
    fallbackImg,
    minBed: number(record.minBed) ?? beds,
    maxBed: number(record.maxBed) ?? beds,
    baths: baths ?? (number(record.baths) ?? undefined),
    sqft: sqft ?? (number(record.sqft) ?? undefined),
    pricePerSqft,
    description: text(record.description, description),
    fullDetailsURL,
    address: text(record.address, record.addressFull),
    tagline: text(record.tagline),
    editorialLine: text(record.editorialLine),
    stories: number(record.stories),
    height: number(record.height),
    hoa: text(record.hoa),
    developer: text(record.developer),
    architect: text(record.architect),
    interiorDesigner: text(record.interiorDesigner),
    landscapeArchitect: text(record.landscapeArchitect),
    salesTeam: text(record.salesTeam),
    depositStructure: record.depositStructure,
    floorPlans: Array.isArray(record.floorPlans) ? record.floorPlans : undefined,
    amenities: Array.isArray(record.amenities) ? record.amenities : undefined,
    amenitiesDescription: text(record.amenitiesDescription),
    featureVideo: record.featureVideo,
    featureVideoPlacement: text(record.featureVideoPlacement),
    videoTourId: text(record.videoTourId),
    floorPlanPdf: text(record.floorPlanPdf),
    factSheetURL: text(record.factSheetURL),
    keyMetrics: Array.isArray(record.keyMetrics) ? record.keyMetrics : undefined,
    constructionImgs: Array.isArray(record.constructionImgs) ? record.constructionImgs : undefined,
    constructionNote: text(record.constructionNote),
    constructionUpdateDate: text(record.constructionUpdateDate),
    listingOffice: resolveListingOffice(record, localMatch),
    listingAgent: text(record.listingAgentID, record.listingAgentName),
    isResale,
    propertyType: isResale ? "resale" : "development",
    yearBuilt: yearBuilt || (rawYear ? String(rawYear) : undefined),
    lotSize,
    acres: rawAcres ? number(rawAcres) : null,
    daysOnMarket,
    waterfrontDetails,
    dockDetails,
    dateAdded: dateAddedStr || undefined,
    propertySubtype,
    propertySubtypeLabel,
  };
}

export type IdxDataSource = "live_idx_api" | "memory_cache" | "fallback_json";

let lastDataSource: IdxDataSource = "fallback_json";

export async function getIdxPropertiesWithMeta(forceRefresh = false): Promise<{
  projects: IdxProject[];
  source: IdxDataSource;
  timestamp: string;
}> {
  const cacheTtl = getCacheSeconds();
  const now = Date.now();

  // Only serve memory cache if caching is explicitly enabled (> 0) and not forcing refresh
  if (!forceRefresh && cacheTtl > 0 && cachedProjects && now - cacheTimestamp < cacheTtl * 1000) {
    console.log(`⚡ [IDX BROKER] Memory cache hit — serving ${cachedProjects.length} listings (valid for ${Math.round((cacheTtl * 1000 - (now - cacheTimestamp)) / 1000 / 60)} more mins)`);
    return {
      projects: cachedProjects,
      source: "memory_cache",
      timestamp: new Date(cacheTimestamp).toISOString(),
    };
  }

  // If a live fetch is currently in-flight, reuse it so concurrent requests share the same live response
  if (inFlightRequest) {
    return inFlightRequest;
  }

  inFlightRequest = (async () => {
    try {
      return await fetchLiveProperties();
    } finally {
      inFlightRequest = null;
    }
  })();

  return inFlightRequest;
}

async function fetchLiveProperties(): Promise<{
  projects: IdxProject[];
  source: IdxDataSource;
  timestamp: string;
}> {
  const now = Date.now();
  const endpoint = process.env.IDX_BROKER_LISTINGS_URL || DEFAULT_ENDPOINT;
  const accessKey = process.env.IDX_BROKER_ACCESS_KEY || process.env.IDX_BROKER_API_KEY || DEFAULT_API_KEY;
  const ancillaryKey = process.env.IDX_BROKER_ANCILLARY_KEY;

  console.log(`🌐 [IDX BROKER] Calling live API: ${endpoint}...`);

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const response = await fetch(endpoint, {
      headers: {
        accesskey: accessKey,
        ...(ancillaryKey ? { ancillarykey: ancillaryKey } : {}),
        outputtype: "json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      next: { revalidate: 3600 },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (response.ok) {
      const payload: unknown = await response.json();
      const records = Array.isArray(payload)
        ? payload
        : payload && typeof payload === "object"
        ? Object.values(payload as Record<string, unknown>).filter(
            (item): item is Record<string, unknown> => !!item && typeof item === "object" && !Array.isArray(item)
          )
        : [];

      const normalized = records
        .map(normalize)
        .filter((item): item is IdxProject => item !== null && item.img.length > 0);

      if (normalized.length > 0) {
        cachedProjects = normalized;
        cacheTimestamp = now;
        lastDataSource = "live_idx_api";
        console.log(`🟢 [IDX BROKER] LIVE API SUCCESS: Loaded ${normalized.length} active listings from BeachesMLS & Miami AOR!`);
        return {
          projects: normalized,
          source: "live_idx_api",
          timestamp: new Date(now).toISOString(),
        };
      }
    } else {
      console.warn(`⚠️ [IDX BROKER] API error status ${response.status}. Switching to backup miami-projects.json...`);
    }
  } catch (error) {
    console.warn(`⚠️ [IDX BROKER] API fetch failed (${error instanceof Error ? error.message : "timeout"}). Switching to backup miami-projects.json...`);
  }

  // Graceful fallback to static miami-projects.json only if live API fails
  const fallback = (localProjects as unknown as Record<string, unknown>[])
    .map((item, idx) => normalize(item, idx))
    .filter((item): item is IdxProject => item !== null);

  cachedProjects = fallback;
  cacheTimestamp = now;
  lastDataSource = "fallback_json";
  console.log(`📁 [IDX BROKER] FALLBACK ACTIVE: Serving ${fallback.length} listings from local miami-projects.json`);
  return {
    projects: fallback,
    source: "fallback_json",
    timestamp: new Date(now).toISOString(),
  };
}

export async function getIdxProperties(): Promise<IdxProject[]> {
  const result = await getIdxPropertiesWithMeta();
  return result.projects;
}

export async function getIdxWaterfrontProperties(): Promise<IdxProject[]> {
  const all = await getIdxProperties();
  const waterfront = all.filter((p) => {
    const hood = (p.neighborhood || "").toLowerCase();
    const name = (p.name || "").toLowerCase();
    return (
      hood.includes("beach") ||
      hood.includes("island") ||
      hood.includes("key biscayne") ||
      hood.includes("bal harbour") ||
      hood.includes("surfside") ||
      hood.includes("coconut grove") ||
      name.includes("bay") ||
      name.includes("waterfront") ||
      name.includes("coastal") ||
      name.includes("harbour")
    );
  });
  return waterfront.length >= 10 ? waterfront : (waterfrontMls as unknown as IdxProject[]);
}

const galleryCache = new Map<string, string[]>();

export async function fetchListingGalleryPhotos(detailsUrl: string): Promise<string[]> {
  if (!detailsUrl) return [];
  const cached = galleryCache.get(detailsUrl);
  if (cached && cached.length > 0) return cached;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(detailsUrl, {
      signal: controller.signal,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      },
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const html = await res.text();
    const matches = Array.from(
      html.matchAll(/data-src="\s*(https:\/\/api\.cotality\.com\/trestle\/Media\/Property\/[^"]+)"/g)
    ).map((m) => m[1].trim());
    const unique = Array.from(new Set(matches));
    if (unique.length > 0) {
      galleryCache.set(detailsUrl, unique);
      return unique;
    }
  } catch (err) {
    console.warn("Could not load gallery photos from detailsUrl:", err);
  }
  return [];
}

async function enrichProjectGallery(project: IdxProject): Promise<IdxProject> {
  if (project.fullDetailsURL) {
    const fullGallery = await fetchListingGalleryPhotos(project.fullDetailsURL);
    if (fullGallery && fullGallery.length > 0) {
      project.imgs = fullGallery;
      project.img = fullGallery[0];
    }
  }
  return project;
}

export async function getIdxPropertyBySlug(slug: string): Promise<IdxProject | null> {
  const normalizedSlug = slug.toLowerCase().trim();

  // 0. Check individual rich project detail JSON on disk
  try {
    const detailPath = path.join(process.cwd(), "src/data/projects-detail", `${normalizedSlug}.json`);
    if (fs.existsSync(detailPath)) {
      const detailRaw = JSON.parse(fs.readFileSync(detailPath, "utf-8"));
      const normalizedDetail = normalize(detailRaw, 0);
      if (normalizedDetail) return enrichProjectGallery(normalizedDetail);
    }
  } catch (err) {
    console.error("Error reading project detail JSON:", err);
  }

  // 1. Direct match in local pre-construction condos (Priority 1)
  const preconstructionList = (localProjects as unknown as Record<string, unknown>[])
    .map((item, idx) => normalize(item, idx))
    .filter((item): item is IdxProject => item !== null);

  const preconFound = preconstructionList.find((p) => p.slug.toLowerCase() === normalizedSlug);
  if (preconFound) return enrichProjectGallery(preconFound);

  // 2. Direct match in waterfront MLS listings (Priority 2)
  const mlsList = (waterfrontMls as unknown as Record<string, unknown>[])
    .map((item, idx) => normalize(item, idx))
    .filter((item): item is IdxProject => item !== null);

  const mlsFound = mlsList.find((p) => p.slug.toLowerCase() === normalizedSlug);
  if (mlsFound) return enrichProjectGallery(mlsFound);

  // 3. Match by MLS ID suffix (e.g. from slug suffix "...-a12005335")
  const slugParts = normalizedSlug.split("-");
  const possibleMls = slugParts[slugParts.length - 1]?.toUpperCase();
  if (possibleMls) {
    const byMls = mlsList.find((p) =>
      p.mlsId?.toUpperCase() === possibleMls ||
      p.badge?.toUpperCase().includes(possibleMls) ||
      String(p.id).toUpperCase() === possibleMls
    );
    if (byMls) return enrichProjectGallery(byMls);
  }

  // 4. Match in live IDX Broker feed
  try {
    const liveProperties = await getIdxProperties();
    const liveFound = liveProperties.find((p) => p.slug.toLowerCase() === normalizedSlug);
    if (liveFound) return enrichProjectGallery(liveFound);

    if (possibleMls) {
      const liveByMls = liveProperties.find((p) =>
        p.mlsId?.toUpperCase() === possibleMls ||
        p.badge?.toUpperCase().includes(possibleMls) ||
        String(p.id).toUpperCase() === possibleMls
      );
      if (liveByMls) return enrichProjectGallery(liveByMls);
    }
  } catch (e) {
    console.error("Live IDX lookup failed:", e);
  }

  // 5. Fuzzy match on title/name
  const searchName = normalizedSlug.replace(/-/g, " ");
  const byName = preconstructionList.find((p) => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()))
    || mlsList.find((p) => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
  if (byName) return enrichProjectGallery(byName);

  return null;
}

export function getPreconstructionProjects(): IdxProject[] {
  return (localProjects as unknown as IdxProject[]).filter((p) => p.isActive !== false);
}
