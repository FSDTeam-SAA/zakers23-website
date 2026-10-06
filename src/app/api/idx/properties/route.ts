import { NextResponse, type NextRequest } from "next/server";
import { getIdxPropertiesWithMeta } from "@/src/lib/server/idx-properties";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("fresh") === "true" || searchParams.get("refresh") === "1";
    const { projects, source, timestamp } = await getIdxPropertiesWithMeta(forceRefresh);
    return NextResponse.json(
      {
        source,
        totalCount: projects.length,
        refreshedAt: timestamp,
        projects,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          "X-Data-Source": source,
        },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "IDX Broker request failed.";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
