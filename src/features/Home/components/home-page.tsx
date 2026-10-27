"use client";


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
import { Navbar } from "@/src/components/Navbar";

export function HomePage({ initialProjects }: { initialProjects?: any[] }) {
  return (
    <main className="page-shell">
      <Navbar variant="transparent" />

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
