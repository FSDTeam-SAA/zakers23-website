import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "@/src/lib/server/inquiry-access";
import { getIdxPropertyBySlug } from "@/src/lib/server/idx-properties";
import PropertyDetailWrapper from "@/src/features/Property/components/PropertyDetailWrapper";

const slug = "faena-residences-miami";

export const revalidate = 3600;

export async function generateMetadata() {
  const project = await getIdxPropertyBySlug(slug);
  if (!project) return { title: "Faena Residences Miami" };

  const title = "Faena Residences Miami | Pricing & Floor Plans";
  const description = "Explore Faena Residences Miami pricing, floor plans, availability and private presentation options in Brickell. Request current developer information from Zachary Akers.";
  return {
    title,
    description,
    alternates: { canonical: "/faena" },
    openGraph: { title, description, url: "/faena", images: [{ url: project.img, alt: project.name }] },
  };
}

export default async function FaenaPage() {
  const project = await getIdxPropertyBySlug(slug);
  if (!project) notFound();
  const access = readInquiryAccess((await cookies()).get(INQUIRY_ACCESS_COOKIE)?.value);

  return <PropertyDetailWrapper slug={slug} name={project.name} hasAccess={Boolean(access)} expiresAt={access?.expiresAt} initialProject={project} />;
}
