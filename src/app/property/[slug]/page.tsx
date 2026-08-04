import PropertyDetailWrapper from "@/src/features/Property/components/PropertyDetailWrapper";
import projectsRaw from "@/src/data/miami-projects.json";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = (projectsRaw as any[]).find((p) => p.slug === slug);
  if (!project) {
    return {
      title: "Project Not Found | Miami New Development",
      description: "Explore Miami's best pre-construction condos and new developments.",
    };
  }
  return {
    title: `${project.name} | Miami New Development`,
    description: project.statusRemark || `Explore pricing, floor plans, and availability for ${project.name} in ${project.neighborhood}.`,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <PropertyDetailWrapper slug={slug} />;
}
