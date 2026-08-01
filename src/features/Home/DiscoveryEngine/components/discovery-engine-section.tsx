"use client";

import { useState } from "react";
import type { Project } from "@/src/features/Home/FeaturedProject/types/featured-project.types";

type DiscoveryEngineSectionProps = {
  projectNames: string[];
  featuredProjects: Project[];
};

export function DiscoveryEngineSection({
  projectNames,
  featuredProjects
}: DiscoveryEngineSectionProps) {
  const [location, setLocation] = useState(50);
  const [wellness, setWellness] = useState(50);
  const [budget, setBudget] = useState([500, 30000]);

  return (
    <section className="section section-dark" id="discovery-engine">
      <div className="section-header section-header-dark">
        <span className="eyebrow">Discovery Engine</span>
        <h2>
          Find your <em>home</em>.
        </h2>
        <p>
          Three dimensions surface the projects that fit. Move the controls to refine — matches
          update live.
        </p>
      </div>

      <div className="discovery-index">
        {projectNames.map((name) => (
          <a key={name} href="/map">
            {name}
          </a>
        ))}
      </div>

      <div className="discovery-layout">
        <div className="sliders">
          <label className="slider-block">
            <span className="slider-label">Location</span>
            <span className="slider-description">Quiet enclave vs. urban core</span>
            <input
              type="range"
              min="0"
              max="100"
              value={location}
              onChange={(event) => setLocation(Number(event.target.value))}
            />
          </label>

          <label className="slider-block">
            <span className="slider-label">Health &amp; Wellness</span>
            <span className="slider-description">
              Standard amenities vs. wellness-led programming
            </span>
            <input
              type="range"
              min="0"
              max="100"
              value={wellness}
              onChange={(event) => setWellness(Number(event.target.value))}
            />
          </label>

          <div className="slider-block">
            <div className="budget-head">
              <span className="slider-label">Price Band</span>
              <strong>
                ${budget[0]}K - ${budget[1] >= 30000 ? "30M+" : `${(budget[1] / 1000).toFixed(1)}M`}
              </strong>
            </div>
            <input
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
            <div className="budget-presets">
              {["Under $1M", "$1M-$3M", "$3M-$10M", "$10M+"].map((label) => (
                <button key={label} type="button">
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="match-panel">
          <div className="match-header">
            <span>Top Matches</span>
            <span>Live · 3 of 56</span>
          </div>
          {featuredProjects.map((project, index) => (
            <article
              key={project.name}
              className={`match-card ${index === 0 ? "is-highlighted" : ""}`}
            >
              <div className="match-rank">{index + 1}</div>
              <div className="match-copy">
                <span>{project.neighborhood}</span>
                <strong>{project.name}</strong>
              </div>
              <div className="match-score">{98 - index * 7}</div>
            </article>
          ))}
        </aside>
      </div>
    </section>
  );
}
