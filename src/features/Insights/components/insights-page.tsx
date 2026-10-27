"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Ht } from "@/src/data/neighborhoods";
import { InsightCategory, insightArticles, insightCategories } from "@/src/data/insights";
import FindMyProjectModal from "@/src/features/FindMyProject/components/FindMyProjectModal";
import { SiteFooter } from "@/src/features/Home/components/site-footer";
import { useInquiry } from "@/src/features/inquiry/components/inquiry-provider";
import { subscribeNewsletter } from "@/src/lib/inquiry";
import { toast } from "sonner";
import { HoneypotField } from "@/src/components/HoneypotField";
import MobileNavMenu from "@/src/components/MobileNavMenu";
import { Navbar } from "@/src/components/Navbar";

export function InsightsPage() {
  const router = useRouter();
  const { openInquiry } = useInquiry();
  const [activeCategory, setActiveCategory] = useState<InsightCategory>("All");
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

  const filteredArticles = useMemo(() => {
    if (activeCategory === "All") return insightArticles;
    return insightArticles.filter((article) => article.category === activeCategory);
  }, [activeCategory]);

  return (
    <main className="insights-page">
      {/* Unified Navbar */}
      <Navbar variant="light" inquiryContext="Market Insights" />

      <section className="insights-hero">
        <div className="insights-shell">
          <div className="insights-kicker">Market Intelligence · Miami New Development</div>
          <h1>
            New Construction
            <br />
            <em>Intelligence</em>
          </h1>
          <p>
            Pre-construction analysis, neighborhood intelligence, and buyer guides updated
            regularly.
          </p>
        </div>
      </section>

      <section className="insights-filter-row">
        <div className="insights-shell">
          <div className="insights-filter-tabs" role="tablist" aria-label="Filter by category">
            {insightCategories.map((category) => {
              const active = category === activeCategory;
              return (
                <button
                  key={category}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={active ? "insights-filter-tab is-active" : "insights-filter-tab"}
                  onClick={() => setActiveCategory(category)}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      <section className="insights-grid-section">
        <div className="insights-shell insights-editorial-grid">
          {filteredArticles.map((article, index) => (
            <Link
              key={article.slug}
              href={`/insights/${article.slug}`}
              className="insights-editorial-card"
            >
              <div className="insights-editorial-img-wrap">
                <img
                  className="insights-editorial-img"
                  src={article.heroImage}
                  alt={article.title}
                  loading={index === 0 ? "eager" : "lazy"}
                />
              </div>
              <div className="insights-editorial-card-body">
                <div className="insights-editorial-category">{article.category}</div>
                <h2 className="insights-editorial-title">{article.title}</h2>
                <p className="insights-editorial-excerpt">{article.excerpt}</p>
                <div className="insights-editorial-meta">
                  <span>{article.date}</span>
                  <span>{article.readTime}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
