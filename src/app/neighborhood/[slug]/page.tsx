import NeighborhoodDetailWrapper from "@/src/features/Neighborhood/components/NeighborhoodDetailWrapper";
import { Ht } from "@/src/data/neighborhoods";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const data = Ht[slug];
  if (!data) {
    return {
      title: "Neighborhood Not Found | Miami New Development",
      description: "Explore Miami's best pre-construction condos and new developments.",
    };
  }
  return {
    title: data.seo.title,
    description: data.seo.description,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <NeighborhoodDetailWrapper slug={slug} />;
}
