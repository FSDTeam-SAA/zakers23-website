"use client";

import { useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";

type UseHeroSliderOptions = {
  slideCount: number;
};

export function useHeroSlider({ slideCount }: UseHeroSliderOptions) {
  const lenis = useLenis();
  const [activeSlide, setActiveSlide] = useState(0);
  const heroRef = useRef<HTMLElement | null>(null);
  const isAnimatingRef = useRef(false);
  const wheelDeltaRef = useRef(0);

  const goToSlide = (index: number) => {
    const boundedIndex = Math.max(0, Math.min(index, slideCount - 1));

    setActiveSlide(boundedIndex);
    isAnimatingRef.current = true;

    window.setTimeout(() => {
      isAnimatingRef.current = false;
    }, 650);
  };

  const showNextSlide = () => {
    const nextIndex = Math.min(activeSlide + 1, slideCount - 1);
    goToSlide(nextIndex);
  };

  const showPrevSlide = () => {
    const prevIndex = Math.max(activeSlide - 1, 0);
    goToSlide(prevIndex);
  };

  const handleHeroWheel = (event: React.WheelEvent<HTMLElement>) => {
    if (!heroRef.current || window.innerWidth < 1024 || Math.abs(event.deltaY) < 3) {
      return;
    }

    const rect = heroRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const inHeroWindow = rect.top <= 1 && rect.bottom >= viewportHeight - 1;
    
    if (!inHeroWindow) {
      lenis?.start();
      return;
    }

    const tryingToAdvance = event.deltaY > 0 && activeSlide < slideCount - 1;
    const tryingToReverse = event.deltaY < 0 && activeSlide > 0;

    if (tryingToAdvance || tryingToReverse) {
      lenis?.stop();
      event.preventDefault();
    } else {
      lenis?.start();
      return;
    }

    wheelDeltaRef.current += event.deltaY;

    if (isAnimatingRef.current || Math.abs(wheelDeltaRef.current) < 22) {
      return;
    }

    if (tryingToAdvance) {
      wheelDeltaRef.current = 0;
      goToSlide(activeSlide + 1);
    } else if (tryingToReverse) {
      wheelDeltaRef.current = 0;
      goToSlide(activeSlide - 1);
    }
  };

  useEffect(() => {
    const onWindowWheel = (event: WheelEvent) => {
      if (!heroRef.current || window.innerWidth < 1024 || Math.abs(event.deltaY) < 3) {
        return;
      }

      const rect = heroRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const inHeroWindow = rect.top <= 1 && rect.bottom >= viewportHeight - 1;

      if (!inHeroWindow) {
        lenis?.start();
        return;
      }

      const tryingToAdvance = event.deltaY > 0 && activeSlide < slideCount - 1;
      const tryingToReverse = event.deltaY < 0 && activeSlide > 0;

      if (tryingToAdvance || tryingToReverse) {
        lenis?.stop();
        event.preventDefault();
      } else {
        lenis?.start();
        return;
      }

      wheelDeltaRef.current += event.deltaY;

      if (isAnimatingRef.current || Math.abs(wheelDeltaRef.current) < 22) {
        return;
      }

      if (tryingToAdvance) {
        wheelDeltaRef.current = 0;
        goToSlide(activeSlide + 1);
      } else if (tryingToReverse) {
        wheelDeltaRef.current = 0;
        goToSlide(activeSlide - 1);
      }
    };

    window.addEventListener("wheel", onWindowWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWindowWheel);
      lenis?.start();
    };
  }, [activeSlide, slideCount, lenis]);

  return {
    heroRef,
    activeSlide,
    setActiveSlide: goToSlide,
    showNextSlide,
    showPrevSlide,
    handleHeroWheel
  };
}
