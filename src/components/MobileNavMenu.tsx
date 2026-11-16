"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

const TOP_NEIGHBORHOODS = [
  { name: "Brickell", slug: "brickell" },
  { name: "Miami Beach", slug: "miami-beach" },
  { name: "Coconut Grove", slug: "coconut-grove" },
  { name: "Edgewater", slug: "edgewater" },
  { name: "Sunny Isles", slug: "sunny-isles-beach" },
  { name: "Coral Gables", slug: "coral-gables" },
];

interface MobileNavMenuProps {
  onOpenMatcher?: () => void;
  className?: string;
  isLightHeader?: boolean;
  projectName?: string;
}

export function MobileNavMenu({
  className = "",
  isLightHeader = false,
  projectName,
}: MobileNavMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { openInquiry } = useInquiry();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Handle ESC key and lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleInquireClick = useCallback(() => {
    setIsOpen(false);
    openInquiry({
      context: projectName || "General Inquiry",
      buttonClicked: "Mobile Menu Inquire",
      projectName: projectName || undefined,
    });
  }, [openInquiry, projectName]);

  const handleStickyInquireClick = useCallback(() => {
    setIsOpen(false);
    openInquiry({
      context: projectName || "General Inquiry",
      buttonClicked: "Mobile Sticky Inquire",
      projectName: projectName || undefined,
    });
  }, [openInquiry, projectName]);

  const menuItems = [
    { label: "Home", href: "/" },
    { label: "Explore Map", href: "/map" },
    { label: "Find My Project", href: "/find-my-project" },
    { label: "Neighborhoods", href: "/neighborhood", hasPills: true },
    { label: "Waterfront Homes", href: "/waterfront" },
    { label: "Compare Properties", href: "/compare" },
    { label: "Market Insights", href: "/insights" },
  ];

  return (
    <>
      {/* Mobile Header Actions (Sticky Inquire + Hamburger) */}
      <div className={`mobile-header-actions shrink-0 ${className}`}>
        {!isOpen && (
          <button
            type="button"
            onClick={handleStickyInquireClick}
            className="mobile-header-inquire-btn"
            aria-label="Inquire about luxury properties"
          >
            Inquire
          </button>
        )}

        {/* Mobile Hamburger Button */}
        {!isOpen && (
          <button
            type="button"
            aria-label="Open navigation menu"
            aria-expanded={false}
            aria-controls="mobile-nav-drawer"
            onClick={() => setIsOpen(true)}
            className="mobile-menu-toggle cursor-pointer"
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              width: 44,
              height: 44,
              padding: 8,
              background: "transparent",
              border: "none",
              zIndex: 60,
              position: "relative",
            }}
          >
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: isLightHeader ? "#101828" : "#FAF9F6",
                borderRadius: 1,
                transition: "all 0.25s ease",
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: isLightHeader ? "#101828" : "#FAF9F6",
                borderRadius: 1,
                margin: "5px 0",
                transition: "all 0.25s ease",
              }}
            />
            <span
              style={{
                display: "block",
                width: 22,
                height: 2,
                background: isLightHeader ? "#101828" : "#FAF9F6",
                borderRadius: 1,
                transition: "all 0.25s ease",
              }}
            />
          </button>
        )}
      </div>

      {/* Full-Screen Mobile Drawer */}
      {isOpen && (
        <div
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation Menu"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            background: "rgba(10, 15, 26, 0.98)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            animation: "mobileNavFadeIn 0.22s ease-out",
          }}
        >
          {/* Top Bar inside Drawer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "max(16px, env(safe-area-inset-top, 16px)) 20px 16px",
              borderBottom: "1px solid rgba(201, 168, 76, 0.2)",
              background: "rgba(12, 19, 32, 0.92)",
              position: "sticky",
              top: 0,
              zIndex: 10,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Image
                src="/images/MCS_Stacked_DarkBackground.png"
                alt="Miami New Development"
                width={150}
                height={34}
                className="h-8 w-auto object-contain"
                priority
              />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "0.18em",
                  color: "#C9A84C",
                  textTransform: "uppercase",
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                ONE Sotheby&apos;s International Realty
              </span>
            </div>

            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsOpen(false)}
              style={{
                width: 44,
                height: 44,
                minWidth: 44,
                minHeight: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(201, 168, 76, 0.35)",
                borderRadius: "50%",
                color: "#FAF9F6",
                fontSize: 18,
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              ✕
            </button>
          </div>

          {/* Navigation Items */}
          <nav
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              padding: "20px 20px max(32px, env(safe-area-inset-bottom, 32px))",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "#C9A84C",
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Navigation
            </span>

            {menuItems.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href);

              return (
                <div
                  key={item.label}
                  style={{
                    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                    padding: "4px 0",
                  }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 0",
                      color: isActive ? "#C9A84C" : "#FAF9F6",
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 19,
                      fontWeight: isActive ? 600 : 400,
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <span>{item.label}</span>
                    <span
                      style={{
                        fontSize: 14,
                        color: isActive ? "#C9A84C" : "rgba(250, 249, 246, 0.4)",
                      }}
                    >
                      →
                    </span>
                  </Link>

                  {/* Neighborhood quick chips */}
                  {item.hasPills && (
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        paddingBottom: 12,
                        paddingTop: 2,
                      }}
                    >
                      {TOP_NEIGHBORHOODS.map((hood) => (
                        <Link
                          key={hood.slug}
                          href={`/neighborhood/${hood.slug}`}
                          onClick={() => setIsOpen(false)}
                          style={{
                            fontSize: 11,
                            letterSpacing: "0.06em",
                            padding: "4px 10px",
                            borderRadius: 9999,
                            background: "rgba(255, 255, 255, 0.05)",
                            border: "1px solid rgba(201, 168, 76, 0.25)",
                            color:
                              pathname === `/neighborhood/${hood.slug}`
                                ? "#C9A84C"
                                : "rgba(250, 249, 246, 0.8)",
                            textDecoration: "none",
                          }}
                        >
                          {hood.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Inquire CTA Button */}
            <div style={{ marginTop: 24 }}>
              <button
                type="button"
                onClick={handleInquireClick}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #C9A84C 0%, #aa8530 100%)",
                  color: "#0C1523",
                  border: "none",
                  borderRadius: 4,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  boxShadow: "0 8px 24px rgba(201, 168, 76, 0.25)",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <span>Inquire with Zachary</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>

            {/* Quick Contact Options */}
            <div
              style={{
                marginTop: "auto",
                paddingTop: 28,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "rgba(250, 249, 246, 0.6)",
                  fontWeight: 600,
                }}
              >
                Direct Advisory
              </span>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <a
                  href="tel:3053435371"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "12px 10px",
                    minHeight: 44,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.12)",
                    borderRadius: 4,
                    color: "#FAF9F6",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>📞 Call Direct</span>
                </a>

                <a
                  href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27m%20exploring%20Miami%20luxury%20real%20estate%20on%20your%20website%20and%20would%20like%20to%20connect."
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                    padding: "12px 10px",
                    minHeight: 44,
                    background: "rgba(37, 211, 102, 0.12)",
                    border: "1px solid rgba(37, 211, 102, 0.35)",
                    borderRadius: 4,
                    color: "#25D366",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                  }}
                >
                  <span>💬 WhatsApp</span>
                </a>
              </div>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}

export default MobileNavMenu;
