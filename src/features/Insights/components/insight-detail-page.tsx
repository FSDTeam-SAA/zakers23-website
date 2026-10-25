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
import { subscribeNewsletter } from "@/src/lib/inquiry";
import { toast } from "sonner";
import { HoneypotField } from "@/src/components/HoneypotField";
import MobileNavMenu from "@/src/components/MobileNavMenu";

interface InsightDetailPageProps {
  slug: string;
}

export function InsightDetailPage({ slug }: InsightDetailPageProps) {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [isMatcherOpen, setIsMatcherOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterHoneypot, setNewsletterHoneypot] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterError, setNewsletterError] = useState("");

  const handleNewsletterSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = newsletterEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setNewsletterStatus("error");
      setNewsletterError("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }
    setNewsletterStatus("loading");
    setNewsletterError("");
    try {
      await subscribeNewsletter(trimmed, "newsletter_signup", { website: newsletterHoneypot });
      setNewsletterStatus("success");
      setNewsletterEmail("");
      setNewsletterHoneypot("");
      toast.success("Subscribed to market briefings successfully!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to subscribe. Please try again.";
      setNewsletterStatus("error");
      setNewsletterError(msg);
      toast.error(msg);
    }
  };

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
              src="/images/mcs-symbol.svg"
              alt="Miami New Development"
              width={56}
              height={56}
              className="site-logo h-10 w-10 md:h-12 md:w-12 object-contain"
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
              <span className="insights-nav-link-label">Waterfront Homes</span>
            </Link>
            <Link href="/insights" className="insights-nav-active">
              <span className="insights-nav-link-label">Insights</span>
            </Link>
          </nav>
          <MobileNavMenu onOpenMatcher={() => setIsMatcherOpen(true)} isLightHeader={true} />
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
            src="/images/mcs-symbol.svg"
            alt="Miami New Development"
            width={56}
            height={56}
            className="site-logo h-10 w-10 md:h-12 md:w-12 object-contain"
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
            <span className="insights-nav-link-label">Waterfront Homes</span>
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
        <MobileNavMenu onOpenMatcher={() => setIsMatcherOpen(true)} isLightHeader={true} />
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
          {newsletterStatus === "success" ? (
            <div className="flex items-center justify-center gap-3 pt-6 text-[13px] text-[#bb9150]">
              <span aria-hidden="true">✓</span>
              <span>Thank you for subscribing to market briefings.</span>
              <button
                type="button"
                onClick={() => setNewsletterStatus("idle")}
                className="ml-2 inline-flex min-h-[44px] items-center text-[12px] uppercase tracking-wider text-white/50 hover:text-white transition-colors"
              >
                Reset
              </button>
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="insights-briefing-form">
              <HoneypotField value={newsletterHoneypot} onChange={setNewsletterHoneypot} />
              <input
                type="email"
                value={newsletterEmail}
                onChange={(e) => {
                  setNewsletterEmail(e.target.value);
                  if (newsletterStatus === "error") setNewsletterStatus("idle");
                }}
                disabled={newsletterStatus === "loading"}
                placeholder="Your email address"
                aria-label="Email address"
                required
              />
              <button type="submit" disabled={newsletterStatus === "loading"}>
                {newsletterStatus === "loading" ? "Joining..." : "Join"}
              </button>
            </form>
          )}
          {newsletterStatus === "error" && (
            <p className="mt-3 text-[13px] text-[#e06c75]">{newsletterError}</p>
          )}
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
