import { InsightDetailPage } from "@/src/features/Insights/components/insight-detail-page";
import { insightArticles } from "@/src/data/insights";
import { SITE_URL } from "@/src/lib/site-url";

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
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/insights/${slug}` },
    openGraph: { url: `/insights/${slug}` },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  const article = insightArticles.find((item) => item.slug === slug);
  return (
    <>
      {article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.excerpt,
              datePublished: new Date(article.date).toISOString(),
              dateModified: new Date(article.date).toISOString(),
              mainEntityOfPage: `${SITE_URL}/insights/${article.slug}`,
              image: article.heroImage,
              author: { "@type": "Person", name: "Zachary Akers" },
              publisher: { "@type": "Organization", name: "The Miami Condo Source" },
            }),
          }}
        />
      )}
      <InsightDetailPage slug={slug} />
    </>
  );
}
