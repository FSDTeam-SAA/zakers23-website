/**
 * Image Utilities and Fallback Handlers
 */

export const FALLBACK_IMAGE_URL = "/images/no-image.svg";
export const LUXURY_FALLBACK_IMAGE_URL = "/images/luxury-placeholder.jpg";

export const DIVERSE_LUXURY_FALLBACKS = [
  "https://frasermiami.s3.amazonaws.com/ciprianiresidences/skyline.webp",
  "https://frasermiami.s3.amazonaws.com/perigon/pool2.webp",
  "https://frasermiami.s3.amazonaws.com/sixfisher/pool.webp",
  "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
  "https://frasermiami.s3.amazonaws.com/shoreclub/hero-beach-view.webp",
  "https://frasermiami.s3.amazonaws.com/rivage/hummingbird.webp",
  "https://frasermiami.s3.amazonaws.com/the-mansions-on-fisher-island/01-Mansions-on-Fisher-Island-Featured.webp",
  "https://frasermiami.s3.amazonaws.com/bentley/hero.webp",
  "https://frasermiami.s3.amazonaws.com/sixfisher/hero.webp",
  "https://frasermiami.s3.amazonaws.com/vita-grove-isle/hero-aerial.webp",
  "https://frasermiami.s3.amazonaws.com/surf-house/surf-house-miami-beach-10.webp",
  "https://frasermiami.s3.amazonaws.com/villamiami/hero-villa.webp",
];

export function getDistinctFallback(seed: string = ""): string {
  if (!seed) return DIVERSE_LUXURY_FALLBACKS[0];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  return DIVERSE_LUXURY_FALLBACKS[Math.abs(hash) % DIVERSE_LUXURY_FALLBACKS.length];
}

/**
 * Validates and normalizes an image URL, returning a fallback if missing or known broken.
 */
export function getSafeImageUrl(
  path: string | null | undefined,
  fallback: string = LUXURY_FALLBACK_IMAGE_URL
): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return fallback;
  }

  if (trimmed.includes("api.cotality.com")) {
    return fallback || getDistinctFallback(trimmed);
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  // Local static assets in /public/images/
  if (trimmed.startsWith("/images/")) {
    return trimmed;
  }

  // Standard S3 asset path (e.g. "/bentley/hero.webp" or "bentley/hero.webp")
  return `https://frasermiami.s3.amazonaws.com/${trimmed.replace(/^\//, "")}`;
}

/**
 * Handles image load errors on <img> or Next.js <Image> elements,
 * swapping the broken src to the designated fallback image gracefully.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback?: string
): void {
  const img = event.currentTarget;
  if (!img) return;

  // Prevent infinite error looping if fallback itself fails
  if (img.dataset.fallbackApplied === "true") {
    return;
  }

  img.dataset.fallbackApplied = "true";

  const targetFallback =
    img.dataset.fallback ||
    fallback ||
    getDistinctFallback(img.alt || img.src);

  img.src = targetFallback;
}
