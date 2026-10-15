import { NextRequest, NextResponse } from "next/server";
import { readInquiryAccess, INQUIRY_ACCESS_COOKIE } from "../../../lib/server/inquiry-access";

const FUB_API_URL = "https://api.followupboss.com/v1";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    !body ||
    typeof body !== "object" ||
    !("channel" in body) ||
    typeof body.channel !== "string"
  ) {
    return NextResponse.json({ error: "A valid channel is required." }, { status: 400 });
  }

  const rawChannel = body.channel.toLowerCase().trim();
  if (!["whatsapp", "phone", "email"].includes(rawChannel)) {
    return NextResponse.json({ error: "Invalid contact channel." }, { status: 400 });
  }

  const channel = rawChannel as "whatsapp" | "phone" | "email";
  const type = `${channel}_click`;
  const destination = ("destination" in body && typeof body.destination === "string" ? body.destination : "").trim();
  const pageUrl = ("pageUrl" in body && typeof body.pageUrl === "string" ? body.pageUrl : "").trim() || "Website";

  const apiKey = process.env.FOLLOWUP_BOSS_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Follow Up Boss tracking unavailable." }, { status: 503 });
  }

  // Check if visitor has a signed contact session from a previous inquiry
  const access = readInquiryAccess(request.cookies.get(INQUIRY_ACCESS_COOKIE)?.value);

  const message = [
    `Off-form contact event: Visitor clicked ${channel.toUpperCase()}`,
    "",
    `Channel: ${channel.toUpperCase()}`,
    `Action: ${type}`,
    `Destination: ${destination || "Direct contact"}`,
    `Page: ${pageUrl}`,
    `Timestamp: ${new Date().toISOString()}`,
  ].join("\n");

  const person = access
    ? {
        id: access.personId,
        tags: [type, `off-form:${channel}`],
      }
    : {
        firstName: "Website",
        lastName: "Off-Form Inquiries",
        emails: [{ value: "off-form-tracking@zakers23.com", type: "work" }],
        tags: [type, `off-form:${channel}`, "off-form-contact"],
        customFields: {
          "Last Channel Clicked": channel,
          "Last Destination": destination || "",
          "Last Page": pageUrl,
        },
      };

  try {
    const response = await fetch(`${FUB_API_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        source: `Website (${channel.toUpperCase()})`,
        type: "General Inquiry",
        person,
        message,
        pageUrl,
      }),
      signal: AbortSignal.timeout(10000),
      cache: "no-store",
    });

    if (response.status !== 200 && response.status !== 201) {
      console.warn("Follow Up Boss off-form contact event was not accepted:", response.status);
      return NextResponse.json({ error: "Event could not be recorded." }, { status: 502 });
    }

    return NextResponse.json({ success: true, channel, type });
  } catch (err) {
    console.error("Failed to post off-form contact event to Follow Up Boss:", err);
    return NextResponse.json({ error: "Tracking request failed." }, { status: 502 });
  }
}
