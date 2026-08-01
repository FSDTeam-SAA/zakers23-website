"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
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

export function HomePage() {
  const [isScrolled, setIsScrolled] = useState(false);

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
        <a className="brand" href="#top">
          <Image
            src="/images/logo.png"
            alt="Miami New Development"
            width={220}
            height={58}
            className="site-logo h-auto w-[82px] md:w-[96px]"
            priority
          />
        </a>
        <nav className="nav-links" aria-label="Primary">
          <a href="/map">Explore Map</a>
          <a href="#contact">Find My Project</a>
          <button type="button" className="nav-dropdown">
            Neighborhoods
            <span aria-hidden="true">⌄</span>
          </button>
          <a href="#advisor">Waterfront Estates</a>
          <a href="#reputation">Insights</a>
          <span className="nav-divider" aria-hidden="true">
            ·
          </span>
          <a href="#contact">Inquire</a>
        </nav>
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
    </main>
  );
}
