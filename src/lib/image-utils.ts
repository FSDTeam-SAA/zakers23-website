/**
 * Image Utilities and Fallback Handlers
 */

export const FALLBACK_IMAGE_URL = "/images/no-image.svg";
export const LUXURY_FALLBACK_IMAGE_URL = "/images/luxury-placeholder.jpg";

/**
 * Validates and normalizes an image URL, returning a fallback if missing or known broken.
 */
export function getSafeImageUrl(
  path: string | null | undefined,
  fallback: string = FALLBACK_IMAGE_URL
): string {
  if (!path || typeof path !== "string") {
    return fallback;
  }

  const trimmed = path.trim();
  if (!trimmed) {
    return fallback;
  }

  // Block known problematic/broken endpoints (e.g. CoreLogic WAF blocked domains)
  if (trimmed.includes("api.cotality.com")) {
    return fallback;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }

  // Standard S3 asset path
  return `https://frasermiami.s3.amazonaws.com/${trimmed.replace(/^\//, "")}`;
}

/**
 * Handles image load errors on <img> or Next.js <Image> elements,
 * swapping the broken src to the designated fallback image gracefully.
 */
export function handleImageError(
  event: React.SyntheticEvent<HTMLImageElement, Event>,
  fallback: string = FALLBACK_IMAGE_URL
): void {
  const img = event.currentTarget;
  if (!img) return;

  // Prevent infinite error looping if fallback itself fails
  if (img.dataset.fallbackApplied === "true") {
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = fallback;
}
