import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "@/src/lib/server/inquiry-access";
import PropertyDetailWrapper from "@/src/features/Property/components/PropertyDetailWrapper";
import { getIdxPropertyBySlug, getIdxProperties } from "@/src/lib/server/idx-properties";

interface PageProps {
  params: Promise<{
    slug: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const project = await getIdxPropertyBySlug(slug);
  if (!project) {
    return {
      title: "Property Not Found | Zachary Akers Luxury Real Estate",
      description: "Explore Miami's finest luxury waterfront estates and pre-construction developments.",
    };
  }
  const isResale = Boolean(project.isResale || project.propertyType === "resale");
  const title = isResale
    ? `${project.name} | Pricing, Photos & Waterfront Details | Zachary Akers`
    : `${project.name} | Pricing, Floor Plans & Availability`;
  const description = isResale
    ? `Explore pricing, photos, waterfront specifications, and details for ${project.name} in ${project.neighborhood}.`
    : (project.statusRemark || `Explore pricing, floor plans, and availability for ${project.name} in ${project.neighborhood}.`);
  const shareImage = project.img || project.imgs?.[0] || "/images/anantara/aerial-helipad-day.webp";

  return {
    title,
    description,
    alternates: {
      canonical: `/property/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/property/${slug}`,
      siteName: "Miami New Development | Zachary Akers",
      images: [
        {
          url: shareImage,
          alt: project.name,
        },
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
    },
  };
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params;
  let project = await getIdxPropertyBySlug(slug);
  if (!project) {
    const all = await getIdxProperties();
    project = all[0] || null;
  }
  if (!project) notFound();

  const cookieStore = await cookies();
  const access = readInquiryAccess(cookieStore.get(INQUIRY_ACCESS_COOKIE)?.value);

  return (
    <PropertyDetailWrapper
      slug={slug}
      name={project.name}
      hasAccess={Boolean(access)}
      expiresAt={access?.expiresAt}
      initialProject={project}
    />
  );
}
