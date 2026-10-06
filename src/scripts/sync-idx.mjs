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

function fetchUrl(url, headers = {}) {
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

function cleanText(text) {
  return (text || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function slugify(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function formatPrice(val) {
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

async function scrapeGalleryPhotos(detailsUrl) {
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

function detectNeighborhood(item) {
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

function detectStage(item) {
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
  const listingsArray = Array.isArray(rawListings)
    ? rawListings
    : Object.values(rawListings).filter((item) => typeof item === "object" && item !== null);

  console.log(`Received ${listingsArray.length} raw listings from IDX Broker.`);

  // Enrich top 15 listings with full photo gallery
  const GALLERY_ENRICH_LIMIT = 15;
  console.log(`Fetching full photo galleries for top ${GALLERY_ENRICH_LIMIT} properties...`);

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

    // Photos array
    let propertyPhotos = primaryPhoto ? [primaryPhoto] : [];

    if (i < GALLERY_ENRICH_LIMIT && fullDetailsURL) {
      process.stdout.write(`[${i + 1}/${GALLERY_ENRICH_LIMIT}] Loading gallery for ${address}... `);
      const gallery = await scrapeGalleryPhotos(fullDetailsURL);
      if (gallery.length > 0) {
        propertyPhotos = gallery;
        console.log(`(${gallery.length} photos)`);
      } else {
        console.log(`(1 photo)`);
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
      img: getFallback(neighborhood, i),
      imgs: [
        getFallback(neighborhood, i),
        getFallback(neighborhood, i + 1),
        getFallback(neighborhood, i + 2),
        getFallback(neighborhood, i + 3),
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

  const LUXURY_FALLBACKS = {
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

  const getFallback = (neighborhood, seed) => {
    const s = (neighborhood || "").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const p = LUXURY_FALLBACKS[s] || LUXURY_FALLBACKS["miami-beach"];
    return p[Math.abs(seed) % p.length];
  };

  // Save projects to miami-projects.json
  const outputPath = path.join(process.cwd(), "src/data/miami-projects.json");
  fs.writeFileSync(outputPath, JSON.stringify(projects, null, 2), "utf8");
  console.log(`\nSuccessfully saved ${projects.length} real IDX listings to ${outputPath}!`);

  // Update featured projects with reliable luxury visuals
  const topFeatured = projects.slice(0, 6).map((p, idx) => ({
    neighborhood: p.neighborhood,
    name: p.name,
    price: p.priceFrom,
    status: `MLS #${p.mlsId} · ACTIVE`,
    image: getFallback(p.neighborhood, idx),
    cta: "View listing",
    slug: p.slug,
  }));

  const featuredFile = path.join(process.cwd(), "src/features/Home/FeaturedProject/data/featured-project.data.ts");
  fs.writeFileSync(
    featuredFile,
    `import type { Project } from "@/src/features/Home/FeaturedProject/types/featured-project.types";\n\nexport const featuredProjects: Project[] = ${JSON.stringify(
      topFeatured,
      null,
      2
    )};\n`,
    "utf8"
  );
  console.log("Updated featured-project.data.ts with live IDX listings!");

  // Update hero slides with reliable luxury visuals
  const heroSlides = projects.slice(0, 5).map((p, idx) => ({
    image: getFallback(p.neighborhood, idx),
    eyebrow: p.neighborhood,
    title: p.name,
    supporting: `MLS #${p.mlsId} · ${p.priceFrom} · ${p.minBed ? p.minBed + "-Bed " : ""}Luxury Residence`,
    credit: `BEACHESMLS · ACTIVE · ${p.priceFrom}`,
    slug: p.slug,
  }));

  const heroFile = path.join(process.cwd(), "src/features/Home/HeroSection/data/hero-section.data.ts");
  fs.writeFileSync(
    heroFile,
    `import type { HeroSlide } from "@/src/features/Home/HeroSection/types/hero-section.types";\n\nexport const heroSlides: HeroSlide[] = ${JSON.stringify(
      heroSlides,
      null,
      2
    )};\n`,
    "utf8"
  );
  console.log("Updated hero-section.data.ts with live IDX listings!");

  // Update discovery engine project names
  const projectNames = projects.map((p) => p.name);
  const discoveryFile = path.join(process.cwd(), "src/features/Home/DiscoveryEngine/data/discovery-engine.data.ts");
  fs.writeFileSync(
    discoveryFile,
    `import type { ProjectName } from "@/src/features/Home/DiscoveryEngine/types/discovery-engine.types";\n\nexport const projectNames: ProjectName[] = ${JSON.stringify(
      projectNames,
      null,
      2
    )};\n`,
    "utf8"
  );
  console.log("Updated discovery-engine.data.ts with live IDX listings!");
}

syncIdxData().catch((err) => {
  console.error("Sync failed:", err);
  process.exit(1);
});
