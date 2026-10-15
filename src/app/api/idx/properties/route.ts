import { NextResponse, type NextRequest } from "next/server";
import { getIdxPropertiesWithMeta } from "@/src/lib/server/idx-properties";

export const revalidate = 3600; // Hourly automatic revalidation

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("fresh") === "true" || searchParams.get("refresh") === "1";
    const { projects, source, timestamp } = await getIdxPropertiesWithMeta(forceRefresh);
    return NextResponse.json(
      {
        source,
        feedProvider: "BeachesMLS & Miami Association of Realtors (via IDX Broker)",
        revalidationInterval: "3600s (hourly)",
        totalCount: projects.length,
        refreshedAt: timestamp,
        projects,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
          "X-Data-Source": source,
          "X-MLS-Provider": "BeachesMLS / Miami AOR",
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "IDX Broker request failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
