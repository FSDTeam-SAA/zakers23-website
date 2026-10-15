"use client";

import { useEffect } from "react";
import { trackContactClick } from "../lib/analytics";

/**
 * Global component that listens for clicks on WhatsApp, Phone, and Email links
 * across the entire application and tracks them into Analytics and Follow Up Boss.
 */
export function ContactClickTracker() {
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href") || "";
      if (!href) return;

      if (href.includes("wa.me") || href.includes("whatsapp.com") || anchor.dataset.channel === "whatsapp") {
        trackContactClick("whatsapp", href);
      } else if (href.startsWith("tel:") || anchor.dataset.channel === "phone") {
        trackContactClick("phone", href);
      } else if (href.startsWith("mailto:") || anchor.dataset.channel === "email") {
        trackContactClick("email", href);
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
    };
  }, []);

  return null;
}
