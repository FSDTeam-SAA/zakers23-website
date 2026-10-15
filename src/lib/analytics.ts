export type ContactChannel = "whatsapp" | "phone" | "email";

export interface ContactClickEvent {
  type: "whatsapp_click" | "phone_click" | "email_click";
  channel: ContactChannel;
  destination?: string;
  pageUrl: string;
  metadata?: Record<string, unknown>;
}

/**
 * Tracks off-form contact clicks (WhatsApp, Phone, Email)
 * Sends events to Google Analytics (GA4 / dataLayer) and Follow Up Boss.
 */
export function trackContactClick(
  channel: ContactChannel,
  destination?: string,
  metadata?: Record<string, unknown>
) {
  if (typeof window === "undefined") return;

  const eventName = `${channel}_click` as const;
  const pageUrl = window.location.href;

  // 1. Google Analytics (GA4) / dataLayer tracking
  try {
    const windowObj = window as unknown as {
      gtag?: (command: string, action: string, params: Record<string, unknown>) => void;
      dataLayer?: unknown[];
    };

    if (typeof windowObj.gtag === "function") {
      windowObj.gtag("event", eventName, {
        event_category: "Off-Form Contact",
        event_label: destination || channel,
        page_url: pageUrl,
        channel,
        ...metadata,
      });
    }

    if (Array.isArray(windowObj.dataLayer)) {
      windowObj.dataLayer.push({
        event: eventName,
        event_category: "Off-Form Contact",
        event_label: destination || channel,
        page_url: pageUrl,
        channel,
        ...metadata,
      });
    }
  } catch {
    // Ignore browser analytics failures
  }

  // 2. Persist off-form action in session for subsequent form lead attribution
  try {
    const existing = window.sessionStorage.getItem("zakers_off_form_clicks");
    const list: string[] = existing ? JSON.parse(existing) : [];
    if (!list.includes(eventName)) {
      list.push(eventName);
      window.sessionStorage.setItem("zakers_off_form_clicks", JSON.stringify(list));
    }
  } catch {
    // Ignore storage failures
  }

  // 3. Post event to server to record in Follow Up Boss
  try {
    const payload: ContactClickEvent = {
      type: eventName,
      channel,
      destination,
      pageUrl,
      metadata,
    };

    fetch("/api/track-contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Non-blocking background call
    });
  } catch {
    // Ignore fetch failures
  }
}

/**
 * Returns any off-form contact events the visitor triggered during this session.
 */
export function getSessionOffFormClicks(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = window.sessionStorage.getItem("zakers_off_form_clicks");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore storage failures
  }
  return [];
}
