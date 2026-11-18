"use client";

import React, { useEffect, useRef, useState } from "react";
import { submitInquiry } from "@/src/lib/inquiry";
import { toast } from "sonner";
import { TurnstileWidget } from "@/src/components/TurnstileWidget";
import { HoneypotField } from "@/src/components/HoneypotField";
import { PhoneInputField } from "@/src/components/PhoneInputField";
import {
  CountryInfo,
  DEFAULT_COUNTRY,
  detectCountryFromPhone,
  detectUserCountry,
  formatAsYouType,
  validatePhoneNumber,
} from "@/src/lib/phone-validation";

type InquiryModalProps = {
  isOpen: boolean;
  context?: string;
  projectName?: string;
  buttonClicked?: string;
  onClose: () => void;
  onSuccess?: () => void;
  requireForDetails?: boolean;
};

export default function InquiryModal({
  isOpen,
  context,
  projectName,
  buttonClicked,
  onClose,
  onSuccess,
  requireForDetails = false,
}: InquiryModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [smsConsent, setSmsConsent] = useState(true);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetCount, setTurnstileResetCount] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  // Phone state with country detection and formatting
  const [country, setCountry] = useState<CountryInfo>(DEFAULT_COUNTRY);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Auto-detect visitor's country on mount
  useEffect(() => {
    setCountry(detectUserCountry());
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const items = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not([tabindex="-1"]), select:not([tabindex="-1"]), textarea'
        );
        if (items?.length) {
          const first = items[0];
          const last = items[items.length - 1];
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) {
            event.preventDefault();
            last.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }
      }
      if (event.key === "Escape") {
        onClose();
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      previousFocus?.focus();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setStatus("idle");
      setPhoneError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const detected = detectCountryFromPhone(rawVal);
    const activeCountry = detected || country;

    if (detected && detected.code !== country.code) {
      setCountry(detected);
    }

    const formatted = formatAsYouType(rawVal, activeCountry);
    setPhoneInput(formatted);
    if (phoneError) setPhoneError(null);
  };

  const handleCountryChange = (nextCountry: CountryInfo) => {
    setCountry(nextCountry);
    setPhoneInput(formatAsYouType(phoneInput, nextCountry));
    if (phoneError) setPhoneError(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === "sending") return;

    const data = new FormData(event.currentTarget);
    const name = ((data.get("name") as string) || nameInput || "").trim();
    const email = ((data.get("email") as string) || emailInput || "").trim();
    const website = ((data.get("website") as string) || "").trim();
    const consentGranted = smsConsent;

    if (!name) {
      setStatus("error");
      toast.error("Please enter your full name.");
      return;
    }

    if (!email) {
      setStatus("error");
      toast.error("Please enter your email address.");
      return;
    }

    // Layer A Phone Validation (Browser inline validation)
    const phoneValidation = validatePhoneNumber(phoneInput, country);
    if (!phoneValidation.isValid) {
      setPhoneError(phoneValidation.error || "Please enter a valid mobile phone number.");
      setStatus("error");
      return;
    }
    setPhoneError(null);

    // Bot verification check if Turnstile is enabled
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      toast.error("Please complete the security check before continuing.");
      return;
    }

    setStatus("sending");

    try {
      const activeProjectName = projectName || (context && context !== "General Inquiry" ? context : "") || "";

      const result = await submitInquiry({
        name,
        email,
        phone: phoneValidation.e164, // Always send clean E.164 international format
        website,
        turnstileToken,
        smsConsent: consentGranted,
        source: "Website",
        projectName: activeProjectName,
        buttonClicked: buttonClicked || "Unlock Details",
        details: {
          ...(context ? { "Interested in": context } : {}),
          ...(activeProjectName ? { "Project Name": activeProjectName } : {}),
          ...(buttonClicked ? { "Button Clicked": buttonClicked } : {}),
          "Call & Text Consent": consentGranted ? "Granted (Yes)" : "Not provided (No)",
        },
      });

      setStatus("done");
      toast.success("Details unlocked! Zachary will follow up with tailored options.");

      try {
        localStorage.setItem("has_submitted_registration_modal", "true");
        sessionStorage.setItem("has_submitted_registration_modal", "true");
      } catch {}

      // Dispatch event to show the optional post-unlock budget prompt if desired
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("inquiry-unlocked", {
            detail: { contactId: result?.id },
          })
        );
      }

      onSuccess?.();

      if (requireForDetails) {
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err: unknown) {
      setStatus("error");
      setTurnstileToken("");
      setTurnstileResetCount((prev) => prev + 1);
      const msg = err instanceof Error ? err.message : "Could not send inquiry. Please check your information and try again.";
      toast.error(msg);
    }
  };

  return (
    <div className="consultation-backdrop" onClick={onClose} role="presentation" data-lenis-prevent>
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="consultation-modal"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-modal-title"
        aria-describedby="inquiry-modal-description"
      >
        <button type="button" className="consultation-close" onClick={onClose} aria-label="Close inquiry form">
          ×
        </button>
        <span className="consultation-kicker">Private consultation</span>
        {status === "done" ? (
          <div className="consultation-success" role="status">
            <h3 id="inquiry-modal-title">Thank you for reaching out.</h3>
            <p id="inquiry-modal-description">
              Your request has been received. Zachary will follow up personally with tailored options.
            </p>
            <button type="button" className="consultation-submit" onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="consultation-heading">
              <img src="/images/imagereader.webp" alt="Zachary Akers" className="consultation-avatar" />
              <h3 id="inquiry-modal-title">
                Connect with <em>Zachary Akers</em>
              </h3>
            </div>
            <p className="consultation-description" id="inquiry-modal-description">
              {requireForDetails
                ? "Submit your inquiry to unlock property details, pricing and floor plans. Zachary will follow up with tailored options."
                : "Share a few details about what you’re looking for and Zachary will follow up with tailored options."}
            </p>
            {context && <p className="consultation-context">Regarding: {context}</p>}

            <form
              id="inquiry-consultation-form"
              name="inquiry-consultation-form"
              method="post"
              action="/api/inquiry"
              autoComplete="on"
              className="consultation-form"
              onSubmit={handleSubmit}
            >
              <HoneypotField />

              {/* 3 Streamlined Form Fields (Full width, single column, iOS/Android 1-tap autofill ready) */}
              <div className="consultation-fields">
                <input
                  id="inquiry-name"
                  aria-label="Full name"
                  type="text"
                  name="name"
                  autoComplete="name"
                  autoCapitalize="words"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Full name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  required
                />
                <input
                  id="inquiry-email"
                  aria-label="Email address"
                  type="email"
                  name="email"
                  autoComplete="email"
                  inputMode="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  placeholder="Email address"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  required
                />
                <PhoneInputField
                  country={country}
                  phoneInput={phoneInput}
                  phoneError={phoneError || undefined}
                  onCountryChange={handleCountryChange}
                  onPhoneChange={handlePhoneChange}
                  disabled={status === "sending"}
                />
              </div>

              {/* Optional TCPA Consent Checkbox */}
              <div className="consultation-consent">
                <input
                  id="inquiry-tcpa-consent"
                  type="checkbox"
                  name="smsConsent"
                  checked={smsConsent}
                  onChange={(e) => setSmsConsent(e.target.checked)}
                />
                <label htmlFor="inquiry-tcpa-consent" className="consultation-consent-text">
                  I consent to calls and SMS from Zachary Akers &amp; ONE Sotheby&apos;s regarding real estate updates,
                  including automated messages. Not a condition of purchase. Msg &amp; data rates may apply. Reply STOP
                  to opt out. See our{" "}
                  <a href="/privacy" target="_blank" rel="noopener noreferrer" className="underline hover:text-[#bb9150]">
                    Privacy Policy
                  </a>
                  .
                </label>
              </div>

              <button type="submit" className="consultation-submit" disabled={status === "sending"}>
                {status === "sending" ? "Unlocking Details…" : "Unlock Details"}
              </button>

              {status === "error" && !phoneError && (
                <p className="consultation-error" role="alert">
                  Something went wrong submitting your inquiry. Please try again.
                </p>
              )}
            </form>

            <div className="consultation-alternatives">
              <a
                className="consultation-whatsapp"
                href="https://wa.me/13053435371?text=Hi%20Zachary%2C%20I%27d%20like%20to%20connect%20regarding%20Miami%20luxury%20real%20estate."
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" aria-hidden="true">
                  <circle cx="12" cy="12" r="12" fill="#13d766" />
                  <path d="M6.4 17.7l.8-2.7a7 7 0 1 1 2.5 2.3l-3.3.4Z" fill="none" stroke="white" strokeWidth="1.35" />
                  <path
                    d="M9 8.2c-.7.4-.5 2.4 1.4 4.4s3.8 2.3 4.5 1.6l.6-1.1-2-1-.7.7c-1.3-.5-2.1-1.3-2.6-2.5l.7-.7-1-1.9-.9.5Z"
                    fill="white"
                  />
                </svg>
                WhatsApp
              </a>

              {/* Cloudflare Turnstile Bot Verification (Horizontal Bar under WhatsApp) */}
              <div className="consultation-turnstile-wrapper">
                <TurnstileWidget
                  size="flexible"
                  resetTrigger={turnstileResetCount}
                  onVerify={(token) => setTurnstileToken(token)}
                  onExpire={() => setTurnstileToken("")}
                />
              </div>

              <button type="button" className="consultation-dismiss" onClick={onClose}>
                Not now
              </button>
            </div>
          </>
        )}
        <div className="consultation-brands" aria-label="ONE Sotheby's International Realty">
          <div className="consultation-sothebys">
            <span>ONE</span>
            <div>
              Sotheby&apos;s<small>International Realty</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
