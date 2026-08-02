"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import projectsRaw from "@/src/data/miami-projects.json";

import { MapProject } from "@/src/features/Home/DiscoveryEngine/components/map-explore-page";

export interface MatcherPrefs {
  purpose: string | null;
  neighborhoods: string[];
  beds: number[];
  budget: [number, number];
  timeline: string | null;
}

export interface MatchResults {
  prefs: MatcherPrefs;
  exactMatches: MapProject[];
  alternatives: MapProject[];
  secondaryRecommendations: MapProject[];
  hasExactMatches: boolean;
  variant: "strong" | "few" | "none";
}

type FindMyProjectModalProps = {
  onClose: () => void;
  onDone: (results: MatchResults) => void;
};

const Qi = [
  "Miami Beach",
  "South of Fifth",
  "South Beach",
  "Faena District, Mid-Beach",
  "North Beach, Miami Beach",
  "Sunny Isles Beach",
  "Bal Harbour",
  "Edgewater",
  "Coconut Grove",
  "Fisher Island",
  "North Bay Village"
];

const zi: Record<string, string> = {
  "South of Fifth": "Miami Beach",
  "South Beach": "Miami Beach",
  "North Beach, Miami Beach": "Miami Beach",
  "Faena District, Mid-Beach": "Miami Beach",
  "Brickell, Miami": "Brickell"
};

const NEIGHBORHOODS = [
  "Brickell",
  "South Brickell",
  "Downtown Miami",
  "Midtown",
  "Edgewater",
  "Wynwood",
  "Arts District",
  "Miami Beach",
  "South of Fifth",
  "South Beach",
  "Sunny Isles Beach",
  "Surfside",
  "Bal Harbour",
  "North Bay Village",
  "North Miami",
  "Coconut Grove",
  "Coral Gables",
  "Fisher Island",
  "Design District"
];

const BEDROOMS = [
  { val: 0, label: "Studio" },
  { val: 1, label: "1 Bed" },
  { val: 2, label: "2 Beds" },
  { val: 3, label: "3 Beds" },
  { val: 4, label: "4 Beds" },
  { val: 5, label: "5+ Beds" }
];

const TIMELINES = [
  { val: "asap", label: "Move-In Ready", sub: "Delivered or completing soon" },
  { val: "1yr", label: "Within 1 year", sub: "2026 deliveries" },
  { val: "2yr", label: "1–2 years", sub: "2026–2027" },
  { val: "3yr", label: "2–3 years", sub: "2027–2028" },
  { val: "flexible", label: "Flexible", sub: "All stages" }
];

const BUDGET_PRESETS: [number, number][] = [
  [400000, 1000000],
  [1000000, 3000000],
  [3000000, 5000000],
  [5000000, 10000000],
  [10000000, 30000000]
];

// Helper Functions
function zt(prefNeighborhood: string, projectNeighborhood: string): boolean {
  if (prefNeighborhood === projectNeighborhood) return true;
  const mapped = zi[projectNeighborhood];
  return mapped ? mapped === prefNeighborhood : false;
}

function qt(completionStr: string | null | undefined): number | null {
  if (!completionStr) return null;
  const matches = [...String(completionStr).matchAll(/\b20\d{2}\b/g)].map(n => parseInt(n[0], 10));
  return matches.length ? Math.min(...matches) : null;
}

function ht(project: MapProject) {
  if (!project) return null;
  let min = project.minPrice;
  if (min === null || min <= 0) return null;
  const max = project.maxPrice && project.maxPrice > 0 ? project.maxPrice : min;
  return { min: Math.min(min, max), max: Math.max(min, max) };
}

function Lt(budget: [number, number], priceRange: { min: number; max: number }, options: { minUserSpan?: number; openTop?: boolean } = {}) {
  const minUserSpan = options.minUserSpan ?? 500000;
  const openTop = options.openTop ?? false;
  
  if (!priceRange) return 50;
  const s = budget[0];
  const c = budget[1];
  const d = openTop || c >= 30000000 ? Number.POSITIVE_INFINITY : c;
  const { min: u, max: p } = priceRange;
  const m = Math.max(c - s, minUserSpan);
  
  if (u >= s && u <= d) return 100;
  if (u < s && p >= s) {
    const h = Math.max(0, Math.min(p, d === Number.POSITIVE_INFINITY ? p : d) - s);
    return h <= 0 ? 30 : Math.round(55 + 35 * Math.min(1, h / m));
  }
  if (u > d) {
    const h = (u - c) / Math.max(c, m);
    return h <= 0.05 ? 45 : h <= 0.15 ? 25 : h <= 0.35 ? 12 : Math.max(0, Math.round(8 - h * 10));
  }
  if (p < s) {
    const h = (s - p) / Math.max(s, m);
    return h <= 0.05 ? 45 : h <= 0.2 ? 25 : Math.max(0, Math.round(15 - h * 20));
  }
  return 50;
}

