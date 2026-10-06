import fs from "fs";
import path from "path";
import https from "https";

function loadEnv() {
  const envPath = path.join(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }
}

loadEnv();

const API_KEY = process.env.IDX_BROKER_API_KEY || process.env.IDX_BROKER_ACCESS_KEY || "0L2Z42xQg1J1_vEjibNXfX";
const ENDPOINT = process.env.IDX_BROKER_LISTINGS_URL || "https://api.idxbroker.com/clients/savedlinks/3906/results";

function fetchUrl(url: string, headers: Record<string, string> = {}): Promise<{ statusCode: number | undefined; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: "GET",
        headers: headers,
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ statusCode: res.statusCode, body: data }));
      }
    );
    req.on("error", reject);
    req.end();
  });
}

function cleanText(text: string | null | undefined): string {
  return (text || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(text: string | null | undefined): string {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(val: number): string {
  if (!val) return "Pricing on request";
  if (val >= 1000000) {
    const m = (val / 1000000).toFixed(1).replace(/\.0$/, "");
    return `$${m}M`;
  }
  if (val >= 1000) {
    return `$${(val / 1000).toFixed(0)}K`;
  }
  return `$${val.toLocaleString("en-US")}`;
}

async function scrapeGalleryPhotos(detailsUrl: string): Promise<string[]> {
  if (!detailsUrl) return [];
  try {
    const res = await fetchUrl(detailsUrl);
    if (res.statusCode !== 200) return [];
    const photoMatches = Array.from(
      res.body.matchAll(/data-src="\s*(https:\/\/api\.cotality\.com\/trestle\/Media\/Property\/[^"]+)"/g)
    ).map((m) => m[1]);
    return Array.from(new Set(photoMatches));
  } catch {
    return [];
  }
}

function detectNeighborhood(item: Record<string, any>): string {
  const city = (item.cityName || "").trim();
  const addr = (item.address || "").toLowerCase();
  const desc = (item.remarksConcat || "").toLowerCase();
  const zip = String(item.zipcode || "").slice(0, 5);

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

function detectStage(item: Record<string, any>): "preconstruction" | "under_construction" | "topped_off" | "move_in_ready" {
  const status = cleanText(item.propStatus || item.status || "").toLowerCase();
  const desc = cleanText(item.remarksConcat || "").toLowerCase();
  const yearBuilt = Number(item.yearBuilt);
  const currentYear = new Date().getFullYear();

  if (status.includes("pre") || status.includes("coming soon") || desc.includes("pre-construction")) return "preconstruction";
  if (status.includes("topped")) return "topped_off";
  if (status.includes("under construction") || desc.includes("under construction")) return "under_construction";
  if (yearBuilt && yearBuilt > currentYear + 1) return "preconstruction";
  if (yearBuilt && yearBuilt > currentYear) return "under_construction";
  return "move_in_ready";
}

async function syncIdxData() {
  console.log("Connecting to IDX Broker REST API using API Key...");
  console.log("Endpoint:", ENDPOINT);

  const res = await fetchUrl(ENDPOINT, {
    accesskey: API_KEY,
    outputtype: "json",
  });

  if (res.statusCode !== 200) {
    throw new Error(`IDX Broker API responded with status ${res.statusCode}: ${res.body.slice(0, 300)}`);
  }

  const rawListings = JSON.parse(res.body);
  const listingsArray: Record<string, any>[] = Array.isArray(rawListings)
    ? rawListings
    : Object.values(rawListings).filter((item): item is Record<string, any> => typeof item === "object" && item !== null);

  console.log(`Received ${listingsArray.length} raw listings from IDX Broker.`);

  const GALLERY_ENRICH_LIMIT = 15;
  const projects = [];

  for (let i = 0; i < listingsArray.length; i++) {
    const item = listingsArray[i];
    const listingId = String(item.listingID || item.listingId || i + 1);
    const address = cleanText(item.address || "Miami Luxury Residence");
    const slug = slugify(`${address}-${listingId}`);
    const price = Number(item.price ?? item.listingPrice?.replace(/[^0-9]/g, "")) || 0;
    const sqft = Number(String(item.sqFt || "").replace(/[^0-9]/g, "")) || 0;
    const ppsf = price && sqft ? Math.round(price / sqft) : null;
    const neighborhood = detectNeighborhood(item);
    const stage = detectStage(item);
    const beds = Number(item.bedrooms) || null;
    const baths = Number(item.totalBaths ?? item.fullBaths) || null;
    const description = cleanText(item.remarksConcat);
    const fullDetailsURL = item.fullDetailsURL || "";

    let primaryPhoto = "";
    if (item.image && typeof item.image === "object") {
      primaryPhoto = item.image["0"]?.url || "";
    }
    if (!primaryPhoto && item.photo) primaryPhoto = item.photo;

    let propertyPhotos = primaryPhoto ? [primaryPhoto] : [];

    if (i < GALLERY_ENRICH_LIMIT && fullDetailsURL) {
      const gallery = await scrapeGalleryPhotos(fullDetailsURL);
      if (gallery.length > 0) {
        propertyPhotos = gallery;
      }
    }

    projects.push({
      id: i + 1,
      mlsId: listingId,
      slug: slug,
      name: address,
      shortName: address,
      neighborhood: neighborhood,
      stage: stage,
      isActive: true,
      isFeatured: i < 6,
      lat: Number(item.latitude) || 25.7617,
      lng: Number(item.longitude) || -80.1918,
      minPrice: price,
      maxPrice: price,
      minBed: beds,
      maxBed: beds,
      baths: baths,
      sqft: sqft,
      priceFrom: formatPrice(price),
      completion: item.yearBuilt ? String(item.yearBuilt) : "Move-In Ready",
      units: sqft ? `${sqft.toLocaleString()} SF` : "Luxury Estate",
      pricePerSqft: ppsf,
      comingSoon: stage === "preconstruction",
      statusRemark: item.propStatus || "Active",
      badge: `MLS #${listingId} · ACTIVE`,
      img: "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
      imgs: [
        "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
        "https://frasermiami.s3.amazonaws.com/shoreclub/hero-beach-view.webp",
        "https://frasermiami.s3.amazonaws.com/ciprianiresidences/skyline.webp",
        "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp"
      ],
      description:
        description ||
        `Exceptional luxury residence located at ${address} in ${neighborhood}. Features ${beds || "spacious"} bedrooms, ${baths || "multiple"} baths, and ${sqft ? sqft.toLocaleString() + " square feet" : "expansive living space"}. Active MLS listing represented via Zachary Akers (ONE Sotheby's International Realty).`,
      fullDetailsURL: fullDetailsURL,
      discoveryEngine: {
        lifestyle: [
          address.toLowerCase().includes("water") || price > 30000000 ? "waterfront" : "city-view",
          neighborhood.toLowerCase().replace(/\s+/g, "-"),
          "luxury-estate",
        ],
        investmentProfile: ["active-mls", "prime-location", "immediate-delivery"],
        priceCategory: price >= 25000000 ? "ultra-luxury" : "luxury",
        vibeMatch: ["estate-living", "high-privacy", "architectural"],
        goodFor: ["primary-residence", "trophy-asset", "lifestyle-buyer"],
      },
      wellnessScore: null,
    });
  }

  const outputPath = path.join(process.cwd(), "src/data/miami-projects.json");
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2), "utf8");
  console.log(`\nSuccessfully saved ${projects.length} real IDX listings to ${outputPath}!`);
}

export { syncIdxData };
