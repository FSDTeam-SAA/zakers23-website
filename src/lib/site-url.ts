/** The single public production origin used in all SEO metadata and feeds. */
export const SITE_URL = "https://themiamicondosource.com";

/** Preview deployments must never be eligible for search indexing. */
export const isPreviewDeployment = process.env.VERCEL_ENV === "preview";
