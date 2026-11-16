"use client";

import Link from "next/link";
import { Navbar } from "@/src/components/Navbar";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

type RelatedLink = { href: string; label: string; detail: string };

export function EditorialLandingPage({
  eyebrow,
  title,
  introduction,
  sections,
  related,
  cta,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  sections: Array<{ title: string; copy: string }>;
  related: RelatedLink[];
  cta: string;
}) {
  const { openInquiry } = useInquiry();
  return (
    <main className="min-h-screen bg-[#f8f6f1] text-[#182235]">
      <Navbar variant="dark" projectName={title} />
      <section className="bg-[#162738] px-6 pb-20 pt-36 text-white md:pb-28">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs uppercase tracking-[.32em] text-[#d6b36e]">{eyebrow}</p>
          <h1 className="mt-5 max-w-4xl font-serif text-5xl font-normal leading-[.98] md:text-7xl">{title}</h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-white/80">{introduction}</p>
          <button onClick={() => openInquiry({ context: title, projectName: title, buttonClicked: cta })} className="mt-9 min-h-[48px] bg-[#c19a55] px-7 text-xs font-semibold uppercase tracking-[.16em] hover:bg-[#ad8848]">{cta}</button>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-10 px-6 py-20 md:grid-cols-2">
        {sections.map((section) => <article key={section.title} className="border-t border-[#d8d1c5] pt-5"><h2 className="font-serif text-3xl font-normal">{section.title}</h2><p className="mt-4 leading-8 text-[#535862]">{section.copy}</p></article>)}
      </section>
      <section className="border-y border-[#ddd8cd] bg-white px-6 py-16"><div className="mx-auto max-w-5xl"><p className="text-xs uppercase tracking-[.28em] text-[#a87b31]">Explore the collection</p><div className="mt-6 grid gap-4 md:grid-cols-3">{related.map((item) => <Link href={item.href} key={item.href} className="border border-[#ddd8cd] p-6 transition hover:border-[#b58e49]"><h2 className="font-serif text-2xl">{item.label}</h2><p className="mt-2 text-sm leading-6 text-[#535862]">{item.detail}</p><span className="mt-5 inline-block text-xs uppercase tracking-wider text-[#9d7532]">View project →</span></Link>)}</div></div></section>
      <section className="px-6 py-20 text-center"><h2 className="font-serif text-4xl">Private guidance, current information.</h2><p className="mx-auto mt-4 max-w-xl leading-7 text-[#535862]">Request a private presentation, current availability and the latest developer materials.</p><button onClick={() => openInquiry({ context: title, projectName: title, buttonClicked: cta })} className="mt-7 min-h-[48px] bg-[#182235] px-7 text-xs font-semibold uppercase tracking-[.16em] text-white hover:bg-[#a87b31]">{cta}</button></section>
      <SiteFooter />
    </main>
  );
}
