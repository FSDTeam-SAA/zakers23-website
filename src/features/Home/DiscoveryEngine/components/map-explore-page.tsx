"use client";

import { useState } from "react";
import Image from "next/image";
import type { Project } from "@/src/features/Home/FeaturedProject/types/featured-project.types";

type MapExplorePageProps = {
  projectNames: string[];
  featuredProjects: Project[];
};

export function MapExplorePage({ projectNames, featuredProjects }: MapExplorePageProps) {
  const [location, setLocation] = useState(50);
  const [wellness, setWellness] = useState(50);
  const [budget, setBudget] = useState([500, 30000]);
  const [selectedProject, setSelectedProject] = useState(featuredProjects[0]?.name ?? "");

  const mapPins = featuredProjects.map((project, index) => ({
    ...project,
    left: [23, 61, 48, 72, 36, 80][index] ?? 50,
    top: [68, 36, 57, 25, 48, 72][index] ?? 50
  }));

  const activeProject =
    featuredProjects.find((project) => project.name === selectedProject) ?? featuredProjects[0];

  return (
    <main className="min-h-screen bg-[#0f1726] px-5 py-8 text-white md:px-7 md:py-10">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-[640px]">
            <span className="mb-3 inline-block text-[10px] uppercase tracking-[0.34em] text-[#b89354]">
              Explore Map
            </span>
            <h1
              className="m-0 text-[34px] font-normal leading-[1.05] tracking-[-0.03em] text-[#f3f1ec] md:text-[52px]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Find your <em className="italic">project</em>.
            </h1>
            <p className="mt-4 max-w-[560px] text-[15px] leading-[1.65] text-[#91a0bc]">
              Explore the map, compare neighborhoods, and surface the developments that match
              your lifestyle, wellness priorities, and budget.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {["Map", "List", "Matches"].map((label, index) => (
              <button
                key={label}
                type="button"
                className={`min-h-11 rounded-full border px-4 text-[11px] uppercase tracking-[0.24em] transition-colors duration-200 ${
                  index === 0
                    ? "border-[#b89354] bg-[#b89354] text-[#0f1726]"
                    : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[#a4afc4] hover:border-[#b89354] hover:text-[#e8d1a4]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.07)] bg-[#111a2b] shadow-[0_24px_80px_rgba(0,0,0,0.28)]">
          <div className="flex flex-col xl:flex-row">
            <aside className="w-full border-b border-[rgba(255,255,255,0.06)] bg-[#fbfaf7] text-[#1c2438] xl:w-[380px] xl:min-w-[380px] xl:border-b-0 xl:border-r">
              <div className="border-b border-[#e7e0d5] px-5 py-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#9ba3b5]">
                    Live Filters
                  </span>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#b89354]">
                    {featuredProjects.length} in view
                  </span>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#4c5366]">
                      <span>Location</span>
                      <span>{location}</span>
                    </div>
                    <input
                      className="w-full accent-[#b89354]"
                      type="range"
                      min="0"
                      max="100"
                      value={location}
                      onChange={(event) => setLocation(Number(event.target.value))}
                    />
                  </label>

                  <label className="block">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#4c5366]">
                      <span>Health &amp; Wellness</span>
                      <span>{wellness}</span>
                    </div>
                    <input
                      className="w-full accent-[#b89354]"
                      type="range"
                      min="0"
                      max="100"
                      value={wellness}
                      onChange={(event) => setWellness(Number(event.target.value))}
                    />
                  </label>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[11px] uppercase tracking-[0.16em] text-[#4c5366]">
                      <span>Price Band</span>
                      <span>
                        ${budget[0]}K -{" "}
                        {budget[1] >= 30000 ? "30M+" : `${(budget[1] / 1000).toFixed(1)}M`}
                      </span>
                    </div>
                    <input
                      className="mb-2 w-full accent-[#b89354]"
                      type="range"
                      min="500"
                      max="30000"
                      step="100"
                      value={budget[0]}
                      onChange={(event) =>
                        setBudget([
                          Math.min(Number(event.target.value), budget[1] - 500),
                          budget[1]
                        ])
                      }
                    />
                    <input
                      className="w-full accent-[#b89354]"
                      type="range"
                      min="1000"
                      max="30000"
                      step="100"
                      value={budget[1]}
                      onChange={(event) =>
                        setBudget([
                          budget[0],
                          Math.max(Number(event.target.value), budget[0] + 500)
                        ])
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="no-scrollbar max-h-[720px] overflow-y-auto">
                <div className="border-b border-[#e7e0d5] px-5 py-3">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#a3aabd]">
                    Top Matches
                  </span>
                </div>

                <div className="space-y-0">
                  {featuredProjects.map((project, index) => {
                    const isActive = project.name === activeProject?.name;

                    return (
                      <button
                        key={project.name}
                        type="button"
                        onClick={() => setSelectedProject(project.name)}
                        className={`flex w-full gap-3 border-b border-[#e7e0d5] px-5 py-4 text-left transition-colors duration-200 ${
                          isActive ? "bg-[rgba(184,147,84,0.12)]" : "bg-transparent hover:bg-[#f6f2ea]"
                        }`}
                      >
                        <div className="pt-1 text-[17px] leading-none text-[#b89354]">
                          {index + 1}
                        </div>
                        <div className="relative h-[74px] w-[74px] shrink-0 overflow-hidden rounded-[8px] bg-[#d8d2c4]">
                          <Image fill src={project.image} alt={project.name} className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[10px] uppercase tracking-[0.18em] text-[#b89354]">
                            {project.neighborhood}
                          </span>
                          <strong
                            className="mt-1 block text-[15px] font-normal leading-[1.25] text-[#1c2438]"
                            style={{ fontFamily: "var(--font-serif), serif" }}
                          >
                            {project.name}
                          </strong>
                          <div className="mt-2 flex items-center justify-between gap-3">
                            <span
                              className="text-[14px] text-[#b89354]"
                              style={{ fontFamily: "var(--font-serif), serif" }}
                            >
                              {project.price}
                            </span>
                            <span className="text-[11px] uppercase tracking-[0.16em] text-[#7d8598]">
                              {98 - index * 7}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="border-t border-[#e7e0d5] px-5 py-4">
                  <div className="mb-3 text-[10px] uppercase tracking-[0.24em] text-[#a3aabd]">
                    Active Projects
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {projectNames.slice(0, 12).map((name) => (
                      <a
                        key={name}
                        href="#contact"
                        className="rounded-full border border-[#e1dbd1] px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#6f7485] transition-colors duration-200 hover:border-[#b89354] hover:text-[#b89354]"
                      >
                        {name}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            <div className="relative min-h-[760px] flex-1 overflow-hidden bg-[#0d1524]">
              <div className="absolute inset-0 opacity-95">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_24%,rgba(57,78,112,0.55),transparent_22%),radial-gradient(circle_at_72%_33%,rgba(52,75,109,0.35),transparent_24%),radial-gradient(circle_at_64%_74%,rgba(30,43,71,0.5),transparent_28%),linear-gradient(180deg,#152038_0%,#10192b_100%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:108px_108px] opacity-[0.18]" />
              </div>

              <div className="absolute left-4 top-4 z-10 flex flex-wrap gap-2 md:left-6 md:top-6">
                {["Preconstruction", "Under Construction", "Move-in Ready"].map((label, index) => (
                  <button
                    key={label}
                    type="button"
                    className={`rounded-full border px-3 py-2 text-[10px] uppercase tracking-[0.18em] ${
                      index === 0
                        ? "border-[#b89354] bg-[rgba(184,147,84,0.16)] text-[#eed7aa]"
                        : "border-[rgba(255,255,255,0.12)] bg-[rgba(255,255,255,0.04)] text-[#9ba6bb]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {mapPins.map((project, index) => {
                const isActive = project.name === activeProject?.name;

                return (
                  <button
                    key={project.name}
                    type="button"
                    onClick={() => setSelectedProject(project.name)}
                    className="absolute z-[5] -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${project.left}%`, top: `${project.top}%` }}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border text-[9px] font-medium transition-all duration-200 ${
                        isActive
                          ? "border-[#f5e1b7] bg-[#b89354] text-[#0f1726] shadow-[0_0_0_8px_rgba(184,147,84,0.18)]"
                          : "border-[rgba(255,255,255,0.6)] bg-[#20304d] text-white hover:border-[#f5e1b7] hover:bg-[#2b3c5f]"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </button>
                );
              })}

              {activeProject ? (
                <div className="absolute bottom-6 left-4 right-4 z-10 md:left-auto md:right-6 md:w-[340px]">
                  <div className="overflow-hidden rounded-[16px] border border-[rgba(255,255,255,0.08)] bg-[#fbfaf7] text-[#1c2438] shadow-[0_20px_50px_rgba(0,0,0,0.32)]">
                    <div className="relative aspect-[1.45/1] bg-[#d8d2c4]">
                      <Image fill src={activeProject.image} alt={activeProject.name} className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[rgba(12,18,31,0.92)] via-[rgba(12,18,31,0.38)] to-transparent p-4">
                        <div className="text-[10px] uppercase tracking-[0.22em] text-[#d7b77d]">
                          {activeProject.neighborhood}
                        </div>
                        <div
                          className="mt-1 text-[24px] font-normal leading-[1.08] text-white"
                          style={{ fontFamily: "var(--font-serif), serif" }}
                        >
                          {activeProject.name}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 border-b border-[#e7e0d5] px-4 py-4 text-center">
                      <div>
                        <div className="text-[18px] text-[#b89354]" style={{ fontFamily: "var(--font-serif), serif" }}>
                          {activeProject.price}
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8a90a0]">Price From</div>
                      </div>
                      <div>
                        <div className="text-[18px] text-[#1c2438]" style={{ fontFamily: "var(--font-serif), serif" }}>
                          2-5 BR
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8a90a0]">Residences</div>
                      </div>
                      <div>
                        <div className="text-[18px] text-[#1c2438]" style={{ fontFamily: "var(--font-serif), serif" }}>
                          2026
                        </div>
                        <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-[#8a90a0]">Delivery</div>
                      </div>
                    </div>

                    <div className="px-4 py-4">
                      <p className="m-0 text-[11px] uppercase tracking-[0.18em] text-[#b89354]">
                        {activeProject.status}
                      </p>
                      <div className="mt-4 flex gap-3">
                        <a href="#contact" className="inline-flex min-h-11 flex-1 items-center justify-center bg-[#121a2b] px-4 text-[10px] uppercase tracking-[0.24em] text-white">
                          Request Pricing
                        </a>
                        <a href="/" className="inline-flex min-h-11 flex-1 items-center justify-center border border-[#d8cfbf] px-4 text-[10px] uppercase tracking-[0.24em] text-[#1c2438]">
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
