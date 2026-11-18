"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import InquiryModal from "@/src/features/inquiry/components/inquiry-modal";

interface PropertyInquiryGateProps {
  name: string;
  project?: any;
  onUnlock?: () => void;
}

export default function PropertyInquiryGate({ name, project, onUnlock }: PropertyInquiryGateProps) {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  const handleSuccess = () => {
    setSubmitted(true);
    setOpen(false);
    onUnlock?.();
    router.refresh();
  };

  const bgImage = project?.img || project?.imgs?.[0] || "/images/anantara/aerial-helipad-day.webp";

  return (
    <main className="property-gate-container">
      {/* Background with luxury blur & dark gradient overlay */}
      <div
        className="property-gate-bg"
        style={{ backgroundImage: `url(${bgImage})` }}
      />
      <div className="property-gate-overlay" />

      <div className="property-gate-card">
        <Link href="/" className="property-gate-logo" aria-label="Home">
          <img
            src="/images/latest-logo.png"
            alt="The Miami Condo Source"
            width={180}
            height={40}
            className="property-gate-logo-img"
          />
        </Link>

        <span className="property-gate-kicker">Exclusive Property Access</span>

        <h1 className="property-gate-title">{name}</h1>

        <p className="property-gate-description">
          {submitted
            ? "Your inquiry has been received. Your property details are unlocked."
            : "Complete registration to unlock private developer pricing, floor plans, specifications, and availability."}
        </p>

        <button
          type="button"
          className="property-gate-btn"
          onClick={() => {
            if (submitted) {
              onUnlock?.();
              router.refresh();
            } else {
              setOpen(true);
            }
          }}
        >
          {submitted ? "View Property Details" : "Unlock Details & Pricing"}
        </button>

        <div className="property-gate-footer">
          <Link href="/map" className="property-gate-back-link">
            ← Explore other properties
          </Link>
        </div>

        <div className="property-gate-sothebys">
          <span>ONE</span>
          <div>
            Sotheby&apos;s<small>International Realty</small>
          </div>
        </div>
      </div>

      <InquiryModal
        isOpen={open}
        context={name}
        projectName={name}
        buttonClicked="Unlock Details (Property Gate)"
        onClose={close}
        requireForDetails
        onSuccess={handleSuccess}
      />
    </main>
  );
}
