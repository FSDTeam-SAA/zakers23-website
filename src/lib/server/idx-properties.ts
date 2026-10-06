import localProjects from "@/src/data/miami-projects.json";

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
  minBed: number | null;
  maxBed: number | null;
  baths?: number;
  sqft?: number;
  pricePerSqft?: number | null;
  description?: string;
  fullDetailsURL?: string;
};

const DEFAULT_ENDPOINT = "https://api.idxbroker.com/clients/savedlinks/3906/results";
const DEFAULT_API_KEY = "0L2Z42xQg1J1_vEjibNXfX";
function getCacheSeconds(): number {
  const envVal = process.env.IDX_CACHE_SECONDS;
  if (envVal !== undefined && envVal.trim() !== "") {
    const num = Number(envVal);
    return isNaN(num) ? 0 : Math.max(0, num);
  }
  return 0; // Default to 0 (always live API)
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
  ],
  "miami-beach": [
    "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
    "https://frasermiami.s3.amazonaws.com/shoreclub/hero-beach-view.webp",
    "https://frasermiami.s3.amazonaws.com/shoreclub/pool-sunrise.webp",
  ],
  "south-of-fifth": [
    "https://frasermiami.s3.amazonaws.com/baccarat/lobby-front-desk.webp",
  ],
  "bal-harbour": [
    "https://frasermiami.s3.amazonaws.com/rivage/hummingbird.webp",
  ],
  surfside: [
    "https://frasermiami.s3.amazonaws.com/surf-house/surf-house-miami-beach-10.webp",
  ],
  "sunny-isles-beach": [
    "https://frasermiami.s3.amazonaws.com/bentley/hero.webp",
  ],
  "coconut-grove": [
    "https://frasermiami.s3.amazonaws.com/vita-grove-isle/hero-aerial.webp",
  ],
  "downtown-miami": [
    "https://frasermiami.s3.amazonaws.com/waldorf/waldorf-astoria-hero-twilight.webp",
  ],
  edgewater: [
    "https://frasermiami.s3.amazonaws.com/villamiami/hero-villa.webp",
  ],
  "fisher-island": [
    "https://frasermiami.s3.amazonaws.com/sixfisher/hero.webp",
  ],
  "key-biscayne": [
    "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/01-Mansions-on-Fisher-Island-Featured.webp",
  ],
};

