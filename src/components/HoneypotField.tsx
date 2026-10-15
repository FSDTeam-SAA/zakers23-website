"use client";

import React from "react";

interface HoneypotFieldProps {
  value?: string;
  onChange?: (val: string) => void;
  fieldName?: string;
}

/**
 * Hidden honeypot field designed to trap automated spam bots while remaining
 * completely invisible and inaccessible to legitimate human users and screen readers.
 */
export function HoneypotField({
  value,
  onChange,
  fieldName = "website",
}: HoneypotFieldProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: "-9999px",
        top: "-9999px",
        opacity: 0,
        height: 0,
        width: 0,
        zIndex: -1,
        overflow: "hidden",
        pointerEvents: "none",
      }}
      aria-hidden="true"
      tabIndex={-1}
    >
      <label htmlFor={`hp-${fieldName}`}>Leave this field blank</label>
      <input
        id={`hp-${fieldName}`}
        type="text"
        name={fieldName}
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        tabIndex={-1}
        autoComplete="off"
      />
    </div>
  );
}
