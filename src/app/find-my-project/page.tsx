import type { Metadata } from "next";
import FindMyProjectMap, { PreconProject } from "@/src/features/FindMyProject/components/FindMyProjectMap";
import { getPreconstructionProjects } from "@/src/lib/server/idx-properties";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find My Project | Miami Pre-Construction Developments Directory",
  description:
    "Explore Miami's premier pre-construction condominium developments, branded residences, and luxury waterfront towers across South Florida with Zachary Akers.",
};

export default function FindMyProjectPage() {
  const projects = getPreconstructionProjects();
  return <FindMyProjectMap projects={projects as unknown as PreconProject[]} />;
}
