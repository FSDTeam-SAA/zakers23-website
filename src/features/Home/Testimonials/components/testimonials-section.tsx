import type { Testimonial } from "@/src/features/Home/Testimonials/types/testimonials.types";

type TestimonialsSectionProps = {
  testimonials: Testimonial[];
};

export function TestimonialsSection({ testimonials }: TestimonialsSectionProps) {
  return (
    <section className="bg-[var(--sand)] px-5 py-14 md:px-7 md:py-20" id="reputation">
      <div className="mx-auto max-w-[1160px] rounded-[18px] bg-[#f4efe5] px-6 py-5 md:px-7 md:py-5">
        <div className="mb-5">
          <span className="mb-1.5 inline-block text-[10px] uppercase tracking-[0.32em] text-[#b89354]">
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
                <span className="text-[14px] leading-none text-[#b2ab9e]">◻</span>
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
