"use client";

import { useEffect } from "react";
import { FALLBACK_IMAGE_URL } from "@/src/lib/image-utils";

/**
 * Global Image Fallback Provider
 * Captures image load errors across the entire application in the capture phase
 * and immediately replaces broken or 404 images with a beautiful fallback image.
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
      img.src = FALLBACK_IMAGE_URL;
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
