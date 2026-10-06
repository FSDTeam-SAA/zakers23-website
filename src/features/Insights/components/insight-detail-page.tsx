"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Ht } from "@/src/data/neighborhoods";
import { insightArticles } from "@/src/data/insights";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";

interface InsightDetailPageProps {
  slug: string;
}

export function InsightDetailPage({ slug }: InsightDetailPageProps) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 18);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Find the current article
  const article = insightArticles.find((a) => a.slug === slug);

  if (!article) {
    return (
      <main className="insights-page">
        <header className={isScrolled ? "site-header insights-header insights-header-scrolled" : "site-header insights-header"}>
          <Link href="/" className="logo-link" aria-label="Miami New Development home">
            <Image
              src="/images/logo.png"
              alt="Miami New Development"
              width={220}
              height={58}
              className="site-logo h-auto w-[68px] md:w-[76px]"
              priority
            />
          </Link>
          <nav className="nav-links" aria-label="Primary">
            <Link href="/map">
              <span className="insights-nav-link-label">Explore Map</span>
            </Link>
            <button type="button" className="insights-nav-button" onClick={() => setIsMatcherOpen(true)}>
              <span className="insights-nav-link-label">Find My Project</span>
            </button>
            <div className="relative group">
              <button
                type="button"
                className="nav-dropdown insights-nav-button flex items-center gap-1"
                onClick={() => router.push("/neighborhood")}
              >
                <span className="insights-nav-link-label">Neighborhoods</span>
                <span aria-hidden="true">⌄</span>
              </button>
              <div className="nav-dropdown-menu">
                {Object.entries(Ht).map(([slug, data]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      router.push(`/neighborhood/${slug}`);
                    }}
                    className="nav-dropdown-item"
                  >
                    {data.name}
                  </button>
                ))}
              </div>
            </div>
            <Link href="/waterfront">
              <span className="insights-nav-link-label">Waterfront Estates</span>
            </Link>
            <Link href="/insights" className="insights-nav-active">
              <span className="insights-nav-link-label">Insights</span>
            </Link>
          </nav>
        </header>

        <section className="insights-hero" style={{ textAlign: "center" }}>
          <div className="insights-shell">
            <h1>Article Not Found</h1>
            <p>The requested market intelligence report could not be found.</p>
            <div style={{ marginTop: 24 }}>
              <Link href="/insights" className="insights-header-inquire">
                <span className="insights-nav-link-label">Back to Insights</span>
              </Link>
            </div>
          </div>
        </section>
        <SiteFooter />
      </main>
    );
  }

  return (
    <main className="insights-page">
      <header className={isScrolled ? "site-header insights-header insights-header-scrolled" : "site-header insights-header"}>
        <Link href="/" className="logo-link" aria-label="Miami New Development home">
          <Image
            src="/images/logo.png"
            alt="Miami New Development"
            width={220}
            height={58}
            className="site-logo h-auto w-[68px] md:w-[76px]"
            priority
          />
        </Link>
        <nav className="nav-links" aria-label="Primary">
          <Link href="/map">
            <span className="insights-nav-link-label">Explore Map</span>
          </Link>
          <button type="button" className="insights-nav-button" onClick={() => setIsMatcherOpen(true)}>
            <span className="insights-nav-link-label">Find My Project</span>
          </button>
          <div className="relative group">
            <button
              type="button"
              className="nav-dropdown insights-nav-button flex items-center gap-1"
              onClick={() => router.push("/neighborhood")}
            >
              <span className="insights-nav-link-label">Neighborhoods</span>
              <span aria-hidden="true">⌄</span>
            </button>
            <div className="nav-dropdown-menu">
              {Object.entries(Ht).map(([slug, data]) => (
                <button
                  key={slug}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    router.push(`/neighborhood/${slug}`);
                  }}
                  className="nav-dropdown-item"
                >
                  {data.name}
                </button>
              ))}
            </div>
          </div>
          <Link href="/waterfront">
            <span className="insights-nav-link-label">Waterfront Estates</span>
          </Link>
          <Link href="/insights" className="insights-nav-active">
            <span className="insights-nav-link-label">Insights</span>
          </Link>
        </nav>
        <div className="insights-header-tools">
          <a
            href="#insights-briefing"
            onClick={(event) => {
              event.preventDefault();
              openInquiry();
            }}
            style={{ cursor: "pointer" }}
            className="insights-header-inquire"
          >
            <span className="insights-nav-link-label">Inquire</span>
          </a>
          <div className="insights-weather-widget" aria-label="Miami weather">
            <span className="insights-weather-icon" aria-hidden="true">
              ☁
            </span>
            <span className="insights-weather-temp">81°</span>
          </div>
        </div>
      </header>

      <div className="insight-detail-container">
        <Link href="/insights" className="insight-detail-back-link">
          <span>← All Insights</span>
        </Link>

        <div className="insight-detail-category-label">{article.category}</div>
        <h1 className="insight-detail-title">{article.title}</h1>
        
        <div className="insight-detail-meta">
          <span>{article.date}</span>
          <span>·</span>
          <span>{article.readTime}</span>
        </div>

        <div className="insight-detail-hero-wrap">
          <img
            src={article.heroImage}
            alt={article.title}
            className="insight-detail-hero-img"
          />
        </div>

        <div
          className="insight-detail-content"
          dangerouslySetInnerHTML={{ __html: article.content }}
        />
      </div>

      <section className="insights-briefing" id="insights-briefing">
        <div className="insights-shell insights-briefing-inner">
          <div className="insights-briefing-kicker">Exclusive Briefings</div>
          <h2>Receive Miami Market Intelligence</h2>
          <p>
            Zachary Akers&apos;s exclusive list receives pre-launch pricing, off-market inventory, and
            monthly market updates before anything reaches public channels.
          </p>
          <form className="insights-briefing-form">
            <input type="email" placeholder="Your email address" aria-label="Email address" />
            <button type="submit">Join</button>
          </form>
        </div>
      </section>

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
