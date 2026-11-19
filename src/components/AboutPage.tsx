import { ASSETS, SITE_INFO } from "../data/site";
import {
  DrawGoldLine,
  MagneticButton,
  MaskImageReveal,
  RevealBlock,
} from "../lib/animations";
import { SafeImage } from "./SafeImage";
import { useCMS } from "../lib/cmsContext";
import type { RouteId } from "./Navbar";

interface AboutPageProps {
  onNavigate: (route: RouteId) => void;
  onOpenReserve: () => void;
}

export function AboutPage({ onNavigate, onOpenReserve }: AboutPageProps) {
  const { settings, sections } = useCMS();
  const storySec = sections.story;
  const restaurantName = settings.restaurant_name || SITE_INFO.name;
  const centerName = settings.center || SITE_INFO.center;

  return (
    <div className="pt-24 md:pt-32 pb-24 bg-[#10110F] text-[#FFF9F1] min-h-screen">
      <div className="luxury-container space-y-14 md:space-y-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center pb-12 border-b border-[#D9B780]/20">
          <RevealBlock className="lg:col-span-6 space-y-5">
            <DrawGoldLine className="w-14" origin="left" />
            <p className="text-[0.72rem] tracking-[0.22em] uppercase text-[#D9B780] font-medium">
              {storySec?.eyebrow || "Our Heritage · Pompano Beach"}
            </p>
            <h1
              className="font-display font-normal leading-[1.04]"
              style={{ fontSize: "clamp(2.25rem, 4.5vw, 4.1rem)" }}
            >
              {storySec?.title || "From the Deccan Plateau to"}{" "}
              <em className="italic text-[#D9B780]">{storySec?.subtitle || "South Florida"}</em>
            </h1>
            <p className="text-[0.96rem] leading-[1.7] text-[#F7F2E9]/85">
              {storySec?.body ||
                `${restaurantName} brings centuries-old Hyderabadi and South Indian culinary technique to ${centerName}. From whole-spice blends roasted each morning to sealed-pot dum biryanis and clay-oven tandoor platters, every dish balances warmth, aroma, and craft.`}
            </p>
            <div className="pt-2 flex flex-wrap gap-3.5">
              <MagneticButton
                onClick={onOpenReserve}
                className="px-6 py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
              >
                {storySec?.button_text || "Reserve a Table"}
              </MagneticButton>
              <button
                type="button"
                onClick={() => onNavigate("menu")}
                className="px-6 py-3 border border-[#D9B780]/55 text-[#FFF9F1] hover:bg-[#D9B780] hover:text-[#10110F] text-[0.78rem] font-medium tracking-[0.1em] uppercase transition-colors min-h-[44px]"
              >
                Explore Menu
              </button>
            </div>
          </RevealBlock>

          <MaskImageReveal className="lg:col-span-6 bg-[#12352B]">
            <SafeImage
              src={storySec?.image_url || ASSETS.craftCocktails}
              alt={storySec?.image_alt || "Signature spiced cocktails at the Deccan Spice bar"}
              loading="eager"
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="w-full aspect-[4/3] object-cover"
            />
          </MaskImageReveal>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <RevealBlock
            delay={0}
            className="p-6 md:p-8 bg-[#1D1712]/65 border border-[#D9B780]/22 space-y-2.5"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-[#D9B780]">
              01 · Dum Cooking
            </p>
            <h2 className="font-display text-2xl text-[#FFF9F1]">
              Sealed-Pot Biryanis
            </h2>
            <p className="text-[0.88rem] leading-relaxed text-[#F7F2E9]/80">
              Aged saffron basmati layered with spiced cuts, caramelized shallots, and
              mint—steamed gently under a sealed lid so every grain holds aroma.
            </p>
          </RevealBlock>

          <RevealBlock
            delay={0.08}
            className="p-6 md:p-8 bg-[#1D1712]/65 border border-[#D9B780]/22 space-y-2.5"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-[#D9B780]">
              02 · Clay Tandoor
            </p>
            <h2 className="font-display text-2xl text-[#FFF9F1]">
              Charred Sizzlers &amp; Naan
            </h2>
            <p className="text-[0.88rem] leading-relaxed text-[#F7F2E9]/80">
              High-heat charcoal tandoor ovens blister garlic naan to order and sear
              yogurt-marinated lamb chops and prawns over glowing embers.
            </p>
          </RevealBlock>

          <RevealBlock
            delay={0.16}
            className="p-6 md:p-8 bg-[#1D1712]/65 border border-[#D9B780]/22 space-y-2.5"
          >
            <p className="text-[0.72rem] uppercase tracking-[0.14em] font-medium text-[#D9B780]">
              03 · Full Bar
            </p>
            <h2 className="font-display text-2xl text-[#FFF9F1]">
              Pompano Hospitality
            </h2>
            <p className="text-[0.88rem] leading-relaxed text-[#F7F2E9]/80">
              Our dining room and bar pair regional Indian cuisine with spiced craft
              cocktails, fine wines, and warm table service seven days a week.
            </p>
          </RevealBlock>
        </div>
      </div>
    </div>
  );
}
