import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "@/src/lib/server/inquiry-access";
import { getIdxPropertyBySlug } from "@/src/lib/server/idx-properties";
import PropertyDetailWrapper from "@/src/features/Property/components/PropertyDetailWrapper";

const slug = "619-brickell-nobu-residences";

export const revalidate = 3600;

export async function generateMetadata() {
  const project = await getIdxPropertyBySlug(slug);
  if (!project) return { title: "619 Brickell (Nobu Residences)" };

  const title = "619 Brickell by Nobu | Pricing & Floor Plans";
  const description = "Explore 619 Brickell by Nobu pricing, floor plans, availability and private presentation options in Brickell. Request current developer information from Zachary Akers.";
  return {
    title,
    description,
    alternates: { canonical: "/619-brickell" },
    openGraph: { title, description, url: "/619-brickell", images: [{ url: project.img, alt: project.name }] },
  };
}

export default async function Brickell619Page() {
  const project = await getIdxPropertyBySlug(slug);
  if (!project) notFound();
  const access = readInquiryAccess((await cookies()).get(INQUIRY_ACCESS_COOKIE)?.value);

  return <PropertyDetailWrapper slug={slug} name={project.name} hasAccess={Boolean(access)} expiresAt={access?.expiresAt} initialProject={project} />;
}
