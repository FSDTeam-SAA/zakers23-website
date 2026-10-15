export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

const UTM_STORAGE_KEY = "zakers_utm_attribution";

/**
 * Captures UTM parameters from current URL or returns saved UTMs from the session.
 * Preserves initial marketing campaign attribution across internal site navigation.
 */
export function captureUtmParameters(): UtmParams {
  if (typeof window === "undefined") return {};

  try {
    const params = new URLSearchParams(window.location.search);
    const keys: (keyof UtmParams)[] = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
    ];

    const currentUtm: UtmParams = {};
    let foundInUrl = false;

    for (const key of keys) {
      const val = params.get(key);
      if (val) {
        currentUtm[key] = val.trim();
        foundInUrl = true;
      }
    }

    if (foundInUrl) {
      try {
        window.sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(currentUtm));
      } catch {
        // storage disabled or quota exceeded
      }
      return currentUtm;
    }

    try {
      const saved = window.sessionStorage.getItem(UTM_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === "object" && parsed !== null) {
          return parsed as UtmParams;
        }
      }
    } catch {
      // storage disabled
    }
  } catch {
    // URL parsing fallback
  }

  return {};
}