function er(t: MatcherPrefs, i: MapProject): number {
  return t.neighborhoods && t.neighborhoods.length
    ? t.neighborhoods.some(n => zt(n, i.neighborhood)) ? 40 : 8
    : 40;
}

function tr(t: MatcherPrefs, i: MapProject): number {
  return t.beds && t.beds.length
    ? t.beds.some(s => s === 0 ? i.minBed === 0 : s === 5 ? (i.maxBed !== null && i.maxBed >= 5) : (i.minBed !== null && i.minBed <= s && i.maxBed !== null && i.maxBed >= s)) ? 25 : 6
    : 25;
}

function ir(t: MatcherPrefs, i: MapProject): number {
  if (!(t.budget && t.budget.length)) return 20;
  const [r, n] = t.budget;
  const s = ht(i);
  if (!s) return 18;
  const c = Lt([r, n], s);
  return Math.round(4 + c / 100 * 16);
}

function rr(t: MapProject, i: MatcherPrefs): number {
  if (!i.timeline || i.timeline === "flexible") return 10;
  const r = t.stage;
  const n = qt(t.completion);
  return i.timeline === "asap"
    ? (r === "move_in_ready" || r === "topped_off" ? 10 : r === "under_construction" ? 4 : 2)
    : i.timeline === "1yr"
      ? (n === null ? 3 : n <= 2026 ? 10 : n <= 2027 ? 5 : 2)
      : i.timeline === "2yr"
        ? (n === null ? 3 : n <= 2027 ? 10 : n <= 2028 ? 5 : 2)
        : i.timeline === "3yr"
          ? (n === null ? 3 : n <= 2028 ? 10 : n <= 2029 ? 5 : 2)
          : 5;
}

function nr(t: MatcherPrefs, i: MapProject[]): MapProject[] {
  return (i ?? []).map(n => ({
    p: n,
    score: er(t, n) + tr(t, n) + ir(t, n) + rr(n, t) + 5
  })).sort((n, s) => s.score - n.score).map(n => n.p);
}

export function Vt(t: MatcherPrefs, i: MapProject[]): (MapProject & { score: number })[] {
  const r = i ?? [];
  return t ? r.map(n => {
    let s = 0;
    let c = false;
    const o = qt(n.completion);
    const d = n.stage;
    
    // Budget
    if (t.budget && t.budget.length >= 2) {
      const [h, y] = t.budget;
      const x = ht(n);
      if (x) {
        const { min: M, max: j } = x;
        if (M > y || j < h) {
          c = true;
        } else {
          s += 20;
          if (M >= h && M <= y) {
            s += 10;
          }
        }
      } else {
        s += 5;
      }
    }
    
    // Neighborhoods
    if (t.neighborhoods && t.neighborhoods.length) {
      if (t.neighborhoods.some(y => zt(y, n.neighborhood))) {
        s += 15;
      } else {
        c = true;
      }
    } else {
      s += 5;
    }
    
    // Beds
    if (t.beds && t.beds.length) {
      if (t.beds.some(y => y === 0 ? n.minBed === 0 : y === 5 ? (n.maxBed !== null && n.maxBed >= 5) : (n.minBed !== null && n.minBed <= y && n.maxBed !== null && n.maxBed >= y))) {
        s += 12;
      } else {
        c = true;
      }
    }
    
    // Timeline
    if (t.timeline) {
      if (t.timeline === "asap") {
        if (d === "move_in_ready" || d === "topped_off") {
          s += 15;
        } else {
          c = true;
        }
      } else if (t.timeline === "1yr") {
        if (o === null || o <= 2026) {
          s += 15;
        } else {
          c = true;
        }
      } else if (t.timeline === "2yr") {
        if (o === null || o <= 2027) {
          s += 15;
        } else {
          c = true;
        }
      } else if (t.timeline === "3yr") {
        if (o === null || o <= 2028) {
          s += 15;
        } else {
          c = true;
        }
      } else if (t.timeline === "flexible") {
        s += 5;
      }
    }
    
    // Purpose
    if (t.purpose === "investment") {
      if ((n.projectedAppreciation || 0) >= 25) {
        s += 5;
      }
    } else if (t.purpose === "vacation") {
      if (Qi.includes(n.neighborhood)) {
        s += 5;
      }
    } else if (t.purpose === "primary") {
      s += 2;
    }
    
    return { ...n, score: s, isDealbreaker: c };
  }).filter(n => !n.isDealbreaker && n.score > 0).sort((n, s) => s.score - n.score) : [];
}

