"use client";

import { useEffect } from "react";
import { getDistinctFallback } from "@/src/lib/image-utils";

/**
 * Global Image Fallback Provider
 * Captures image load errors across the entire application in the capture phase
 * and immediately replaces broken or 404 images with a beautiful property-matched fallback image.
 */
export function ImageFallbackProvider() {
  useEffect(() => {
    const handleCaptureError = (event: Event) => {
      const target = event.target as HTMLElement | null;
      if (!target || target.tagName !== "IMG") {
        return;
      }

      const img = target as HTMLImageElement;

      // Prevent recursive fallback loops
      if (img.dataset.fallbackApplied === "true") {
        return;
      }

      img.dataset.fallbackApplied = "true";
      // Clear srcset so browser does not attempt to reload from srcset
      if (img.srcset) {
        img.srcset = "";
      }

      const customFallback = img.dataset.fallback;
      if (customFallback && !customFallback.includes("api.cotality.com") && customFallback !== img.src) {
        img.src = customFallback;
      } else {
        img.src = getDistinctFallback(img.alt || img.src || "luxury-estate");
      }
      img.classList.add("img-fallback-applied");
    };

    // Listen on the capture phase so that image loading errors (which do not bubble) are caught
    window.addEventListener("error", handleCaptureError, true);

    return () => {
      window.removeEventListener("error", handleCaptureError, true);
    };
  }, []);

  return null;
}
