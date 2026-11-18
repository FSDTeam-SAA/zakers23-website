import { cleanDigits, isObviousFakeNumber } from "../phone-validation";

export type PhoneLineType = "mobile" | "voip" | "landline" | "unknown";

export interface PhoneValidationResult {
  valid: boolean;
  lineType: PhoneLineType;
  tag: "Phone Verified" | "Phone VoIP" | "Phone Unverified" | null;
  carrierName?: string;
  nationalFormat?: string;
  error?: string;
}

/**
 * Server-side telephone validation and Twilio Lookup v2 Line Type Intelligence.
 *
 * Rules:
 * 1. Checks structural length and obvious fake patterns (555, repeating digits, sequential).
 * 2. If Twilio credentials are configured, calls Twilio Lookup v2 with line_type_intelligence.
 * 3. Enforces a strict 3-second timeout.
 * 4. If Twilio is down, unconfigured, or times out, gracefully passes the lead through without blocking.
 */
export async function verifyPhoneNumberServer(e164Phone: string): Promise<PhoneValidationResult> {
  const cleaned = (e164Phone || "").trim();
  const digits = cleanDigits(cleaned);

  if (!digits || digits.length < 7 || digits.length > 15) {
    return {
      valid: false,
      lineType: "unknown",
      tag: "Phone Unverified",
      error: "Phone number does not match international E.164 length.",
    };
  }

  let nationalDigits = digits;
  const isNanp = digits.startsWith("1") && digits.length === 11;
  if (isNanp) {
    nationalDigits = digits.slice(1);
  }

  // Check repeating or obvious fake sequence
  const fakeCheck = isObviousFakeNumber(nationalDigits, isNanp ? "US" : "INTL");
  if (fakeCheck.isFake) {
    return {
      valid: false,
      lineType: "unknown",
      tag: "Phone Unverified",
      error: fakeCheck.reason || "Suspicious or test phone number.",
    };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  // If Twilio credentials are not set yet, gracefully approve without Twilio tag
  if (!accountSid || !authToken) {
    return {
      valid: true,
      lineType: "unknown",
      tag: null,
    };
  }

  try {
    const formattedTarget = cleaned.startsWith("+") ? cleaned : `+${cleaned}`;
    const url = `https://lookups.twilio.com/v2/PhoneNumbers/${encodeURIComponent(formattedTarget)}?Fields=line_type_intelligence`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64"),
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(3000), // Strict 3 second timeout
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn(`Twilio Lookup v2 responded with status ${res.status}`);
      return {
        valid: false,
        lineType: "unknown",
        tag: "Phone Unverified",
      };
    }

    const data = await res.json();
    const rawType = data?.line_type_intelligence?.type?.toLowerCase();
    const carrierName = data?.line_type_intelligence?.carrier_name || undefined;
    const nationalFormat = data?.national_format || undefined;
    const isValid = data?.valid !== false;

    if (!isValid) {
      return {
        valid: false,
        lineType: "unknown",
        tag: "Phone Unverified",
        carrierName,
        nationalFormat,
      };
    }

    if (rawType === "mobile") {
      return {
        valid: true,
        lineType: "mobile",
        tag: "Phone Verified",
        carrierName,
        nationalFormat,
      };
    }

    if (rawType === "voip" || rawType === "nonfixedvoip" || rawType === "fixedvoip") {
      return {
        valid: true,
        lineType: "voip",
        tag: "Phone VoIP",
        carrierName,
        nationalFormat,
      };
    }

    // Landline or other line type
    return {
      valid: true,
      lineType: rawType === "landline" ? "landline" : "unknown",
      tag: "Phone Unverified",
      carrierName,
      nationalFormat,
    };
  } catch (err) {
    // If Twilio is down or times out (>3 sec), send the lead through untagged. Never lose a lead.
    console.warn("Twilio Lookup v2 check timed out or failed (fail-safe active):", err instanceof Error ? err.message : err);
    return {
      valid: true,
      lineType: "unknown",
      tag: null,
    };
  }
}
