import MapPageWrapper from "@/src/features/Home/DiscoveryEngine/components/MapPageWrapper";
import { featuredProjects } from "@/src/features/Home/FeaturedProject/data/featured-project.data";
import { projectNames } from "@/src/features/Home/DiscoveryEngine/data/discovery-engine.data";
import { getIdxProperties } from "@/src/lib/server/idx-properties";

export const revalidate = 3600; // Hourly automatic refresh from BeachesMLS & Miami AOR

export const metadata = {
  title: "Interactive Miami Real Estate Discovery Map",
  description: "Live BeachesMLS and Miami Association of Realtors luxury developments map feed.",
};

export default async function MapPage() {
  const properties = await getIdxProperties();
  return (
    <MapPageWrapper
      projectNames={projectNames}
      featuredProjects={featuredProjects}
      initialProjects={properties}
    />
  );
}
