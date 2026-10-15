import type { MetadataRoute } from "next";
import { getIdxProperties } from "@/src/lib/server/idx-properties";
import { Ht } from "@/src/data/neighborhoods";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://zakers23-website-2t4d.vercel.app";

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
  ];

  // Dynamic Neighborhoods
  const neighborhoodRoutes: MetadataRoute.Sitemap = Object.keys(Ht).map((slug) => ({
    url: `${baseUrl}/neighborhood/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // Dynamic Properties
  let propertyRoutes: MetadataRoute.Sitemap = [];
  try {
    const properties = await getIdxProperties();
    propertyRoutes = properties.map((prop) => ({
      url: `${baseUrl}/property/${prop.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: prop.isFeatured ? 0.9 : 0.7,
    }));
  } catch (err) {
    console.error("Error generating property sitemap entries:", err);
  }

  return [...staticRoutes, ...neighborhoodRoutes, ...propertyRoutes];
}
