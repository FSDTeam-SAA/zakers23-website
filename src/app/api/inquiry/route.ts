import { NextRequest, NextResponse } from "next/server";

import { createInquiryAccess, INQUIRY_ACCESS_COOKIE, INQUIRY_ACCESS_MAX_AGE } from "../../../lib/server/inquiry-access";

const FUB_API_URL = "https://api.followupboss.com/v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !isRecord(body) ||
    ["name", "email", "phone", "message", "source", "pageUrl", "tag", "consentTimestamp", "website", "honeypot", "turnstileToken", "cf-turnstile-response", "projectName", "buttonClicked", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].some(
      (key) => body[key] !== undefined && typeof body[key] !== "string"
    ) ||
    (body.tags !== undefined &&
      typeof body.tags !== "string" &&
      !(Array.isArray(body.tags) && body.tags.every((item) => typeof item === "string"))) ||
    (body.smsConsent !== undefined && typeof body.smsConsent !== "boolean") ||
    (body.sms_consent !== undefined && typeof body.sms_consent !== "boolean") ||
    (body.details !== undefined && !isRecord(body.details))
  ) {
    return NextResponse.json({ error: "Invalid inquiry fields." }, { status: 400 });
  }

  // 1. Honeypot check (hidden field to trap automated spam bots)
  const honeypot =
    (typeof body.website === "string" ? body.website : "") ||
    (typeof body.honeypot === "string" ? body.honeypot : "");
  if (honeypot.trim().length > 0) {
    return NextResponse.json({ error: "Spam detected." }, { status: 400 });
  }

  // 2. Cloudflare Turnstile CAPTCHA verification (when secret key is configured)
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY || process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  if (turnstileSecret) {
    const turnstileToken =
      (typeof body.turnstileToken === "string" ? body.turnstileToken : "") ||
      (typeof body["cf-turnstile-response"] === "string" ? body["cf-turnstile-response"] : "");

    if (!turnstileToken.trim()) {
      return NextResponse.json(
        { error: "Security check failed. Please complete the verification challenge." },
        { status: 400 }
      );
    }

    const clientIp =
      (request.headers?.get &&
        (request.headers.get("cf-connecting-ip") ||
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim())) ||
      undefined;

    try {
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          secret: turnstileSecret,
          response: turnstileToken.trim(),
          ...(clientIp ? { remoteip: clientIp } : {}),
        }),
        signal: AbortSignal.timeout(10000),
      });

      const verifyData = (await verifyRes.json().catch(() => ({}))) as {
        success?: boolean;
        "error-codes"?: string[];
      };

      if (!verifyData || verifyData.success !== true) {
        return NextResponse.json(
          { error: "Security check failed. Please verify you are human and try again." },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Security verification could not be completed. Please try again." },
        { status: 502 }
      );
    }
  }

  const email = ((body.email as string) || "").trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
  }

  const apiKey = process.env.FOLLOWUP_BOSS_API_KEY;
  if (!apiKey) {
    console.error("Inquiry integration is missing FOLLOWUP_BOSS_API_KEY.");
    return NextResponse.json({ error: "Inquiry service is unavailable. Please try again later." }, { status: 503 });
  }

  const name = ((body.name as string) || "").trim();
  const phone = ((body.phone as string) || "").trim();
  const message = ((body.message as string) || "").trim();
  const source = ((body.source as string) || "").trim() || "Website";
  const pageUrl = ((body.pageUrl as string) || "").trim();
  const projectName = ((body.projectName as string) || "").trim();
  const buttonClicked = ((body.buttonClicked as string) || "").trim();
  const utmSource = ((body.utm_source as string) || "").trim();
  const utmMedium = ((body.utm_medium as string) || "").trim();
  const utmCampaign = ((body.utm_campaign as string) || "").trim();
  const utmTerm = ((body.utm_term as string) || "").trim();
  const utmContent = ((body.utm_content as string) || "").trim();
  const details = (body.details || {}) as Record<string, unknown>;

  const rawConsent = body.smsConsent ?? body.sms_consent;
  const hasConsent = rawConsent === true;

  const rawTags = body.tags ?? body.tag;
  const tags: string[] = Array.isArray(rawTags)
    ? rawTags.map((t) => String(t).trim()).filter(Boolean)
    : typeof rawTags === "string" && rawTags.trim()
    ? rawTags.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  // Tag every lead with its source, project name, button and marketing campaign
  if (source && source !== "Website" && source !== "newsletter_signup" && !tags.includes(source)) {
    tags.push(source);
  }
  if (projectName && !tags.includes(projectName)) {
    tags.push(projectName);
  }
  if (buttonClicked && !tags.includes(buttonClicked)) {
    tags.push(buttonClicked);
  }
  if (utmSource && !tags.includes(utmSource)) {
    tags.push(utmSource);
  }
  if (utmCampaign && !tags.includes(utmCampaign)) {
    tags.push(utmCampaign);
  }

  if (hasConsent && !tags.includes("sms-consent")) {
    tags.push("sms-consent");
  }

  const nameParts = name.split(/\s+/);
  const person: Record<string, unknown> = {
    firstName: nameParts[0] || "",
    lastName: nameParts.slice(1).join(" "),
    emails: [{ value: email, type: "home" }],
    ...(phone ? { phones: [{ value: phone, type: "mobile" }] } : {}),
    ...(tags.length > 0 ? { tags } : {}),
    sms_consent: hasConsent,
    smsConsent: hasConsent,
    customFields: {
      "SMS Consent": hasConsent ? "Yes" : "No",
      "Call & Text Consent": hasConsent ? "Yes" : "No",
      ...(projectName ? { "Project Name": projectName } : {}),
      ...(buttonClicked ? { "Button Clicked": buttonClicked } : {}),
      ...(pageUrl ? { "Page URL": pageUrl } : {}),
      ...(utmSource ? { "UTM Source": utmSource } : {}),
      ...(utmMedium ? { "UTM Medium": utmMedium } : {}),
      ...(utmCampaign ? { "UTM Campaign": utmCampaign } : {}),
      ...(utmTerm ? { "UTM Term": utmTerm } : {}),
      ...(utmContent ? { "UTM Content": utmContent } : {}),
    },
  };

  // Keep every submitted field in the event itself. A second note request could
  // fail after the contact is created and silently lose the consultation details.
  const isNewsletter = source === "newsletter_signup" || tags.includes("newsletter");
  const lines = [
    isNewsletter ? "Website newsletter subscription request" : "Website consultation request",
    "",
    `Name: ${name || "Not provided"}`,
    `Email: ${email}`,
    `Phone: ${phone || "Not provided"}`,
  ];
  if (projectName) {
    lines.push(`Project Name: ${projectName}`);
  }
  if (buttonClicked) {
    lines.push(`Button Clicked: ${buttonClicked}`);
  }
  if (phone || rawConsent !== undefined) {
    lines.push(`Call & Text Consent (TCPA): ${hasConsent ? "Granted (Yes)" : "Not provided (No)"}`);
    if (hasConsent) {
      const timestamp = (typeof body.consentTimestamp === "string" && body.consentTimestamp.trim()) || new Date().toISOString();
      lines.push(`Consent Timestamp: ${timestamp}`);
      lines.push(`Consent Notice: "I consent to calls and SMS from Zachary Akers & ONE Sotheby's regarding real estate updates, including automated messages. Not a condition of purchase. Msg & data rates may apply. Reply STOP to opt out."`);
    }
  }
  if (tags.length > 0) {
    lines.push(`Tags: ${tags.join(", ")}`);
  }
  for (const [key, value] of Object.entries(details)) {
    if (value === null || value === undefined || value === "") continue;
    lines.push(`${key}: ${typeof value === "object" ? JSON.stringify(value) : String(value)}`);
  }
  lines.push("", `Message: ${message || "Not provided"}`, "", `Source: ${source}`);
  if (pageUrl) lines.push(`Page: ${pageUrl}`);
  if (utmSource || utmMedium || utmCampaign || utmTerm || utmContent) {
    lines.push("", "Marketing Attribution (UTM):");
    if (utmSource) lines.push(`  utm_source: ${utmSource}`);
    if (utmMedium) lines.push(`  utm_medium: ${utmMedium}`);
    if (utmCampaign) lines.push(`  utm_campaign: ${utmCampaign}`);
    if (utmTerm) lines.push(`  utm_term: ${utmTerm}`);
    if (utmContent) lines.push(`  utm_content: ${utmContent}`);
  }

  try {
    // FUB's website-lead endpoint records the inquiry and deduplicates contacts.
    // https://docs.followupboss.com/reference/events-post
    const response = await fetch(`${FUB_API_URL}/events`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(`${apiKey}:`).toString("base64"),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        source,
        type: "General Inquiry",
        person,
        message: lines.join("\n"),
        sms_consent: hasConsent,
        smsConsent: hasConsent,
        ...(pageUrl ? { pageUrl } : {}),
        ...(projectName ? { projectName } : {}),
        ...(buttonClicked ? { buttonClicked } : {}),
        ...(utmSource ? { utm_source: utmSource } : {}),
        ...(utmMedium ? { utm_medium: utmMedium } : {}),
        ...(utmCampaign ? { utm_campaign: utmCampaign } : {}),
      }),
      signal: AbortSignal.timeout(15000),
      cache: "no-store",
    });

    // 204 means this source's lead flow is archived/ignored, not saved.
    if (response.status !== 200 && response.status !== 201) {
      console.error("Follow Up Boss inquiry was not accepted. Status:", response.status);
      return NextResponse.json({ error: "Your inquiry could not be saved. Please try again or contact us directly." }, { status: 502 });
    }

    const result: unknown = await response.json();
    if (!isRecord(result) || typeof result.id !== "number" || result.id <= 0) {
      console.error("Follow Up Boss returned an invalid contact response.");
      return NextResponse.json({ error: "We could not confirm your inquiry. Please contact us directly." }, { status: 502 });
    }
    const success = NextResponse.json({ success: true, id: result.id, sms_consent: hasConsent });
    success.cookies.set(INQUIRY_ACCESS_COOKIE, createInquiryAccess(result.id), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: INQUIRY_ACCESS_MAX_AGE,
    });
    return success;
  } catch {
    console.error("Follow Up Boss inquiry request failed or timed out.");
    return NextResponse.json({ error: "We could not confirm your inquiry. Please try again or contact us directly." }, { status: 502 });
  }
}
