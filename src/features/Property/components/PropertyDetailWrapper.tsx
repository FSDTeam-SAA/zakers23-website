"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useCallback } from "react";
import PropertyDetailSkeleton from "./PropertyDetailSkeleton";
import InquiryModal from "@/src/features/inquiry/components/inquiry-modal";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

const PropertyDetailPageClient = dynamic(
  () => import("./PropertyDetailPage"),
  { 
    ssr: true,
    loading: () => <PropertyDetailSkeleton />
  }
);

const ResalePropertyDetailPageClient = dynamic(
  () => import("./ResalePropertyDetailPage"),
  {
    ssr: true,
    loading: () => <PropertyDetailSkeleton />,
  }
);

export default function PropertyDetailWrapper({
  slug,
  name: _name,
  expiresAt,
  hasAccess = false,
  initialProject,
}: {
  slug: string;
  name: string;
  expiresAt?: number | null;
  hasAccess?: boolean;
  initialProject?: any;
}) {
  const { isSubmitted } = useInquiry();
  const [unlocked, setUnlocked] = useState(hasAccess);
  const [modalOpen, setModalOpen] = useState(!hasAccess);
  const lastTrackedSlug = useRef<string | null>(null);
  const [sessionDeadline, setSessionDeadline] = useState<number | null>(expiresAt ?? null);

  const projectName = _name || initialProject?.name || "Property Details";

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const alreadySubmitted =
        hasAccess ||
        isSubmitted ||
        localStorage.getItem("has_submitted_registration_modal") === "true" ||
        sessionStorage.getItem("has_submitted_registration_modal") === "true";

      if (alreadySubmitted) {
        setUnlocked(true);
        setModalOpen(false);
      } else {
        setUnlocked(false);
        setModalOpen(true);
      }
    } catch {}
  }, [hasAccess, isSubmitted]);

  useEffect(() => {
    setSessionDeadline(expiresAt ?? null);
  }, [expiresAt]);

  const handleUnlockSuccess = useCallback(() => {
    setUnlocked(true);
    setModalOpen(false);
    try {
      localStorage.setItem("has_submitted_registration_modal", "true");
      sessionStorage.setItem("has_submitted_registration_modal", "true");
    } catch {}
  }, []);

  const handleModalClose = useCallback(() => {
    setModalOpen(false);
  }, []);

  useEffect(() => {
    // Only track returning visitors who have an active inquiry access session.
    if (!unlocked || !hasAccess || !sessionDeadline || Date.now() >= sessionDeadline) {
      return;
    }

    if (lastTrackedSlug.current === slug) {
      return;
    }
    lastTrackedSlug.current = slug;

    void fetch("/api/property-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug }),
      keepalive: true,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setSessionDeadline(null);
        } else if (response.ok) {
          const result = await response.json();
          if (typeof result.expiresAt === "number") {
            setSessionDeadline(result.expiresAt);
          }
        }
      })
      .catch(() => {
        console.warn("Property visit could not be recorded.");
      });
  }, [slug, hasAccess, unlocked, sessionDeadline]);

  const isResale = Boolean(
    initialProject?.isResale ||
    initialProject?.propertyType === "resale" ||
    (initialProject?.mlsId && !initialProject?.depositStructure && !initialProject?.floorPlans && !initialProject?.developer)
  );

  const pageContent = isResale ? (
    <ResalePropertyDetailPageClient slug={slug} initialProject={initialProject} />
  ) : (
    <PropertyDetailPageClient slug={slug} initialProject={initialProject} />
  );

  return (
    <div className={`property-details-wrapper ${!unlocked ? "is-gated" : ""}`}>
      {/* Real property details rendered behind the modal; blurred until unlocked */}
      <div className={`property-details-inner ${!unlocked ? "property-details-blurred" : ""}`}>
        {pageContent}
      </div>

      {/* When gated and modal is closed, show luxury floating card over the blurred property view */}
      {!unlocked && !modalOpen && (
        <div className="property-gate-lock-overlay" aria-modal="true" role="dialog">
          <div className="property-gate-lock-card">
            <span className="property-gate-kicker">Exclusive Developer Access</span>
            <h2 className="property-gate-lock-title">Unlock {projectName} Details</h2>
            <p className="property-gate-lock-desc">
              Submit your inquiry to view private developer pricing, floor plans, and full specifications for {projectName}.
            </p>
            <button
              type="button"
              className="property-gate-lock-btn"
              onClick={() => setModalOpen(true)}
            >
              Unlock Details &amp; Pricing
            </button>
          </div>
        </div>
      )}

      {/* Inquiry modal pops up over blurred property details */}
      {!unlocked && (
        <InquiryModal
          isOpen={modalOpen}
          context={projectName}
          projectName={projectName}
          buttonClicked="Unlock Details"
          onClose={handleModalClose}
          onSuccess={handleUnlockSuccess}
          requireForDetails
        />
      )}
    </div>
  );
}
