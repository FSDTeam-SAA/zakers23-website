"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import projectsRaw from "@/src/data/miami-projects.json";

interface Project {
  id: number;
  name: string;
  neighborhood: string;
  img: string;
  slug: string;
}

export function CompareFloatingBar() {
  const [compareIds, setCompareIds] = useState<number[]>([]);

  const loadCompareIds = () => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("zakers23-compare-projects");
      if (stored) {
        try {
          setCompareIds(JSON.parse(stored) as number[]);
        } catch (e) {
          console.error(e);
        }
      } else {
        setCompareIds([]);
      }
    }
  };

  useEffect(() => {
    loadCompareIds();
    window.addEventListener("compare-changed", loadCompareIds);
    return () => window.removeEventListener("compare-changed", loadCompareIds);
  }, []);

  if (compareIds.length === 0) return null;

  const selectedProjects = (projectsRaw as Project[]).filter((p) =>
    compareIds.includes(p.id)
  );

  const handleRemove = (id: number) => {
    const updated = compareIds.filter((item) => item !== id);
    localStorage.setItem("zakers23-compare-projects", JSON.stringify(updated));
    setCompareIds(updated);
    window.dispatchEvent(new Event("compare-changed"));
  };

  const handleClearAll = () => {
    localStorage.removeItem("zakers23-compare-projects");
    setCompareIds([]);
    window.dispatchEvent(new Event("compare-changed"));
  };

  const getImageUrl = (path: string | null | undefined): string => {
    if (!path) return "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=60";
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    return `https://frasermiami.s3.amazonaws.com/${path.replace(/^\//, "")}`;
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-[640px] bg-[#0C1523]/95 backdrop-blur-md border border-white/10 rounded-lg shadow-2xl p-4 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className="bg-[#b89354] text-[#0C1523] font-mono text-xs font-bold px-2 py-1 rounded">
          {compareIds.length} / 2
        </div>
        <div>
          <h4 className="text-xs uppercase tracking-wider font-semibold text-white/90">Compare Developments</h4>
          <p className="text-[10px] text-white/50">Compare specifications side-by-side</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {selectedProjects.map((p) => (
          <div key={p.id} className="flex items-center gap-2 bg-white/5 border border-white/10 pl-2 pr-1 py-1 rounded text-xs text-white/80">
            <div className="relative w-8 h-8 rounded overflow-hidden">
              <img
                src={getImageUrl(p.img)}
                alt={p.name}
                className="object-cover w-full h-full rounded"
              />
            </div>
            <span className="max-w-[100px] truncate text-[11px] font-medium">{p.name}</span>
            <button
              onClick={() => handleRemove(p.id)}
              className="text-white/40 hover:text-white/80 text-sm px-1.5 transition-colors"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 border-t border-white/10 pt-3 md:pt-0 md:border-t-0">
        <button
          onClick={handleClearAll}
          className="text-[10px] uppercase tracking-wider text-white/40 hover:text-white/80 px-2 py-1.5 transition-colors"
        >
          Clear
        </button>
        <Link
          href="/compare"
          className="bg-[#b89354] hover:bg-[#a68245] text-white text-[10px] uppercase tracking-widest font-semibold px-4 py-2 transition-colors rounded shadow"
        >
          Compare Now
        </Link>
      </div>
    </div>
  );
}
