import { featuredProjects } from "@/src/features/Home/FeaturedProject/data/featured-project.data";
import { projectNames } from "@/src/features/Home/DiscoveryEngine/data/discovery-engine.data";
import { MapExplorePage } from "@/src/features/Home/DiscoveryEngine/components/map-explore-page";

export default function MapPage() {
  return <MapExplorePage projectNames={projectNames} featuredProjects={featuredProjects} />;
}
