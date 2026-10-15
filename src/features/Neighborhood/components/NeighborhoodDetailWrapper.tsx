"use client";

import dynamic from "next/dynamic";

const NeighborhoodDetailPageClient = dynamic(
  () => import("./NeighborhoodDetailPage"),
  { ssr: false }
);

export default function NeighborhoodDetailWrapper({ slug, initialProjects }: { slug: string; initialProjects?: any[] }) {
  return <NeighborhoodDetailPageClient slug={slug} initialProjects={initialProjects} />;
}
