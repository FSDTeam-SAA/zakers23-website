import Image from "next/image";
import type { Project } from "@/src/features/Home/FeaturedProject/types/featured-project.types";
type FeaturedProjectsSectionProps = { projects: Project[] };

export function FeaturedProjectsSection({ projects }: FeaturedProjectsSectionProps) {
  return (
    <section
      className="bg-[var(--sand)] px-5 py-14 md:px-7 md:py-[82px]"
      id="featured-projects"
    >
      <div className="mx-auto max-w-[1420px]">
        <div className="mb-5 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="mb-2 inline-block text-[9px] uppercase tracking-[0.24em] text-[#b79255]">
              Curated Selection
            </span>
            <h2
              className="m-0 text-[28px] font-normal tracking-[-0.015em] text-[var(--ink)] md:text-[34px]"
              style={{ fontFamily: "var(--font-serif), serif" }}
            >
              Featured Projects
            </h2>
          </div>
          <a
            className="inline-flex items-center gap-1.5 text-[9px] uppercase tracking-[0.22em] text-[#b79255] opacity-90 transition-all duration-200 hover:gap-2.5 hover:text-[#8d6731] focus:outline-none"
            href="#contact"
          >
            View All
            <span aria-hidden="true">→</span>
          </a>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3 xl:gap-2.5">
          {projects.map((project, index) => (
            <article
              key={project.name}
              className="translate-y-[18px] animate-[featuredFadeUp_0.72s_cubic-bezier(0.22,1,0.36,1)_forwards] opacity-0"
              style={{ animationDelay: `${index * 70}ms` }}
            >
              <a
                className="block overflow-hidden rounded-[3px] border border-[#cec7ba] bg-[#f3efe6] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#bbb19f] hover:shadow-[0_12px_24px_rgba(28,31,38,0.08)] focus:outline-none"
                href={project.slug ? `#${project.slug}` : "#contact"}
              >
                <div className="relative aspect-[0.765/1] overflow-hidden bg-[#d8d2c4]">
                  <Image
                    fill
                    src={project.image}
                    alt={project.name}
                    className="object-cover transition-transform duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] hover:scale-[1.035]"
                  />
                  <p className="absolute inset-x-0 top-0 m-0 overflow-hidden text-ellipsis whitespace-nowrap bg-[rgba(64,74,90,0.95)] px-2 py-[5px] text-[7px] leading-[1.25] uppercase tracking-[0.14em] text-[rgba(244,239,230,0.95)] max-md:whitespace-normal">
                    {project.status}
                  </p>
                </div>
                <div className="bg-[#f3efe6] px-3 pb-3.5 pt-2.5">
                  <span className="mb-2 block border-l border-[#b79255] pl-[7px] text-[8px] uppercase tracking-[0.18em] text-[#7f7a70]">
                    {project.neighborhood}
                  </span>
                  <h3
                    className="mb-1.5 text-[15px] leading-[1.22] font-normal tracking-[-0.012em] text-[var(--ink)] md:text-[17px] xl:text-[19px]"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {project.name}
                  </h3>
                  <p
                    className="m-0 text-[13px] font-normal text-[#b79255]"
                    style={{ fontFamily: "var(--font-serif), serif" }}
                  >
                    {project.price}
                  </p>
                </div>
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
