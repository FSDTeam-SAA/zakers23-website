export type InsightCategory =
  | "All"
  | "Market Intelligence"
  | "Market Update"
  | "Neighborhood Intelligence"
  | "Buyer's Guide"
  | "Lifestyle Editorial";

export type InsightArticle = {
  slug: string;
  category: Exclude<InsightCategory, "All">;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  heroImage: string;
};

export const insightCategories: InsightCategory[] = [
  "All",
  "Market Intelligence",
  "Market Update",
  "Neighborhood Intelligence",
  "Buyer's Guide",
  "Lifestyle Editorial",
];

export const insightArticles: InsightArticle[] = [
  {
    slug: "miami-preconstruction-pricing-reset",
    category: "Market Intelligence",
    title: "Where Miami Pre-Construction Pricing Is Resetting in 2026",
    excerpt:
      "A look at which submarkets are holding firm, where incentives are quietly returning, and how branded pricing is separating from the broader field.",
    date: "Aug 1, 2026",
    readTime: "6 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/baccarat/exterior-hummingbird-sunrise.webp",
  },
  {
    slug: "brickell-brand-premium",
    category: "Neighborhood Intelligence",
    title: "Why Brickell Keeps Commanding a Brand Premium",
    excerpt:
      "From Cipriani to St. Regis and Baccarat, Brickell's hospitality-led towers continue to price above comparable unbranded inventory.",
    date: "Jul 28, 2026",
    readTime: "5 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/waldorf/waldorf-astoria-hero-twilight.webp",
  },
  {
    slug: "buyer-guide-offmarket-waterfront",
    category: "Buyer's Guide",
    title: "How to Approach an Off-Market Waterfront Search in Miami",
    excerpt:
      "The buyers who access the best bayfront inventory usually start earlier, narrow faster, and understand how private deal flow actually moves.",
    date: "Jul 22, 2026",
    readTime: "7 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/ariareserve/aria-reserve-exterior-day.webp",
  },
  {
    slug: "midyear-market-update",
    category: "Market Update",
    title: "Mid-Year Update: Deliveries, Launches, and Pricing Pressure",
    excerpt:
      "What changed across Miami's luxury new development pipeline in the first half of 2026, and which launches are driving the conversation now.",
    date: "Jul 15, 2026",
    readTime: "4 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/bentley/bentley-residences-hero.jpg",
  },
  {
    slug: "coconut-grove-boutique-supply",
    category: "Neighborhood Intelligence",
    title: "Coconut Grove's Boutique Supply Problem Is Exactly the Appeal",
    excerpt:
      "Zoning constraints, canopy protections, and true scarcity are why Grove projects keep attracting long-term primary-home buyers.",
    date: "Jul 9, 2026",
    readTime: "5 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/casabella/Casa-Bella-Living-Room.webp",
  },
  {
    slug: "lifestyle-editorial-skyline-living",
    category: "Lifestyle Editorial",
    title: "What Buyers Are Really Paying For in Skyline Residences",
    excerpt:
      "It's not just the view. Privacy, services, elevator ratios, and how the building lands you in the city all matter more than brochures suggest.",
    date: "Jun 30, 2026",
    readTime: "4 min read",
    heroImage: "https://frasermiami.s3.amazonaws.com/bentley/bentley-residences-lobby-interior.jpg",
  },
];
