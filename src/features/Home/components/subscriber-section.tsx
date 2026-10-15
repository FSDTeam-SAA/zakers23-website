"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/src/lib/inquiry";
import { toast } from "sonner";
import { HoneypotField } from "@/src/components/HoneypotField";

export function SubscriberSection() {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      toast.error("Please enter a valid email address.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      await subscribeNewsletter(trimmed, "newsletter_signup", { website: honeypot });
      setStatus("success");
      setEmail("");
      setHoneypot("");
      toast.success("Subscribed successfully! You'll receive Miami market notes.");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unable to subscribe. Please try again.";
      setStatus("error");
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  return (
    <section className="bg-[var(--sand)]">
      <div className="bg-[#232943] px-5 py-11 md:px-8 lg:px-12 xl:px-[355px]">
        <div className="mx-auto flex max-w-[1210px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="mb-2 inline-block text-[12px] uppercase tracking-[0.34em] text-[#bb9150]">
              Keep In Touch
            </span>
            <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#8890a5]">
              Occasional notes on Miami&apos;s new development market.
            </p>
          </div>

          <div className="w-full max-w-[380px]">
            {status === "success" ? (
              <div className="flex items-center justify-between gap-3 border-b border-[#bb9150]/40 pb-2 pt-1 text-[13px] text-[#bb9150]">
                <span className="flex items-center gap-2">
                  <span aria-hidden="true" className="text-base">✓</span>
                  Thank you for joining our market notes.
                </span>
                <button
                  type="button"
                  onClick={() => setStatus("idle")}
                  className="inline-flex min-h-[44px] items-center text-[12px] uppercase tracking-wider text-[#d7dbe4]/60 hover:text-[#d7dbe4] transition-colors"
                >
                  Reset
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex w-full items-center gap-5">
                <HoneypotField value={honeypot} onChange={setHoneypot} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "error") setStatus("idle");
                  }}
                  disabled={status === "loading"}
                  placeholder="Your email address"
                  aria-label="Email address"
                  required
                  className="min-w-0 flex-1 border-0 border-b border-[rgba(131,138,158,0.45)] bg-transparent px-0 pb-2 pt-1 text-[16px] leading-none text-[#d7dbe4] outline-none placeholder:text-[#9aa1b2] focus:border-[#bb9150] transition-colors disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="inline-flex min-h-[44px] shrink-0 items-center justify-center px-2 gap-1.5 text-[12px] uppercase tracking-[0.3em] text-[#bb9150] transition-colors duration-200 hover:text-[#d4aa69] focus:outline-none disabled:opacity-50"
                >
                  {status === "loading" ? "Joining..." : "Join"}
                  {status !== "loading" && <span aria-hidden="true">→</span>}
                </button>
              </form>
            )}
            {status === "error" && (
              <p className="mt-2 text-[13px] text-[#e06c75]">{errorMessage}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
