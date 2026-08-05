import { InsightDetailPage } from "@/src/features/Insights/components/insight-detail-page";
import { insightArticles } from "@/src/data/insights";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const article = insightArticles.find((a) => a.slug === slug);
  if (!article) {
    return {
      title: "Article Not Found | Miami New Development",
      description: "Explore Miami's best pre-construction condos and new developments.",
    };
  }
  return {
    title: `${article.title} | newdev.miami`,
    description: article.excerpt,
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  return <InsightDetailPage slug={slug} />;
}
