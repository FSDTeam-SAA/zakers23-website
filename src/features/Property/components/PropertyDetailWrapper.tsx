"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import PropertyDetailSkeleton from "./PropertyDetailSkeleton";

const PropertyDetailPageClient = dynamic(
  () => import("./PropertyDetailPage"),
  { 
    ssr: true,
    loading: () => <PropertyDetailSkeleton />
  }
);

const ResalePropertyDetailPageClient = dynamic(
  () => import("./ResalePropertyDetailPage"),
  {
    ssr: true,
    loading: () => <PropertyDetailSkeleton />,
  }
);

export default function PropertyDetailWrapper({
  slug,
  name: _name,
  expiresAt,
  hasAccess = false,
  initialProject,
}: {
  slug: string;
  name: string;
  expiresAt?: number | null;
  hasAccess?: boolean;
  initialProject?: any;
}) {
  const lastTrackedSlug = useRef<string | null>(null);
  const [sessionDeadline, setSessionDeadline] = useState<number | null>(expiresAt ?? null);

  useEffect(() => {
    setSessionDeadline(expiresAt ?? null);
  }, [expiresAt]);

  useEffect(() => {
    // Only track returning visitors who have an active inquiry access session.
    // Anonymous visitors have no contact session; calling property-visit would 401.
    if (!hasAccess || !sessionDeadline || Date.now() >= sessionDeadline) {
      return;
    }

    // Ensure we track at most once per property slug in this session.
    if (lastTrackedSlug.current === slug) {
      return;
    }
    lastTrackedSlug.current = slug;

    // Track returning visitor inquiry
    void fetch("/api/property-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    })
      .then(async (response) => {
        if (response.status === 401) {
          // Contact session is expired or revoked on server; do not retry or refresh.
          setSessionDeadline(null);
        } else if (!response.ok) {
          console.warn("Property visit tracking was not accepted.");
        } else {
          const result = await response.json();
          if (typeof result.expiresAt === "number") {
            setSessionDeadline(result.expiresAt);
          }
        }
      })
      .catch(() => {
        console.warn("Property visit could not be recorded.");
      });
  }, [slug, hasAccess, sessionDeadline]);

  const isResale = Boolean(
    initialProject?.isResale ||
    initialProject?.propertyType === "resale" ||
    (initialProject?.mlsId && !initialProject?.depositStructure && !initialProject?.floorPlans && !initialProject?.developer)
  );

  if (isResale) {
    return <ResalePropertyDetailPageClient slug={slug} initialProject={initialProject} />;
  }

  return <PropertyDetailPageClient slug={slug} initialProject={initialProject} />;
}

