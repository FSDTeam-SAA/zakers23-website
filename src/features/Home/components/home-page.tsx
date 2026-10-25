"use client";

import Image from "next/image";
import Link from "next/link";
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
import { Ht } from "@/src/data/neighborhoods";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { MobileNavMenu } from "@/src/components/MobileNavMenu";

export function HomePage({ initialProjects }: { initialProjects?: any[] }) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
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
        <div className="site-header-inner">
          <a className="brand" href="#top">
            <Image
              src="/images/mcs-symbol.svg"
              alt="Miami New Development"
              width={56}
              height={56}
              className="site-logo h-10 w-10 md:h-12 md:w-12 object-contain"
              priority
            />
          </a>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/map">Explore Map</Link>
            <Link href="/find-my-project">Find My Project</Link>
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
            <Link href="/waterfront">Waterfront Homes</Link>
            <Link href="/insights">Insights</Link>
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
          <MobileNavMenu onOpenMatcher={() => router.push("/find-my-project")} isLightHeader={isScrolled} />
        </div>
      </header>

      <HeroSection slides={heroSlides} />
      <FeaturedProjectsSection projects={featuredProjects} />
      <NewsletterSection />
      <AdvisorSection />
      <DiscoveryEngineSection
        projectNames={projectNames}
        featuredProjects={featuredProjects}
        initialProjects={initialProjects}
      />
      <TestimonialsSection testimonials={testimonials} />

      <SubscriberSection />
      <SiteFooter />
    </main>
  );
}
