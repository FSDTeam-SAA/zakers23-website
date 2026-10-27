"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

interface MobileNavMenuProps {
  onOpenMatcher?: () => void;
  className?: string;
  isLightHeader?: boolean;
  projectName?: string;
}

export function MobileNavMenu({ onOpenMatcher, className = "", isLightHeader = false, projectName }: MobileNavMenuProps) {
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

  const handleLinkClick = useCallback((href: string) => {
    setIsOpen(false);
    router.push(href);
  }, [router]);

  const handleMatcherClick = useCallback(() => {
    setIsOpen(false);
    if (onOpenMatcher) {
      onOpenMatcher();
    } else {
      router.push("/find-my-project");
    }
  }, [onOpenMatcher, router]);

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

  type MenuItem =
    | { label: string; href: string; isAction?: false; action?: never }
    | { label: string; action: () => void; isAction: true; href?: string };

  const menuItems: MenuItem[] = [
    { label: "Find My Project", href: "/find-my-project", isAction: false },
    { label: "Neighborhoods", href: "/neighborhood", isAction: false },
    { label: "Waterfront Homes", href: "/waterfront", isAction: false },
    { label: "Insights", href: "/insights", isAction: false },
  ];

  return (
    <>
      {/* Mobile Header Actions (Sticky Inquire + Hamburger) */}
      <div className={`mobile-header-actions ${className}`}>
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
        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          aria-controls="mobile-nav-drawer"
          onClick={() => setIsOpen(!isOpen)}
          className="mobile-menu-toggle"
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
            cursor: "pointer",
            zIndex: 60,
            position: "relative",
          }}
        >
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: isLightHeader && !isOpen ? "#101828" : "#FAF9F6",
              borderRadius: 1,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isOpen ? "rotate(45deg) translate(5px, 5px)" : "none",
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: isLightHeader && !isOpen ? "#101828" : "#FAF9F6",
              borderRadius: 1,
              margin: "5px 0",
              transition: "all 0.2s ease-in-out",
              opacity: isOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: "block",
              width: 22,
              height: 2,
              background: isLightHeader && !isOpen ? "#101828" : "#FAF9F6",
              borderRadius: 1,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
              transform: isOpen ? "rotate(-45deg) translate(5px, -5px)" : "none",
            }}
          />
        </button>
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
            background: "rgba(10, 15, 26, 0.97)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            display: "flex",
            flexDirection: "column",
            overflowY: "auto",
            animation: "mobileNavFadeIn 0.25s ease-out",
          }}
        >
          {/* Top Bar inside Drawer */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 20px",
              borderBottom: "1px solid rgba(201, 168, 76, 0.15)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 16,
                  letterSpacing: "0.18em",
                  color: "#f3e7c4",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                ZACHARY AKERS
              </div>
              <div
                style={{
                  fontSize: 12,
                  letterSpacing: "0.18em",
                  color: "rgba(250, 249, 246, 0.45)",
                  textTransform: "uppercase",
                  marginTop: 2,
                }}
              >
                ONE Sotheby&apos;s International Realty
              </div>
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
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: "50%",
                color: "#FAF9F6",
                fontSize: 20,
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
              padding: "24px 20px 32px",
              gap: 4,
            }}
          >
            <span
              style={{
                fontSize: 12,
                textTransform: "uppercase",
                letterSpacing: "0.24em",
                color: "#C9A84C",
                fontWeight: 600,
                marginBottom: 12,
              }}
            >
              Navigation
            </span>

            {menuItems.map((item) => (
              <div
                key={item.label}
                style={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
                }}
              >
                {item.isAction ? (
                  <button
                    type="button"
                    onClick={item.action}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 0",
                      background: "transparent",
                      border: "none",
                      color: "#FAF9F6",
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 20,
                      fontWeight: 400,
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: 14, color: "#C9A84C", opacity: 0.7 }}>→</span>
                  </button>
                ) : (
                  <Link
                    href={item.href!}
                    onClick={() => setIsOpen(false)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "16px 0",
                      color: pathname === item.href ? "#C9A84C" : "#FAF9F6",
                      fontFamily: "'Playfair Display', Georgia, serif",
                      fontSize: 20,
                      fontWeight: pathname === item.href ? 600 : 400,
                      textDecoration: "none",
                      transition: "color 0.2s ease",
                    }}
                  >
                    <span>{item.label}</span>
                    <span style={{ fontSize: 14, color: "#C9A84C", opacity: 0.7 }}>→</span>
                  </Link>
                )}
              </div>
            ))}

            {/* Inquire CTA Button */}
            <div style={{ marginTop: 28 }}>
              <button
                type="button"
                onClick={handleInquireClick}
                style={{
                  width: "100%",
                  padding: "16px 20px",
                  background: "linear-gradient(135deg, #C9A84C 0%, #aa8530 100%)",
                  color: "#0C1523",
                  border: "none",
                  borderRadius: 2,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
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
                paddingTop: 32,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <span
                style={{
                  fontSize: 12,
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
                    gap: 8,
                    padding: "12px 14px",
                    minHeight: 44,
                    background: "rgba(255, 255, 255, 0.04)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    borderRadius: 2,
                    color: "#FAF9F6",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textDecoration: "none",
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
                    gap: 8,
                    padding: "12px 14px",
                    minHeight: 44,
                    background: "rgba(37, 211, 102, 0.12)",
                    border: "1px solid rgba(37, 211, 102, 0.3)",
                    borderRadius: 2,
                    color: "#25D366",
                    fontSize: 12,
                    letterSpacing: "0.06em",
                    textDecoration: "none",
                    fontWeight: 500,
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
