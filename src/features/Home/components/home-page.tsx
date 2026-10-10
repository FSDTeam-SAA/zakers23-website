"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { heroSlides } from "@/src/features/Home/HeroSection/data/hero-section.data";
import { featuredProjects } from "@/src/features/Home/FeaturedProject/data/featured-project.data";
import { projectNames } from "@/src/features/Home/DiscoveryEngine/data/discovery-engine.data";
import { testimonials } from "@/src/features/Home/Testimonials/data/testimonials.data";
import { HeroSection } from "@/src/features/Home/HeroSection/componets/hero-section";
import { FeaturedProjectsSection } from "@/src/features/Home/FeaturedProject/components/featured-projects-section";
import { AdvisorSection } from "@/src/features/Home/components/advisor-section";
import { DiscoveryEngineSection } from "@/src/features/Home/DiscoveryEngine/components/discovery-engine-section";
import { TestimonialsSection } from "@/src/features/Home/Testimonials/components/testimonials-section";
import { NewsletterSection } from "@/src/features/Home/components/newsletter-section";
import { SubscriberSection } from "@/src/features/Home/components/subscriber-section";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { Ht } from "@/src/data/neighborhoods";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

export function HomePage() {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <main className="page-shell">
      <header className={`site-header ${isScrolled ? "site-header-scrolled" : ""}`}>
        <div className="site-header-inner">
          <a className="brand" href="#top">
            <Image
              src="/images/logo.png"
              alt="Miami New Development"
              width={220}
              height={58}
              className="site-logo h-auto w-[68px] md:w-[76px]"
              priority
            />
          </a>
          <nav className="nav-links" aria-label="Primary">
            <a href="/map">Explore Map</a>
            <a
              href="#contact"
              onClick={(e) => {
                e.preventDefault();
                setIsMatcherOpen(true);
              }}
            >
              Find My Project
            </a>
            <div className="relative group">
              <button
                type="button"
                className="nav-dropdown flex items-center gap-1"
                onClick={() => router.push("/neighborhood")}
              >
                Neighborhoods
                <span aria-hidden="true">⌄</span>
              </button>
              <div className="nav-dropdown-menu">
                {Object.entries(Ht).map(([slug, data]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/neighborhood/${slug}`);
                    }}
                    className="nav-dropdown-item"
                  >
                    {data.name}
                  </button>
                ))}
              </div>
            </div>
            <a href="/waterfront">Waterfront Homes</a>
            <a href="/insights">Insights</a>
            <a
              href="#contact"
              onClick={(event) => {
                event.preventDefault();
                openInquiry();
              }}
              className="nav-inquire-btn"
            >
              Inquire
            </a>
          </nav>
        </div>
      </header>

      <HeroSection slides={heroSlides} />
      <FeaturedProjectsSection projects={featuredProjects} />
      <NewsletterSection />
      <AdvisorSection />
      <DiscoveryEngineSection
        projectNames={projectNames}
        featuredProjects={featuredProjects}
      />
      <TestimonialsSection testimonials={testimonials} />

      <SubscriberSection />
      <SiteFooter />

      {isMatcherOpen && (
        <FindMyProjectModal
          onClose={() => setIsMatcherOpen(false)}
          onDone={(results) => {
            setIsMatcherOpen(false);
            localStorage.setItem("map-matcher-prefs", JSON.stringify(results.prefs));
            router.push("/map");
          }}
        />
      )}
    </main>
  );
}
