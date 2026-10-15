import { captureUtmParameters } from "./utm";

export interface InquiryPayload {
  name?: string;
  email: string;
  phone?: string;
  message?: string;
  source?: string;
  pageUrl?: string;
  projectName?: string;
  buttonClicked?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  tag?: string;
  tags?: string[] | string;
  smsConsent?: boolean;
  sms_consent?: boolean;
  consentTimestamp?: string;
  details?: Record<string, unknown>;
  website?: string;
  honeypot?: string;
  turnstileToken?: string;
  "cf-turnstile-response"?: string;
}

export async function submitInquiry(payload: InquiryPayload) {
  const utm = captureUtmParameters();
  const res = await fetch("/api/inquiry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...utm,
      ...payload,
      pageUrl: payload.pageUrl || (typeof window !== "undefined" ? window.location.href : undefined),
    }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success !== true) {
    throw new Error(data.error || "Submission failed. Please try again.");
  }

  return data;
}

export async function subscribeNewsletter(
  email: string,
  source = "newsletter_signup",
  options?: { website?: string; honeypot?: string; turnstileToken?: string }
) {
  return submitInquiry({
    email,
    source,
    tag: "newsletter",
    tags: ["newsletter"],
    website: options?.website,
    honeypot: options?.honeypot,
    turnstileToken: options?.turnstileToken,
  });
}