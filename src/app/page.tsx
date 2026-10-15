import { HomePage } from "@/src/features/Home/components/home-page";
import { getIdxProperties } from "@/src/lib/server/idx-properties";

export const revalidate = 3600; // Hourly automatic revalidation from BeachesMLS & Miami AOR

export default async function Page() {
  const properties = await getIdxProperties();
  return <HomePage initialProjects={properties} />;
}
