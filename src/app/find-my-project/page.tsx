import type { Metadata } from "next";
import FindMyProjectMap, { PreconProject } from "@/src/features/FindMyProject/components/FindMyProjectMap";
import { getPreconstructionProjects } from "@/src/lib/server/idx-properties";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Find My Project | Interactive Pre-Construction Discovery Map",
  description:
    "Interactive Miami pre-construction condo map. Zoom and explore active luxury development towers across South Florida with Zachary Akers.",
};

export default function FindMyProjectPage() {
  const projects = getPreconstructionProjects();
  return <FindMyProjectMap projects={projects as unknown as PreconProject[]} />;
}
