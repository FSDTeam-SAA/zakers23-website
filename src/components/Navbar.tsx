"use client";

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Ht } from "@/src/data/neighborhoods";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { MobileNavMenu } from "@/src/components/MobileNavMenu";

export interface NavbarProps {
  variant?: "auto" | "transparent" | "dark" | "light";
  inquiryContext?: string;
  projectName?: string;
  className?: string;
}

export function Navbar({
  variant = "auto",
  inquiryContext,
  projectName,
  className = "",
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { openInquiry } = useInquiry();
  const [isScrolled, setIsScrolled] = useState(false);

  // Scroll detection for dynamic blur / background change
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Determine effective theme variant
  const effectiveVariant = useMemo(() => {
    if (variant !== "auto") return variant;
    if (pathname === "/") return "transparent";
    if (
      pathname.startsWith("/property") ||
      pathname.startsWith("/neighborhood") ||
      pathname.startsWith("/insights") ||
      pathname.startsWith("/privacy")
    ) {
      return "light";
    }
    return "dark";
  }, [variant, pathname]);

  // Determine active nav links
  const isFindMyProject = pathname === "/find-my-project";
  const isNeighborhood = pathname.startsWith("/neighborhood");
  const isWaterfront = pathname.startsWith("/waterfront");
  const isInsights = pathname.startsWith("/insights");

  // Determine header classes based on variant and scroll state
  const headerClasses = useMemo(() => {
    const base = "site-header";
    const classes = [base];

    if (effectiveVariant === "light") {
      classes.push("site-header-light");
      if (isScrolled) classes.push("site-header-scrolled");
    } else if (effectiveVariant === "transparent") {
      if (isScrolled) classes.push("site-header-scrolled");
    } else if (effectiveVariant === "dark") {
      classes.push("site-header-dark");
    }

    if (className) classes.push(className);
    return classes.join(" ");
  }, [effectiveVariant, isScrolled, className]);

  // Handle inquiry CTA click
  const handleInquire = (e: React.MouseEvent) => {
    e.preventDefault();
    openInquiry({
      context: inquiryContext || projectName || "Website Navigation",
      buttonClicked: "Navbar Inquire",
      projectName: projectName || undefined,
    });
  };

  // Determine if currently displayed on a light background (scrolled or light variant)
  const isLight = effectiveVariant === "light" || (effectiveVariant === "transparent" && isScrolled);

  return (
    <header className={headerClasses}>
      <div className="site-header-inner">
        {/* Brand Logo */}
        <Link href="/" className="brand" aria-label="Miami New Development Home">
          <Image
            src={isLight ? "/images/MCS_Stacked_LightBackground.png" : "/images/MCS_Stacked_DarkBackground.png"}
            alt="Miami New Development"
            width={210}
            height={46}
            className="site-logo h-11 md:h-12 w-auto object-contain"
            priority
          />
        </Link>

        {/* Primary Desktop Navigation Links */}
        <nav className="nav-links" aria-label="Primary Navigation">
          {/* Find My Project */}
          <Link
            href="/find-my-project"
            className={isFindMyProject ? "nav-link-active" : undefined}
          >
            Find My Project
          </Link>

          {/* Neighborhoods Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className={`nav-dropdown flex items-center gap-1 ${isNeighborhood ? "nav-link-active" : ""}`}
              onClick={() => router.push("/neighborhood")}
              aria-haspopup="true"
            >
              Neighborhoods
              <span aria-hidden="true" className="text-[10px] ml-0.5">⌄</span>
            </button>
            <div className="nav-dropdown-menu" role="menu">
              {Object.entries(Ht).map(([slug, data]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/neighborhood/${slug}`);
                  }}
                  className="nav-dropdown-item"
                  role="menuitem"
                >
                  {data.name}
                </button>
              ))}
            </div>
          </div>

          {/* Waterfront Homes */}
          <Link
            href="/waterfront"
            className={isWaterfront ? "nav-link-active" : undefined}
          >
            Waterfront Homes
          </Link>

          {/* Insights */}
          <Link
            href="/insights"
            className={isInsights ? "nav-link-active" : undefined}
          >
            Insights
          </Link>

          {/* Inquire Action Button */}
          <button
            type="button"
            onClick={handleInquire}
            className="nav-inquire-btn cursor-pointer"
          >
            Inquire
          </button>
        </nav>

        {/* Mobile Navigation Drawer & Hamburger */}
        <MobileNavMenu
          onOpenMatcher={() => router.push("/find-my-project")}
          isLightHeader={isLight}
          projectName={projectName}
        />
      </div>
    </header>
  );
}

export default Navbar;
