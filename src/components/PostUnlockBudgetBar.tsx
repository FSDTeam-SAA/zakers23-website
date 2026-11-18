"use client";

import React, { useState, useEffect } from "react";
import { toast } from "sonner";

const BUDGET_OPTIONS = [
  "Under $2M",
  "$2M to $5M",
  "$5M to $10M",
  "$10M to $20M",
  "$20M+",
];

export function PostUnlockBudgetBar() {
  const [isVisible, setIsVisible] = useState(false);
  const [contactId, setContactId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleUnlock = (e: Event) => {
      try {
        const skipped = sessionStorage.getItem("zakers_budget_skipped");
        if (skipped === "true") return;
      } catch {}

      const customEvent = e as CustomEvent<{ contactId?: number }>;
      if (customEvent.detail?.contactId) {
        setContactId(customEvent.detail.contactId);
      }
      setIsVisible(true);
    };

    window.addEventListener("inquiry-unlocked", handleUnlock);
    return () => window.removeEventListener("inquiry-unlocked", handleUnlock);
  }, []);

  if (!isVisible) return null;

  const handleSkip = () => {
    setIsVisible(false);
    try {
      sessionStorage.setItem("zakers_budget_skipped", "true");
    } catch {}
  };

  const handleSelectBudget = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/inquiry/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: val,
          contactId: contactId || undefined,
        }),
      });

      if (res.ok) {
        toast.success("Thank you! Zachary has noted your budget preference.");
      }
    } catch (err) {
      console.warn("Could not save budget preference:", err);
    } finally {
      setIsSubmitting(false);
      setIsVisible(false);
      try {
        sessionStorage.setItem("zakers_budget_skipped", "true");
      } catch {}
    }
  };

  return (
    <aside
      aria-label="Optional budget range preference"
      className="fixed bottom-5 left-4 right-4 sm:left-auto sm:right-6 md:right-24 z-40 max-w-sm bg-[#0C1523]/96 backdrop-blur-xl border border-[#C9A84C]/35 rounded-lg p-3.5 shadow-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#C9A84C]">
          Tailored Options
        </span>
        <button
          type="button"
          onClick={handleSkip}
          className="text-xs text-[#FAF9F6]/60 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
        >
          Skip
        </button>
      </div>

      <p className="text-xs text-[#FAF9F6]/90 leading-tight mb-2.5 font-medium">
        Help Zachary tailor options — budget range?
      </p>

      <div className="relative">
        <select
          aria-label="Select your purchase budget range"
          defaultValue=""
          disabled={isSubmitting}
          onChange={handleSelectBudget}
          className="w-full h-9 px-3 pr-8 rounded bg-white/10 text-white text-xs border border-white/20 hover:border-[#C9A84C] focus:border-[#C9A84C] focus:outline-none transition-colors appearance-none cursor-pointer"
        >
          <option value="" disabled className="text-gray-400 bg-[#0C1523]">
            Select budget range (optional)...
          </option>
          {BUDGET_OPTIONS.map((opt) => (
            <option key={opt} value={opt} className="text-white bg-[#0C1523]">
              {opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#C9A84C]">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </aside>
  );
}

