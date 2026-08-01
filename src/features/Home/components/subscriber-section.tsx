export function SubscriberSection() {
  return (
    <section className="bg-[var(--sand)]">
      <div className="bg-[#232943] px-5 py-11 md:px-8 lg:px-12 xl:px-[355px]">
        <div className="mx-auto flex max-w-[1210px] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <span className="mb-2 inline-block text-[10px] uppercase tracking-[0.34em] text-[#bb9150]">
              Keep In Touch
            </span>
            <p className="m-0 text-[16px] font-normal leading-[1.45] text-[#8890a5]">
              Occasional notes on Miami&apos;s new development market.
            </p>
          </div>

          <form className="flex w-full max-w-[380px] items-center gap-5">
            <input
              type="email"
              placeholder="Your email address"
              aria-label="Email address"
              className="min-w-0 flex-1 border-0 border-b border-[rgba(131,138,158,0.45)] bg-transparent px-0 pb-2 pt-1 text-[13px] leading-none text-[#d7dbe4] outline-none placeholder:text-[#9aa1b2]"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1.5 text-[11px] uppercase tracking-[0.3em] text-[#bb9150] transition-colors duration-200 hover:text-[#d4aa69] focus:outline-none"
            >
              Join
              <span aria-hidden="true">→</span>
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
