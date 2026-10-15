"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { getSafeImageUrl, getDistinctFallback } from "@/src/lib/image-utils";

export interface SafeImageProps extends Omit<ImageProps, "src"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

/**
 * SafeImage Component
 * A robust wrapper around next/image that prevents broken image links,
 * automatically rendering a beautiful fallback image when loading fails.
 */
export function SafeImage({
  src,
  fallbackSrc,
  alt = "",
  onError,
  className = "",
  ...rest
}: SafeImageProps) {
  const altText = typeof alt === "string" ? alt : "";
  const resolvedFallback = fallbackSrc || getDistinctFallback(altText || "luxury-estate");
  const safeInitialSrc = getSafeImageUrl(src, resolvedFallback);
  const [imgSrc, setImgSrc] = useState<string>(safeInitialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const updated = getSafeImageUrl(src, resolvedFallback);
    setImgSrc(updated);
    setHasError(false);
  }, [src, resolvedFallback]);

  return (
    <Image
      {...rest}
      src={hasError ? resolvedFallback : imgSrc}
      alt={alt}
      data-fallback={resolvedFallback}
      className={`${className} ${hasError ? "fallback-image" : ""}`}
      onError={(event) => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(resolvedFallback);
        }
        if (onError) {
          onError(event);
        }
      }}
    />
  );
}

export default SafeImage;