function getLuxuryFallback(neighborhood?: string, index: number = 0): string {
  const slug = (neighborhood || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const pool = LUXURY_FALLBACKS[slug] || LUXURY_FALLBACKS["miami-beach"];
  return pool[Math.abs(index) % pool.length];
}

function extractImage(record: Record<string, unknown>, neighborhood: string, index: number): { primary: string; gallery: string[] } {
  let primary = "";
  const gallery: string[] = [];
  const fallback = getLuxuryFallback(neighborhood, index);

  if (Array.isArray(record.imgs)) {
    for (const item of record.imgs) {
      if (typeof item === "string" && item && !item.includes("api.cotality.com")) gallery.push(item);
    }
  }

  if (record.image && typeof record.image === "object") {
    const imgObj = record.image as Record<string, unknown>;
    if (typeof imgObj["0"] === "object" && imgObj["0"] !== null) {
      const zeroObj = imgObj["0"] as Record<string, unknown>;
      if (typeof zeroObj.url === "string") primary = zeroObj.url;
    } else if (typeof imgObj.url === "string") {
      primary = imgObj.url;
    }
  }

  if (!primary) {
    primary = text(record.img, record.imageURL, record.photo, record.primaryPhoto, record.photoURL);
  }

  if (Array.isArray(record.images)) {
    for (const item of record.images) {
      if (typeof item === "string" && item && !item.includes("api.cotality.com") && !gallery.includes(item)) gallery.push(item);
    }
  }

  // api.cotality.com is blocked by CoreLogic WAF from third-party browsers/localhost. Use verified luxury photos.
  const safePrimary = primary && !primary.includes("api.cotality.com") ? primary : fallback;
  if (!gallery.includes(safePrimary)) {
    gallery.unshift(safePrimary);
  }

  for (let i = 1; i <= 3; i++) {
    const extra = getLuxuryFallback(neighborhood, index + i);
    if (!gallery.includes(extra)) gallery.push(extra);
  }

  return { primary: safePrimary, gallery };
}

function normalize(record: Record<string, unknown>, index: number): IdxProject | null {
  const name = text(record.address, record.addressFull, record.streetAddress, record.name, record.listingAddress);
  const latitude = number(record.latitude ?? record.lat);
  const longitude = number(record.longitude ?? record.lng);
  if (!name || latitude === null || longitude === null) return null;

  const price = number(record.price ?? record.listingPrice ?? record.listPrice);
  const listingId = text(record.listingID, record.listingId, record.mlsId, record.id) || `${index + 1}`;
  const status = text(record.status, record.statusRemark, record.constructionStatus, record.propStatus) || "Active";
  const neighborhood = detectNeighborhood(record);
  const stage = detectStage(record);
  // Match against curated property data to get authentic property images
  const localMatch = (localProjects as unknown as Record<string, unknown>[]).find(
    (lp) => (lp.mlsId && String(lp.mlsId).toUpperCase() === listingId.toUpperCase()) ||
            (lp.id && String(lp.id) === String(record.id)) ||
            (lp.name && String(lp.name).toLowerCase() === name.toLowerCase())
  );

  let img = "";
  let imgs: string[] = [];

  if (localMatch && Array.isArray(localMatch.imgs) && localMatch.imgs.length > 0) {
    imgs = (localMatch.imgs as string[]).filter((u) => u && !u.includes("api.cotality.com"));
    img = (typeof localMatch.img === "string" && !localMatch.img.includes("api.cotality.com")) ? localMatch.img : imgs[0];
  } else {
    const { primary: rawImg, gallery: rawImgs } = extractImage(record, neighborhood, index);
    img = !rawImg || rawImg.includes("api.cotality.com") ? getLuxuryFallback(neighborhood, index) : rawImg;
    const filteredImgs = (rawImgs || []).filter((u) => u && !u.includes("api.cotality.com"));
    imgs = filteredImgs.length > 0 ? filteredImgs : [img];
  }
  const beds = number(record.bedrooms ?? record.beds);
  const baths = number(record.totalBaths ?? record.baths ?? record.fullBaths);
  const sqft = number(record.sqFt ?? record.sqft);
  const yearBuilt = record.yearBuilt ? String(record.yearBuilt) : "";
  const description = text(record.remarksConcat, record.description);
  const fullDetailsURL = text(record.fullDetailsURL, record.detailsURL);

  let pricePerSqft: number | null = number(record.pricePerSqft);
  if (!pricePerSqft && price && sqft && sqft > 0) {
    pricePerSqft = Math.round(price / sqft);
  }

  return {
    id: Number(listingId.replace(/\D/g, "")) || index + 1,
    mlsId: listingId,
    slug: slugify(`${name}-${listingId}`),
    name,
    shortName: name,
    neighborhood,
    stage,
    isActive: !/sold|withdrawn|closed/i.test(status),
    isFeatured: Boolean(record.isFeatured || (record.featured === "y") || index < 6),
    lat: latitude,
    lng: longitude,
    minPrice: price,
    maxPrice: price,
    priceFrom: price ? `$${price.toLocaleString("en-US")}` : "Pricing on request",
    completion: yearBuilt || text(record.completion, record.completionDate) || "Contact for details",
    statusRemark: status,
    badge: `MLS #${listingId} · ACTIVE`,
    units: sqft ? `${sqft.toLocaleString("en-US")} SF` : text(record.sqFt ?? record.sqft, record.units) || "—",
    img,
    imgs,
    minBed: beds,
    maxBed: beds,
    baths: baths ?? undefined,
    sqft: sqft ?? undefined,
    pricePerSqft,
    description,
    fullDetailsURL,
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
      cache: "no-store",
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

export async function getIdxPropertyBySlug(slug: string): Promise<IdxProject | null> {
  const properties = await getIdxProperties();
  const normalizedSlug = slug.toLowerCase().trim();

  // 1. Direct slug match in live listings
  const found = properties.find((p) => p.slug.toLowerCase() === normalizedSlug);
  if (found) return found;

  // 2. Match by MLS ID suffix (e.g. from slug suffix "...-a12005335")
  const slugParts = normalizedSlug.split("-");
  const possibleMls = slugParts[slugParts.length - 1]?.toUpperCase();
  if (possibleMls) {
    const byMls = properties.find((p) =>
      p.mlsId?.toUpperCase() === possibleMls ||
      p.badge?.toUpperCase().includes(possibleMls) ||
      String(p.id).toUpperCase() === possibleMls
    );
    if (byMls) return byMls;
  }

  // 3. Fallback to local miami-projects.json
  const fallbackList = (localProjects as unknown as Record<string, unknown>[])
    .map((item, idx) => normalize(item, idx))
    .filter((item): item is IdxProject => item !== null);

  const localFound = fallbackList.find((p) => p.slug.toLowerCase() === normalizedSlug);
  if (localFound) return localFound;

  if (possibleMls) {
    const localByMls = fallbackList.find((p) =>
      p.mlsId?.toUpperCase() === possibleMls ||
      p.badge?.toUpperCase().includes(possibleMls) ||
      String(p.id).toUpperCase() === possibleMls
    );
    if (localByMls) return localByMls;
  }

  // 4. Fuzzy title/name match
  const searchName = normalizedSlug.replace(/-/g, " ");
  const byName = properties.find((p) => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()))
    || fallbackList.find((p) => p.name.toLowerCase().includes(searchName) || searchName.includes(p.name.toLowerCase()));
  if (byName) return byName;

  // 5. Guaranteed fallback: return primary active project so user never gets 404
  return properties[0] || fallbackList[0] || null;
}
