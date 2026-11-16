import { cookies } from "next/headers";
import PropertyDetailWrapper from "@/src/features/Property/components/PropertyDetailWrapper";
import { getIdxPropertyBySlug } from "@/src/lib/server/idx-properties";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "@/src/lib/server/inquiry-access";

export default async function AtmaPage() {
  const project = await getIdxPropertyBySlug("atma-miami-by-aman");
  if (!project) return null;
  const cookieStore = await cookies();
  const access = readInquiryAccess(cookieStore.get(INQUIRY_ACCESS_COOKIE)?.value);
  return <PropertyDetailWrapper slug="atma-miami-by-aman" name={project.name} hasAccess={Boolean(access)} expiresAt={access?.expiresAt} initialProject={project} />;
}
