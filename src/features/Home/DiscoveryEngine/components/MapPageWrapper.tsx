"use client";

import dynamic from "next/dynamic";
import type { MapProject } from "./map-explore-page";

const MapExplorePage = dynamic(
  () => import("./map-explore-page").then((mod) => mod.MapExplorePage),
  { ssr: false }
);

interface MapPageWrapperProps {
  projectNames: string[];
  featuredProjects: any[];
  initialProjects?: MapProject[];
}

export default function MapPageWrapper({
  projectNames,
  featuredProjects,
  initialProjects,
}: MapPageWrapperProps) {
  return (
    <MapExplorePage
      projectNames={projectNames}
      featuredProjects={featuredProjects}
      initialProjects={initialProjects}
    />
  );
}
