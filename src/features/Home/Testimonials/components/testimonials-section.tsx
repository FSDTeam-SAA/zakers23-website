import type { Testimonial } from "@/src/features/Home/Testimonials/types/testimonials.types";

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="bg-[var(--sand)] px-5 py-14 md:px-7 md:py-20" id="reputation">
      <div className="mx-auto max-w-[1160px] rounded-[18px] bg-[#f4efe5] px-6 py-5 md:px-7 md:py-5">
        <div className="mb-5">
          <span className="mb-1.5 inline-block text-[12px] uppercase tracking-[0.32em] text-[#b89354]">
            Client Feedback
          </span>
          <h2
            className="m-0 text-[30px] font-normal leading-none tracking-[-0.02em] text-[#192335] md:text-[42px]"
            style={{ fontFamily: "var(--font-serif), serif" }}
          >
            Market <em className="italic">Reputation</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {testimonials.map((testimonial, index) => (
            <article
              key={testimonial.name}
              className={`rounded-[12px] bg-white px-5 py-5 text-[#192335] shadow-[0_0_0_1px_rgba(220,214,203,0.7)] ${
                index === 0 ? "md:col-span-2 md:px-6 md:py-5" : ""
              }`}
            >
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="text-[13px] tracking-[0.18em] text-[#c6922f]">★★★★★</div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-[#b2ab9e]/70" aria-hidden="true">
                  <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                </svg>
              </div>

              <blockquote
                className={`m-0 border-b border-[#ddd8cd] pb-4 italic text-[#1d2740] ${
                  index === 0
                    ? "text-[17px] leading-[1.55] md:text-[18px]"
                    : "text-[15px] leading-[1.55] md:text-[16px]"
                }`}
              >
                “{testimonial.quote}”
              </blockquote>

              <div className="pt-4">
                <div className="flex flex-col gap-1 md:flex-row md:flex-wrap md:items-center md:gap-3">
                  <strong className="text-[12px] uppercase tracking-[0.18em] text-[#1c2438]">
                    {testimonial.name}
                  </strong>
                  <span className="text-[13px] leading-[1.5] text-[#6f7485]">
                    {testimonial.details}
                  </span>
                </div>

                <div className="mt-2 flex flex-col gap-2 text-[12px] uppercase tracking-[0.14em] text-[#c6922f] md:flex-row md:items-center md:justify-between">
                  <span>{testimonial.close}</span>
                  <span className="text-[#9ca2b1]">{testimonial.date}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
