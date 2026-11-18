"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { COUNTRIES, CountryInfo } from "@/src/lib/phone-validation";

export interface PhoneInputFieldProps {
  country: CountryInfo;
  phoneInput: string;
  phoneError?: string;
  onCountryChange: (country: CountryInfo) => void;
  onPhoneChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export function PhoneInputField({
  country,
  phoneInput,
  phoneError,
  onCountryChange,
  onPhoneChange,
  disabled = false,
}: PhoneInputFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
        phoneInputRef.current?.focus();
      }
    }
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch("");
    }
  }, [isOpen]);

  // Filter countries by name or dial code
  const filteredCountries = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        c.dialCode.toLowerCase().includes(q) ||
        c.dialCode.replace("+", "").includes(q)
    );
  }, [search]);

  const handleSelectCountry = (selected: CountryInfo) => {
    onCountryChange(selected);
    setIsOpen(false);
    // Return focus to phone input after selection
    setTimeout(() => {
      phoneInputRef.current?.focus();
    }, 50);
  };

  return (
    <div className="consultation-phone-wrapper" ref={wrapperRef}>
      <div className={`consultation-phone-row ${phoneError ? "has-error" : ""} ${isOpen ? "is-focused" : ""}`}>
        {/* Country Selector Trigger */}
        <button
          type="button"
          className="consultation-country-btn"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={`Selected country ${country.name} (${country.dialCode}). Click to change.`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
        >
          <span className="consultation-flag-container">
            <img
              src={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png`}
              srcSet={`https://flagcdn.com/w80/${country.code.toLowerCase()}.png 2x`}
              alt=""
              width="22"
              height="15"
              className="consultation-flag-img"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
                const badge = target.parentElement?.querySelector(".consultation-flag-badge") as HTMLElement;
                if (badge) badge.style.display = "inline-flex";
              }}
            />
            <span className="consultation-flag-badge" style={{ display: "none" }}>
              {country.code}
            </span>
          </span>
          <span className="consultation-dial-code">{country.dialCode}</span>
          <svg
            className={`consultation-dropdown-arrow ${isOpen ? "is-open" : ""}`}
            width="10"
            height="6"
            viewBox="0 0 10 6"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M1 1L5 5L9 1"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Subtle vertical separator */}
        <div className="consultation-phone-divider" aria-hidden="true" />

        {/* Visible, high-priority Phone Input (iOS Safari / Android 1-tap autofill ready) */}
        <input
          ref={phoneInputRef}
          id="inquiry-phone"
          aria-label="Mobile phone"
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          placeholder={country.placeholder || "Mobile phone"}
          value={phoneInput}
          onChange={onPhoneChange}
          onInput={onPhoneChange}
          className="consultation-phone-input"
          required
          disabled={disabled}
        />
      </div>

      {/* Custom Country Picker Popover */}
      {isOpen && (
        <div className="consultation-country-popover" role="listbox" aria-label="Country selection list">
          <div className="consultation-country-search-box">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#788092"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              className="consultation-country-search-input"
              placeholder="Search country or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Filter countries"
            />
            {search && (
              <button
                type="button"
                className="consultation-search-clear"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>
          <div className="consultation-country-list">
            {filteredCountries.length === 0 ? (
              <div className="consultation-country-empty">No country matches &ldquo;{search}&rdquo;</div>
            ) : (
              filteredCountries.map((c) => {
                const isSelected = c.code === country.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    className={`consultation-country-option ${isSelected ? "is-active" : ""}`}
                    onClick={() => handleSelectCountry(c)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className="consultation-option-flag">
                      <img
                        src={`https://flagcdn.com/w40/${c.code.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png 2x`}
                        alt=""
                        width="20"
                        height="14"
                        className="consultation-flag-img"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.style.display = "none";
                          const badge = target.parentElement?.querySelector(".consultation-flag-badge") as HTMLElement;
                          if (badge) badge.style.display = "inline-flex";
                        }}
                      />
                      <span className="consultation-flag-badge" style={{ display: "none" }}>
                        {c.code}
                      </span>
                    </span>
                    <span className="consultation-option-name">{c.name}</span>
                    <span className="consultation-option-dial">{c.dialCode}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Inline Layer A Validation Error */}
      {phoneError && (
        <span className="consultation-field-error" role="alert">
          {phoneError}
        </span>
      )}
    </div>
  );
}