function or(t: MatcherPrefs, i: MapProject[]): number {
  return Vt(t, i).length;
}

function sr(t: MatcherPrefs, i: MapProject[]): MatchResults {
  const n = Vt(t, i);
  const s = n.length > 0;
  const c = nr(t, i);
  const o = new Set(n.map(m => m.id));
  const d = c.filter(m => !o.has(m.id)).slice(0, 4);
  const u = s ? [] : c.slice(0, 5);
  const p = n.length >= 5 ? "strong" : n.length >= 1 ? "few" : "none";
  return {
    prefs: t,
    exactMatches: n,
    alternatives: u,
    secondaryRecommendations: d,
    hasExactMatches: s,
    variant: p
  };
}

const themeColors = {
  ink: "#1c1f26",
  bronze: "#b89354",
  dune: "#e2dfd8",
  cream: "#fafaf8",
  white: "#ffffff",
  fog: "#b0b0bb",
  mist: "#6A6A7A",
  bronzA: (alpha: number) => `rgba(184, 147, 84, ${alpha})`
};

export default function FindMyProjectModal({ onClose, onDone }: FindMyProjectModalProps) {
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState<MatcherPrefs>({
    purpose: null,
    neighborhoods: [],
    beds: [],
    budget: [400000, 30000000],
    timeline: null
  });

  const [isAnimating, setIsAnimating] = useState(false);
  const hasAnimatedRef = useRef(false);

  const projects = useMemo(() => projectsRaw as MapProject[], []);
  const activePrefs = useMemo(() => (step < 3 ? { ...prefs, budget: [400000, 30000000] as [number, number] } : prefs), [prefs, step]);
  const matchesCount = useMemo(() => or(activePrefs, projects), [activePrefs, projects]);

  const handleFinish = useCallback(() => {
    onDone(sr(prefs, projects));
  }, [onDone, prefs, projects]);

  // Handle Purpose selection auto-advance
  useEffect(() => {
    if (step === 0 && prefs.purpose) {
      if (hasAnimatedRef.current) {
        hasAnimatedRef.current = false;
        return;
      }
      const timer = setTimeout(() => setStep(1), 400);
      return () => clearTimeout(timer);
    }
  }, [step, prefs.purpose]);

  // Handle Timeline selection auto-submit
  useEffect(() => {
    if (step === 4 && prefs.timeline) {
      const timer = setTimeout(() => handleFinish(), 400);
      return () => clearTimeout(timer);
    }
  }, [step, prefs.timeline, handleFinish]);

  // ESC Key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const stepsConfig = [
    {
      title: "What brings you to Miami?",
      sub: "We'll match projects to your goals.",
      type: "purpose"
    },
    {
      title: "Which neighborhoods?",
      sub: "Select all that apply, or skip for all.",
      type: "neighborhoods"
    },
    {
      title: "How many bedrooms?",
      sub: "Select all that apply.",
      type: "beds"
    },
    {
      title: "What's your price range?",
      sub: "Slide to set your range.",
      type: "budget"
    },
    {
      title: "What's your timeline?",
      sub: "Helps us prioritise delivery dates.",
      type: "timeline"
    }
  ];

  const currentStepConfig = stepsConfig[step];
  const progressPercent = ((step + 1) / stepsConfig.length) * 100;

  const toggleNeighborhood = (name: string) => {
    setPrefs(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods.includes(name)
        ? prev.neighborhoods.filter(x => x !== name)
        : [...prev.neighborhoods, name]
    }));
  };

  const toggleBed = (val: number) => {
    setPrefs(prev => ({
      ...prev,
      beds: prev.beds.includes(val)
        ? prev.beds.filter(x => x !== val)
        : [...prev.beds, val]
    }));
  };

  const formatPriceNum = (f: number) => {
    return f >= 1000000 ? `$${(f / 1000000).toFixed(1).replace(/\.0$/, "")}M` : `$${(f / 1000).toFixed(0)}K`;
  };

  const purposeOptions = [
    {
      val: "primary",
      label: "Primary Residence",
      sub: "Living in Miami full-time",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      )
    },
    {
      val: "investment",
      label: "Investment / Rental",
      sub: "Income & appreciation",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      val: "vacation",
      label: "Vacation Home",
      sub: "Part-time Miami lifestyle",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      )
    },
    {
      val: "portfolio",
      label: "Portfolio Expansion",
      sub: "Adding to existing holdings",
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    }
  ];

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 2000,
        background: "rgba(28, 31, 38, 0.82)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "max(20px, env(safe-area-inset-top)) 16px max(20px, env(safe-area-inset-bottom))"
      }}
    >
      <div
        className="quiz-inner"
        style={{
          width: 600,
          maxWidth: "100%",
          background: themeColors.white,
          boxShadow: "0 40px 80px rgba(28,31,38,0.3)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          maxHeight: "calc(100vh - 40px)"
        }}
      >
        {/* Progress Bar */}
        <div style={{ height: 2, background: themeColors.dune, flexShrink: 0 }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: themeColors.bronze,
              transition: "width 0.4s ease"
            }}
          />
        </div>

        {/* Header Padding */}
        <div className="quiz-padding" style={{ padding: "30px 42px 0", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
            <div style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
              <div
                className="quiz-step-label"
                style={{
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  color: themeColors.bronze,
                  textTransform: "uppercase",
                  marginBottom: 9,
                  fontFamily: "'DM Sans', sans-serif"
                }}
              >
                Step {step + 1} of {stepsConfig.length}
              </div>
              <h2
                className="quiz-heading"
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 25,
                  fontWeight: 300,
                  color: themeColors.ink,
                  lineHeight: 1.2,
                  marginBottom: 5
                }}
              >
                {currentStepConfig.title}
              </h2>
              <p style={{ fontSize: 12, color: themeColors.mist, fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>
                {currentStepConfig.sub}
              </p>
              {currentStepConfig.type === "neighborhoods" && prefs.neighborhoods.length > 0 && (
                <p
                  className="quiz-selected-count"
                  style={{
                    fontSize: 11,
                    color: themeColors.bronze,
                    fontWeight: 400,
                    marginTop: 4,
                    letterSpacing: "0.05em",
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  {prefs.neighborhoods.length} selected
                </p>
              )}
              {currentStepConfig.type === "beds" && prefs.beds.length > 0 && (
                <p
                  className="quiz-selected-count"
                  style={{
                    fontSize: 11,
                    color: themeColors.bronze,
                    fontWeight: 400,
                    marginTop: 4,
                    letterSpacing: "0.05em",
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  {prefs.beds.length} selected
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="quiz-close-btn"
              aria-label="Close"
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: themeColors.fog,
                fontSize: 24,
                lineHeight: 1,
                flexShrink: 0,
                padding: "4px",
                marginTop: -4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Content Padding */}
        <div
          className="quiz-padding"
          style={{
            padding: "20px 42px 4px",
            flex: 1,
            overflowY: "auto",
            WebkitOverflowScrolling: "touch"
          }}
        >
          {/* Step 1: Purpose */}
          {currentStepConfig.type === "purpose" && (
            <div
              className="quiz-purpose-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12
              }}
            >
              {purposeOptions.map(f => {
                const isSelected = prefs.purpose === f.val;
                return (
                  <button
                    key={f.val}
                    onClick={() => setPrefs(C => ({ ...C, purpose: f.val }))}
                    className={`choice-pill quiz-purpose-pill ${isSelected ? "sel" : ""}`}
                    style={{
                      padding: "15px 16px",
                      textAlign: "left",
                      background: isSelected ? themeColors.bronzA(0.08) : themeColors.cream,
                      border: `1px solid ${isSelected ? themeColors.bronze : themeColors.dune}`,
                      cursor: "pointer",
                      transition: "all 0.18s",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div className="quiz-purpose-pill-icon" style={{ marginBottom: 9, color: themeColors.bronze }}>
                      {f.icon}
                    </div>
                    <div className="quiz-purpose-pill-text">
                      <div style={{ fontSize: 12, fontWeight: 500, color: themeColors.ink, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 11, color: themeColors.mist, fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.sub}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 2: Neighborhoods */}
          {currentStepConfig.type === "neighborhoods" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
              {NEIGHBORHOODS.map(f => {
                const isSelected = prefs.neighborhoods.includes(f);
                return (
                  <button
                    key={f}
                    onClick={() => toggleNeighborhood(f)}
                    className={`choice-pill quiz-nhd-pill ${isSelected ? "sel" : ""}`}
                    style={{
                      padding: "9px 14px",
                      background: isSelected ? themeColors.bronzA(0.1) : themeColors.cream,
                      border: `1px solid ${isSelected ? themeColors.bronze : themeColors.dune}`,
                      color: isSelected ? themeColors.ink : themeColors.mist,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "'DM Sans', sans-serif",
                      transition: "all 0.15s"
                    }}
                  >
                    {f}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 3: Bedrooms */}
          {currentStepConfig.type === "beds" && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 560, margin: "0 auto" }}>
              {BEDROOMS.map(f => {
                const isSelected = prefs.beds.includes(f.val);
                return (
                  <button
                    key={f.val}
                    onClick={() => toggleBed(f.val)}
                    className={`choice-pill quiz-bed-pill ${isSelected ? "sel" : ""}`}
                    style={{
                      padding: "11px 22px",
                      background: isSelected ? themeColors.bronzA(0.1) : themeColors.cream,
                      border: `1px solid ${isSelected ? themeColors.bronze : themeColors.dune}`,
                      color: isSelected ? themeColors.ink : themeColors.mist,
                      cursor: "pointer",
                      fontSize: 12,
                      fontFamily: "'Playfair Display', serif",
                      fontWeight: 400,
                      transition: "all 0.15s"
                    }}
                  >
                    {f.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStepConfig.type === "budget" && (
            <div>
              <div
                className="quiz-budget-row"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 22,
                  alignItems: "stretch",
                  gap: 8
                }}
              >
                <div style={{ textAlign: "center", flex: "1 1 0", minWidth: 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: themeColors.fog, textTransform: "uppercase", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>
                    Min
                  </div>
                  <div className="quiz-budget-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 300, color: themeColors.bronze }}>
                    {formatPriceNum(prefs.budget[0])}
                  </div>
                </div>
                <div
                  className="quiz-budget-connector"
                  style={{
                    fontSize: 11,
                    color: themeColors.fog,
                    alignSelf: "center",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                    fontFamily: "'DM Sans', sans-serif"
                  }}
                >
                  to
                </div>
                <div style={{ textAlign: "center", flex: "1 1 0", minWidth: 0 }}>
                  <div style={{ fontSize: 9, letterSpacing: "0.2em", color: themeColors.fog, textTransform: "uppercase", marginBottom: 5, fontFamily: "'DM Sans', sans-serif" }}>
                    Max
                  </div>
                  <div className="quiz-budget-num" style={{ fontFamily: "'Playfair Display', serif", fontSize: 25, fontWeight: 300, color: themeColors.bronze }}>
                    {prefs.budget[1] >= 30000000 ? "$30M+" : formatPriceNum(prefs.budget[1])}
                  </div>
                </div>
              </div>

              {/* Min Input Slider */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.18em", color: themeColors.fog, textTransform: "uppercase", marginBottom: 9, fontFamily: "'DM Sans', sans-serif" }}>
                  Minimum
                </div>
                <input
                  type="range"
                  className="range-input w-full accent-[#b89354]"
                  min={400000}
                  max={10000000}
                  step={100000}
                  value={prefs.budget[0]}
                  onChange={f =>
                    setPrefs(C => ({
                      ...C,
                      budget: [Number(f.target.value), Math.max(Number(f.target.value) + 500000, C.budget[1])]
                    }))
                  }
                />
              </div>

              {/* Max Input Slider */}
              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.18em", color: themeColors.fog, textTransform: "uppercase", marginBottom: 9, fontFamily: "'DM Sans', sans-serif" }}>
                  Maximum
                </div>
                <input
                  type="range"
                  className="range-input w-full accent-[#b89354]"
                  min={500000}
                  max={30000000}
                  step={500000}
                  value={prefs.budget[1]}
                  onChange={f =>
                    setPrefs(C => ({
                      ...C,
                      budget: [C.budget[0], Math.max(C.budget[0] + 500000, Number(f.target.value))]
                    }))
                  }
                />
              </div>

              {/* Preset Buttons */}
              <div
                className="quiz-budget-presets"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 7,
                  marginTop: 18,
                  marginBottom: 4
                }}
              >
                {BUDGET_PRESETS.map(([f, C]) => {
                  const isSelected = prefs.budget[0] === f && prefs.budget[1] === C;
                  return (
                    <button
                      key={f}
                      onClick={() => setPrefs(prev => ({ ...prev, budget: [f, C] }))}
                      className={`choice-pill quiz-budget-preset ${isSelected ? "sel" : ""}`}
                      style={{
                        padding: "7px 12px",
                        background: isSelected ? themeColors.bronzA(0.1) : themeColors.cream,
                        border: `1px solid ${isSelected ? themeColors.bronze : themeColors.dune}`,
                        color: themeColors.mist,
                        cursor: "pointer",
                        fontSize: 10.5,
                        fontFamily: "'DM Sans', sans-serif",
                        transition: "all 0.15s"
                      }}
                    >
                      {formatPriceNum(f)}–{C >= 30000000 ? "$30M+" : formatPriceNum(C)}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 5: Timeline */}
          {currentStepConfig.type === "timeline" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {TIMELINES.map(f => {
                const isSelected = prefs.timeline === f.val;
                return (
                  <button
                    key={f.val}
                    onClick={() => setPrefs(C => ({ ...C, timeline: f.val }))}
                    className={`choice-pill ${isSelected ? "sel" : ""}`}
                    style={{
                      padding: "14px 16px",
                      textAlign: "left",
                      background: isSelected ? themeColors.bronzA(0.08) : themeColors.cream,
                      border: `1px solid ${isSelected ? themeColors.bronze : themeColors.dune}`,
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.18s",
                      minHeight: 52
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, color: themeColors.ink, fontWeight: 400, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.label}
                      </div>
                      <div style={{ fontSize: 11, color: themeColors.mist, fontWeight: 300, fontFamily: "'DM Sans', sans-serif" }}>
                        {f.sub}
                      </div>
                    </div>
                    {isSelected && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: themeColors.bronze,
                          flexShrink: 0
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div
          className="quiz-padding"
          style={{
            padding: "18px 42px 32px",
            flexShrink: 0,
            borderTop: `1px solid ${themeColors.dune}`,
            marginTop: 16
          }}
        >
          {step > 0 && (
            <div className="quiz-match-count" style={{ marginBottom: 14, textAlign: "center" }}>
              {matchesCount > 0 ? (
                <p style={{ fontSize: 11, color: themeColors.mist, letterSpacing: "0.08em", fontFamily: "'DM Sans', sans-serif" }}>
                  <span style={{ color: themeColors.bronze, fontWeight: 500 }}>
                    {matchesCount}
                  </span>{" "}
                  {matchesCount === 1 ? "project matches" : "projects match"} so far
                </p>
              ) : (
                <p style={{ fontSize: 11, color: themeColors.bronze, letterSpacing: "0.05em", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>
                  No exact matches yet — try widening your criteria, or finish to see closest alternatives
                </p>
              )}
            </div>
          )}

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            {step > 0 && (
              <button
                type="button"
                onClick={() => {
                  setStep(f => f - 1);
                }}
                className="quiz-nav-btn"
                style={{
                  padding: "11px 20px",
                  minHeight: 44,
                  background: "transparent",
                  border: `1px solid ${themeColors.dune}`,
                  color: themeColors.mist,
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
            )}
            <div style={{ flex: 1 }} />
            {step < stepsConfig.length - 1 ? (
              <>
                <button
                  type="button"
                  onClick={() => setStep(f => f + 1)}
                  className="quiz-nav-btn quiz-skip-btn"
                  style={{
                    padding: "11px 16px",
                    minHeight: 44,
                    background: "transparent",
                    border: "none",
                    color: themeColors.fog,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    cursor: "pointer"
                  }}
                >
                  Skip
                </button>
                <button
                  type="button"
                  onClick={() => setStep(f => f + 1)}
                  className="btn-ink quiz-nav-btn quiz-continue-btn"
                  style={{
                    padding: "11px 28px",
                    minHeight: 44,
                    background: themeColors.ink,
                    color: themeColors.cream,
                    border: "none",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 10,
                    letterSpacing: "0.24em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  Continue →
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                className="btn-ink quiz-nav-btn quiz-finish-btn"
                style={{
                  padding: "12px 32px",
                  minHeight: 44,
                  background: themeColors.ink,
                  color: themeColors.cream,
                  border: "none",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 10,
                  letterSpacing: "0.24em",
                  textTransform: "uppercase",
                  cursor: "pointer"
                }}
              >
                Show My Matches →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
