"use client";

import React, { useState, useEffect } from "react";
import Image, { ImageProps } from "next/image";
import { FALLBACK_IMAGE_URL, getSafeImageUrl } from "@/src/lib/image-utils";

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
  fallbackSrc = FALLBACK_IMAGE_URL,
  alt = "",
  onError,
  className = "",
  ...rest
}: SafeImageProps) {
  const safeInitialSrc = getSafeImageUrl(src, fallbackSrc);
  const [imgSrc, setImgSrc] = useState<string>(safeInitialSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const updated = getSafeImageUrl(src, fallbackSrc);
    setImgSrc(updated);
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <Image
      {...rest}
      src={hasError ? fallbackSrc : imgSrc}
      alt={alt}
      className={`${className} ${hasError ? "fallback-image" : ""}`}
      onError={(event) => {
        if (!hasError) {
          setHasError(true);
          setImgSrc(fallbackSrc);
        }
        if (onError) {
          onError(event);
        }
      }}
    />
  );
}

export default SafeImage;
