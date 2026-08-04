"use client";

import dynamic from "next/dynamic";

const PropertyDetailPageClient = dynamic(
  () => import("./PropertyDetailPage"),
  { ssr: false }
);

export default function PropertyDetailWrapper({ slug }: { slug: string }) {
  return <PropertyDetailPageClient slug={slug} />;
}
