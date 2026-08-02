"use client";

import dynamic from "next/dynamic";
import { featuredProjects } from "@/src/features/Home/FeaturedProject/data/featured-project.data";
import { projectNames } from "@/src/features/Home/DiscoveryEngine/data/discovery-engine.data";

const MapExplorePage = dynamic(

  () => import("@/src/features/Home/DiscoveryEngine/components/map-explore-page").then((mod) => mod.MapExplorePage),
  { ssr: false }
);

export default function MapPage() {
  return <MapExplorePage projectNames={projectNames} featuredProjects={featuredProjects} />;
}

