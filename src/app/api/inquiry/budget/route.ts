import { NextRequest, NextResponse } from "next/server";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "@/src/lib/server/inquiry-access";

const FUB_API_URL = "https://api.followupboss.com/v1";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!body || typeof body !== "object" || !("budget" in body) || typeof body.budget !== "string") {
    return NextResponse.json({ error: "Budget value is required." }, { status: 400 });
  }

  const budget = body.budget.trim();
  if (!budget) {
    return NextResponse.json({ error: "Budget value cannot be blank." }, { status: 400 });
  }

  // Identify contact via cryptographically signed inquiry session cookie or explicit contact ID
  const cookieAccess = readInquiryAccess(request.cookies.get(INQUIRY_ACCESS_COOKIE)?.value);
  const explicitPersonId =
    "contactId" in body && typeof body.contactId === "number" && Number.isSafeInteger(body.contactId)
      ? body.contactId
      : "personId" in body && typeof body.personId === "number" && Number.isSafeInteger(body.personId)
      ? body.personId
      : null;

  const targetPersonId = cookieAccess?.personId || explicitPersonId;

  if (!targetPersonId) {
    return NextResponse.json({ error: "No active contact session found to update." }, { status: 401 });
  }

  const apiKey = process.env.FOLLOWUP_BOSS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Follow Up Boss integration unavailable." }, { status: 503 });
  }

  const authHeader = "Basic " + Buffer.from(`${apiKey}:`).toString("base64");

  try {
    // 1. Update existing contact's customFields without creating duplicate
    await fetch(`${FUB_API_URL}/people/${targetPersonId}`, {
      method: "PUT",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        customFields: {
          "Purchase budget": budget,
          Budget: budget,
        },
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }).catch((err) => {
      console.warn("FUB person update warning:", err);
    });

    // 2. Also record an event note on the contact timeline
    await fetch(`${FUB_API_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        source: "Website",
        type: "General Inquiry",
        person: { id: targetPersonId },
        message: `Visitor specified purchase budget: ${budget}`,
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    }).catch((err) => {
      console.warn("FUB budget event log warning:", err);
    });

    return NextResponse.json({ success: true, personId: targetPersonId, budget });
  } catch (err) {
    console.error("Failed to update budget on Follow Up Boss:", err);
    return NextResponse.json({ error: "Could not update budget preference." }, { status: 502 });
  }
}
