"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import InquiryModal from "./inquiry-modal";

export type InquiryOptions = {
  context?: string;
  projectName?: string;
  buttonClicked?: string;
  requireForDetails?: boolean;
};

interface InquiryContextValue {
  openInquiry: (options?: string | InquiryOptions) => void;
  closeInquiry: () => void;
  isSubmitted: boolean;
}

const InquiryContext = createContext<InquiryContextValue>({
  openInquiry: () => {},
  closeInquiry: () => {},
  isSubmitted: false,
});

const SUBMITTED_KEY = "has_submitted_registration_modal";
export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem(SUBMITTED_KEY) === "true";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (localStorage.getItem(SUBMITTED_KEY) === "true") {
        setIsSubmitted(true);
      }
    } catch {}
  }, []);

  const [inquiryOptions, setInquiryOptions] = useState<InquiryOptions>({
    context: "",
    projectName: "",
    buttonClicked: "Inquire",
  });

  const openInquiry = useCallback((options?: string | InquiryOptions) => {
    if (typeof options === "string") {
      setInquiryOptions({
        context: options,
        projectName: options,
        buttonClicked: "Inquire",
      });
    } else if (options && typeof options === "object") {
      const isGeneral =
        options.context === "General Inquiry" || options.projectName === "General Inquiry";
      setInquiryOptions({
        context: options.context || options.projectName || "General Inquiry",
        projectName: options.projectName || (isGeneral ? "" : options.context || ""),
        buttonClicked: options.buttonClicked || "Inquire",
        requireForDetails: options.requireForDetails,
      });
    } else {
      setInquiryOptions({
        context: "General Inquiry",
        projectName: "",
        buttonClicked: "Inquire",
      });
    }
    setIsOpen(true);
  }, []);

  const closeInquiry = useCallback(() => setIsOpen(false), []);

  const handleSuccess = useCallback(() => {
    setIsSubmitted(true);
    try {
      localStorage.setItem(SUBMITTED_KEY, "true");
      sessionStorage.setItem(SUBMITTED_KEY, "true");
    } catch {}
  }, []);

  const value = useMemo(
    () => ({ openInquiry, closeInquiry, isSubmitted }),
    [openInquiry, closeInquiry, isSubmitted]
  );

  return (
    <InquiryContext.Provider value={value}>
      {children}
      <InquiryModal
        isOpen={isOpen}
        context={inquiryOptions.context}
        projectName={inquiryOptions.projectName}
        buttonClicked={inquiryOptions.buttonClicked}
        requireForDetails={inquiryOptions.requireForDetails}
        onClose={closeInquiry}
        onSuccess={handleSuccess}
      />
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  return useContext(InquiryContext);
}