"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
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
}

const InquiryContext = createContext<InquiryContextValue>({
  openInquiry: () => {},
  closeInquiry: () => {},
});

export function InquiryProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
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
      setInquiryOptions({
        context: options.context || options.projectName || "",
        projectName: options.projectName || options.context || "",
        buttonClicked: options.buttonClicked || "Inquire",
        requireForDetails: options.requireForDetails,
      });
    } else {
      setInquiryOptions({
        context: "",
        projectName: "",
        buttonClicked: "Inquire",
      });
    }
    setIsOpen(true);
  }, []);

  const closeInquiry = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ openInquiry, closeInquiry }), [openInquiry, closeInquiry]);

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
      />
    </InquiryContext.Provider>
  );
}

export function useInquiry() {
  return useContext(InquiryContext);
}