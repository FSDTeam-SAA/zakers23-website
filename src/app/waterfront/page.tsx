import WaterfrontPageWrapper from "@/src/features/Waterfront/components/WaterfrontPageWrapper";
import { getIdxWaterfrontProperties } from "@/src/lib/server/idx-properties";

export const revalidate = 3600; // Hourly automatic refresh from BeachesMLS & Miami AOR

export const metadata = {
  title: "Waterfront Homes & Estates | Miami-Dade Luxury Homes",
  description:
    "Explore Miami-Dade's active MLS waterfront listings, ultra-prime waterfront enclaves, vessel access, and private estate opportunities.",
};

export default async function WaterfrontPage() {
  const listings = await getIdxWaterfrontProperties();
  return <WaterfrontPageWrapper initialListings={listings} />;
}
