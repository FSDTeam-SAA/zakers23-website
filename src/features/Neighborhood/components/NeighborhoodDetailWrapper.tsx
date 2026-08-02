"use client";

import dynamic from "next/dynamic";

const NeighborhoodDetailPageClient = dynamic(
  () => import("./NeighborhoodDetailPage"),
  { ssr: false }
);

export default function NeighborhoodDetailWrapper({ slug }: { slug: string }) {
  return <NeighborhoodDetailPageClient slug={slug} />;
}
