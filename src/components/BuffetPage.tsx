import { ASSETS, BUFFET_SECTIONS, SITE_INFO } from "../data/site";
import {
  DrawGoldLine,
  MagneticButton,
  MaskImageReveal,
  RevealBlock,
} from "../lib/animations";
import { SafeImage } from "./SafeImage";

interface BuffetPageProps {
  onOpenReserve: () => void;
}

export function BuffetPage({ onOpenReserve }: BuffetPageProps) {
  return (
    <div className="pt-24 md:pt-32 pb-24 bg-[#10110F] text-[#FFF9F1] min-h-screen">
      <div className="luxury-container space-y-12">
        <RevealBlock className="max-w-3xl space-y-3 pb-6 border-b border-[#D9B780]/20">
          <DrawGoldLine className="w-14" origin="left" />
          <p className="text-[0.72rem] tracking-[0.22em] uppercase text-[#D9B780] font-medium">
            {SITE_INFO.buffetLabel}
          </p>
          <h1
            className="font-display font-normal leading-[1.04]"
            style={{ fontSize: "clamp(2.25rem, 4.2vw, 3.9rem)" }}
          >
            Friday &amp; Weekend <em className="italic text-[#D9B780]">Buffet</em>
          </h1>
          <p className="text-[0.95rem] leading-relaxed text-[#F7F2E9]/85">
            Served during lunch hours (11:30 AM – 3:00 PM) featuring steaming saffron
            dum biryanis, rotating regional curries, street chaat, freshly baked naan
            to the table, and Indian sweets.
          </p>
        </RevealBlock>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-5">
            <MaskImageReveal className="bg-[#12352B]">
              <SafeImage
                src={ASSETS.buffetSpread}
                alt="Marble and brass buffet counter at Deccan Spice Pompano"
                loading="eager"
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="w-full aspect-[3/4] object-cover"
              />
            </MaskImageReveal>
            <div className="p-6 bg-[#12352B] border border-[#D9B780]/30 space-y-3">
              <h2 className="font-display text-xl text-[#D9B780]">
                Lunch Buffet Hours
              </h2>
              <p className="text-[0.86rem] text-[#FFF9F1]/85 tabular-nums">
                Friday, Saturday &amp; Sunday · 11:30 AM – 3:00 PM
              </p>
              <MagneticButton
                onClick={onOpenReserve}
                className="w-full py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
              >
                Reserve Buffet Table
              </MagneticButton>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-8">
            {BUFFET_SECTIONS.map((section, idx) => (
              <RevealBlock key={section.title} delay={0.07 * idx} className="space-y-3">
                <h2 className="font-display text-2xl text-[#D9B780] pb-2 border-b border-[#D9B780]/30">
                  {section.title}
                </h2>
                <ul className="divide-y divide-[#D9B780]/15">
                  {section.items.map((item) => (
                    <li
                      key={item.name}
                      className="py-3.5 flex flex-col sm:flex-row sm:items-baseline justify-between gap-1"
                    >
                      <span className="font-medium text-[0.95rem] text-[#FFF9F1]">
                        {item.name}
                      </span>
                      <span className="text-[0.82rem] text-[#F7F2E9]/75">
                        {item.note}
                      </span>
                    </li>
                  ))}
                </ul>
              </RevealBlock>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
