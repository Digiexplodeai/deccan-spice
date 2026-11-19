import { useAnimationSystem } from "../lib/animations";

const MARQUEE_PHRASES = [
  "AUTHENTIC INDIAN CUISINE",
  "HYDERABADI TRADITIONS",
  "EXCEPTIONAL HOSPITALITY",
  "POMPANO BEACH",
];

export function BrandStrip() {
  const { reducedMotion } = useAnimationSystem();

  if (reducedMotion) {
    return (
      <section
        aria-label="Culinary Heritage Highlights"
        className="bg-[#12352B]/65 border-y border-[#D9B780]/25 py-3.5 px-4 text-center"
      >
        <p className="text-[0.7rem] md:text-[0.74rem] tracking-[0.22em] uppercase text-[#FFF9F1]/90 font-medium">
          {MARQUEE_PHRASES.join("  ✦  ")}
        </p>
      </section>
    );
  }

  return (
    <section
      aria-label="Culinary Heritage Highlights"
      className="marquee-wrapper bg-[#12352B]/55 border-y border-[#D9B780]/25 py-3.5 overflow-hidden select-none"
      tabIndex={0}
    >
      <div className="marquee-track items-center text-[0.7rem] md:text-[0.74rem] tracking-[0.24em] uppercase text-[#FFF9F1]/90 font-medium">
        {[0, 1].map((dupIndex) => (
          <div
            key={dupIndex}
            aria-hidden={dupIndex === 1}
            className="flex items-center shrink-0"
          >
            {MARQUEE_PHRASES.map((phrase) => (
              <span key={`${dupIndex}-${phrase}`} className="inline-flex items-center">
                <span className="px-5 md:px-7 whitespace-nowrap">{phrase}</span>
                <span className="text-[#D9B780]" aria-hidden="true">
                  ✦
                </span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
