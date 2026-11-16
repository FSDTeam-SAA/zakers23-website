import type { MetadataRoute } from "next";
import { getIdxProperties } from "@/src/lib/server/idx-properties";
import { getPreconstructionProjects } from "@/src/lib/server/idx-properties";
import { Ht } from "@/src/data/neighborhoods";
import { insightArticles } from "@/src/data/insights";
import { SITE_URL } from "@/src/lib/site-url";

const canonicalPropertyPath = (slug: string) => {
  if (slug === "faena-residences-miami") return "/faena";
  if (slug === "619-brickell-nobu-residences") return "/619-brickell";
  return `/property/${slug}`;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/waterfront`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/map`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/neighborhood`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/insights`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/find-my-project`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...["atma", "branded-residences", "penthouses", "about", "deposits"].map((path) => ({
      url: `${baseUrl}/${path}`,
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  // Dynamic Neighborhoods
  const neighborhoodRoutes: MetadataRoute.Sitemap = Object.keys(Ht).map((slug) => ({
    url: `${baseUrl}/neighborhood/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const insightRoutes: MetadataRoute.Sitemap = insightArticles.map((article) => ({
    url: `${baseUrl}/insights/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // Dynamic Properties
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const liveProperties = await getIdxProperties();
    // The live IDX feed changes independently of the editorial pre-construction catalog.
    // Include the union so neither set of indexable property pages disappears from the feed.
    const bySlug = new Map(
      [...getPreconstructionProjects(), ...liveProperties].map((property) => [property.slug, property])
    );
    propertyRoutes = [...bySlug.values()].map((prop) => ({
      url: `${baseUrl}${canonicalPropertyPath(prop.slug)}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: prop.isFeatured ? 0.9 : 0.7,
    }));
  } catch (err) {
    console.error("Error generating property sitemap entries:", err);
  }

  return [...staticRoutes, ...neighborhoodRoutes, ...insightRoutes, ...propertyRoutes];
}
