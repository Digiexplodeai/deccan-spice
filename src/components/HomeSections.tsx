import { useEffect, useRef, useState, type TouchEvent } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronLeft, ChevronRight, Phone, Star, X } from "lucide-react";
import {
  ASSETS,
  GALLERY_ITEMS,
  SIGNATURE_SHOWCASE,
  SITE_INFO,
  type GalleryPhoto,
} from "../data/site";
import { BrandStrip } from "./BrandStrip";
import { SafeImage } from "./SafeImage";
import {
  DrawGoldLine,
  MagneticButton,
  MaskImageReveal,
  RevealBlock,
  useAnimationSystem,
} from "../lib/animations";
import { useCMS } from "../lib/cmsContext";
import type { RouteId } from "./Navbar";

gsap.registerPlugin(ScrollTrigger);

interface HomeSectionsProps {
  introReady: boolean;
  onNavigate: (route: RouteId) => void;
  onOpenReserve: () => void;
}

export function HomeSections({
  introReady,
  onNavigate,
  onOpenReserve,
}: HomeSectionsProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const heroParallaxRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const lightboxTouchX = useRef<number | null>(null);

  const { reducedMotion, refreshScrollTriggers } = useAnimationSystem();

  const [activeDish, setActiveDish] = useState(0);
  const [dishDirection, setDishDirection] = useState(1);
  const [activeReview, setActiveReview] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const { settings, sections, signatureDishes, gallery, reviews } = useCMS();

  // Signature Dishes from CMS or fallback
  const showcaseDishes = signatureDishes.length > 0
    ? signatureDishes.map((d) => ({
        id: d.id,
        name: d.name,
        course: d.course,
        priceLabel: d.price_label,
        tagline: d.tagline || d.description || "",
        image: d.image_url,
        moodBg:
          d.mood_bg ||
          "radial-gradient(circle at 65% 42%, rgba(217,183,128,0.16), rgba(16,17,15,0.7) 52%, #10110F 88%)",
      }))
    : SIGNATURE_SHOWCASE;

  // Unique gallery exhibition tiles from CMS or fallback
  const exhibitionPhotos: GalleryPhoto[] =
    gallery.length >= 3
      ? gallery.slice(0, 3).map((g) => ({
          id: g.id,
          title: g.title,
          category: (g.category as any) || "The Restaurant",
          caption: g.caption || "",
          image: g.image_url,
        }))
      : [
          GALLERY_ITEMS[0], // Marble & Brass Buffet Counter
          GALLERY_ITEMS[1], // Spiced Craft Cocktails at the Bar
          GALLERY_ITEMS[2], // Saffron Cardamom Gulab Jamun
        ];

  // Reviews from CMS or fallback
  const reviewsList =
    reviews.length > 0
      ? reviews.map((r) => ({
          platform: r.source,
          score: r.rating,
          detail: r.detail || "Verified diner rating",
          summary: r.text,
        }))
      : SITE_INFO.ratings;

  // 1. Coordinated Hero Cinematic Opening Sequence (synchronized with BrandIntro completion)
  useEffect(() => {
    if (!introReady || !rootRef.current) return;
    if (reducedMotion) return;

    let done = false;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "power3.out" },
        onComplete: () => {
          done = true;
        },
      });

      tl.fromTo(
        ".hero-bg-reveal",
        { scale: 1.09, opacity: 0.25 },
        { scale: 1, opacity: 1, duration: 1.15, clearProps: "transform" },
        0
      )
        .fromTo(
          ".hero-eyebrow",
          { y: 14, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, clearProps: "transform" },
          0.12
        )
        .fromTo(
          ".hero-line",
          { yPercent: 112 },
          {
            yPercent: 0,
            duration: 0.85,
            stagger: 0.13,
            clearProps: "transform",
          },
          0.22
        )
        .fromTo(
          ".hero-gold-accent",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.65 },
          0.46
        )
        .fromTo(
          ".hero-desc",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, clearProps: "transform" },
          0.52
        )
        .fromTo(
          ".hero-cta-item",
          { y: 16, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            stagger: 0.1,
            clearProps: "transform",
          },
          0.62
        )
        .fromTo(
          ".hero-scroll-line",
          { scaleY: 0, opacity: 0 },
          { scaleY: 1, opacity: 1, duration: 0.7 },
          0.75
        );
    }, rootRef);

    // Safety fallback ensuring hero stays 100% visible even if interrupted
    const safety = window.setTimeout(() => {
      if (!done && rootRef.current) {
        gsap.set(
          ".hero-bg-reveal, .hero-eyebrow, .hero-line, .hero-gold-accent, .hero-desc, .hero-cta-item, .hero-scroll-line",
          { opacity: 1, y: 0, yPercent: 0, scaleX: 1, scaleY: 1, scale: 1 }
        );
      }
    }, 1800);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [introReady, reducedMotion]);

  // 2. Subtle desktop pointer depth layer on Hero visual
  useEffect(() => {
    if (reducedMotion || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches) return;

    const visual = heroParallaxRef.current;
    if (!visual) return;

    const setX = gsap.quickTo(visual, "x", { duration: 0.9, ease: "power2.out" });
    const setY = gsap.quickTo(visual, "y", { duration: 0.9, ease: "power2.out" });

    const onMove = (e: MouseEvent) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * -12;
      const ny = (e.clientY / window.innerHeight - 0.5) * -8;
      setX(nx);
      setY(ny);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [reducedMotion]);

  // 3. Coordinated Our Story Timeline & Experience / Reservation Motion
  useEffect(() => {
    if (!rootRef.current || reducedMotion) return;

    const ctx = gsap.context(() => {
      // Story section coordinated timeline
      const storyTl = gsap.timeline({
        scrollTrigger: {
          trigger: ".story-section",
          start: "top 80%",
          once: true,
        },
        defaults: { ease: "power3.out" },
      });

      storyTl
        .fromTo(
          ".story-photo-main",
          { clipPath: "inset(16% 0% 16% 0%)", opacity: 0.4 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            opacity: 1,
            duration: 0.9,
            clearProps: "clipPath",
          },
          0
        )
        .fromTo(
          ".story-photo-main img",
          { scale: 1.08 },
          { scale: 1, duration: 1.05, clearProps: "transform" },
          0
        )
        .fromTo(
          ".story-photo-overlap",
          { clipPath: "inset(16% 0% 16% 0%)", y: 22, opacity: 0.35 },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            y: 0,
            opacity: 1,
            duration: 0.85,
            clearProps: "clipPath,transform",
          },
          0.18
        )
        .fromTo(
          ".story-gold-line",
          { scaleX: 0 },
          { scaleX: 1, duration: 0.7 },
          0.2
        )
        .fromTo(
          ".story-line",
          { yPercent: 110 },
          { yPercent: 0, duration: 0.78, stagger: 0.1, clearProps: "transform" },
          0.26
        )
        .fromTo(
          ".story-copy",
          { y: 16, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.65, clearProps: "transform" },
          0.44
        );

      // Experience section entry scale
      gsap.fromTo(
        ".experience-parallax-img",
        { scale: 1.08 },
        {
          scale: 1,
          duration: 1.25,
          ease: "power2.out",
          scrollTrigger: {
            trigger: ".experience-section",
            start: "top 85%",
            once: true,
          },
        }
      );

      // Desktop-only subtle parallax scrub
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px)", () => {
        gsap.fromTo(
          ".story-photo-overlap",
          { y: 18 },
          {
            y: -34,
            ease: "none",
            scrollTrigger: {
              trigger: ".story-section",
              start: "top bottom",
              end: "bottom top",
              scrub: 0.85,
            },
          }
        );

        gsap.fromTo(
          ".experience-parallax-img",
          { yPercent: -8 },
          {
            yPercent: 8,
            ease: "none",
            scrollTrigger: {
              trigger: ".experience-section",
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );

        gsap.fromTo(
          ".reservation-parallax-img",
          { yPercent: -5 },
          {
            yPercent: 5,
            ease: "none",
            scrollTrigger: {
              trigger: ".reservation-section",
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, rootRef);

    refreshScrollTriggers();
    return () => ctx.revert();
  }, [reducedMotion, refreshScrollTriggers]);

  // Auto-advance verified ratings gently every 7.5s
  useEffect(() => {
    if (reducedMotion || reviewsList.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveReview((prev) => (prev + 1) % reviewsList.length);
    }, 7500);
    return () => window.clearInterval(timer);
  }, [reducedMotion, reviewsList.length]);

  // Keyboard navigation for gallery lightbox
  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((prev) =>
          prev === null ? null : (prev + 1) % exhibitionPhotos.length
        );
      if (e.key === "ArrowLeft")
        setLightboxIdx((prev) =>
          prev === null
            ? null
            : (prev - 1 + exhibitionPhotos.length) % exhibitionPhotos.length
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, exhibitionPhotos.length]);

  const selectDish = (nextIdx: number) => {
    if (nextIdx === activeDish) return;
    setDishDirection(nextIdx > activeDish ? 1 : -1);
    setActiveDish(nextIdx);
  };

  const stepDish = (delta: number) => {
    setDishDirection(delta);
    setActiveDish(
      (prev) => (prev + delta + showcaseDishes.length) % showcaseDishes.length
    );
  };

  const handleDishTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleDishTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      stepDish(diff > 0 ? 1 : -1);
    }
    touchStartX.current = null;
  };

  const handleLightboxTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    lightboxTouchX.current = e.touches[0].clientX;
  };

  const handleLightboxTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (lightboxTouchX.current === null || lightboxIdx === null) return;
    const diff = lightboxTouchX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) {
      setLightboxIdx((prev) =>
        prev === null
          ? null
          : (prev + (diff > 0 ? 1 : -1) + exhibitionPhotos.length) %
            exhibitionPhotos.length
      );
    }
    lightboxTouchX.current = null;
  };

  const currentDish = showcaseDishes[activeDish] || showcaseDishes[0];
  const currentReview = reviewsList[activeReview] || reviewsList[0];
  const activeLightbox = lightboxIdx !== null ? exhibitionPhotos[lightboxIdx] : null;
  const dishProgressPercent = ((activeDish + 1) / showcaseDishes.length) * 100;

  const heroSec = sections.hero;
  const storySec = sections.story;
  const bannerSec = sections.banner;
  const gallerySec = sections.gallery;
  const reviewsSec = sections.reviews;
  const ctaSec = sections.cta;

  return (
    <div ref={rootRef}>
      {/* 02. FULL-SCREEN CINEMATIC HERO */}
      <section className="relative h-[88svh] sm:h-[90svh] md:h-screen min-h-[580px] max-h-[960px] flex items-end md:items-center overflow-hidden bg-[#10110F]">
        <div
          ref={heroParallaxRef}
          className="absolute -inset-4 will-change-transform pointer-events-none"
          aria-hidden="true"
        >
          <div className="hero-bg-reveal w-full h-full">
            <img
              src={heroSec?.image_url || ASSETS.heroDiningRoom}
              alt={heroSec?.image_alt || "Candlelit dining room with brass chandeliers inside Deccan Spice Pompano"}
              loading="eager"
              decoding="async"
              fetchPriority="high"
              referrerPolicy="no-referrer"
              className="animate-ken-burns w-full h-full object-cover object-[56%_42%] md:object-center"
            />
          </div>
        </div>

        {/* Mobile-specific vertical gradient preserving glowing upper chandeliers */}
        <div
          aria-hidden="true"
          className="md:hidden absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(16,17,15,0.46) 0%, rgba(16,17,15,0.34) 36%, rgba(16,17,15,0.84) 72%, rgba(16,17,15,0.95) 100%)",
          }}
        />

        {/* Desktop directional left-to-right scrim (84% left -> ~40% center -> ~14% right) */}
        <div
          aria-hidden="true"
          className="hidden md:block absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(16,17,15,0.85) 0%, rgba(16,17,15,0.66) 34%, rgba(16,17,15,0.39) 56%, rgba(16,17,15,0.14) 100%), linear-gradient(0deg, rgba(16,17,15,0.66) 0%, rgba(16,17,15,0.12) 42%, rgba(16,17,15,0.36) 100%)",
          }}
        />

        <div aria-hidden="true" className="film-grain absolute inset-0 pointer-events-none" />

        <div className="relative z-10 luxury-container pb-11 sm:pb-16 md:pb-12 pt-28 md:pt-32">
          <div className="max-w-[700px] text-left">
            <p className="hero-eyebrow text-[0.7rem] sm:text-[0.74rem] md:text-[0.8rem] tracking-[0.2em] uppercase text-[#D9B780] font-semibold drop-shadow-[0_1px_10px_rgba(16,17,15,0.65)]">
              {heroSec?.eyebrow || "INDIAN FINE DINING · POMPANO BEACH"}
            </p>

            <h1
              className="mt-3 sm:mt-4 font-display font-medium leading-[1.06] md:leading-[1.04] tracking-[-0.015em] drop-shadow-[0_2px_20px_rgba(16,17,15,0.55)]"
              style={{ fontSize: "clamp(2.65rem, 5.2vw, 5.4rem)" }}
            >
              <span className="block overflow-hidden pb-0.5">
                <span className="hero-line block text-[#FFF9F1]">
                  {heroSec?.title || "India, Served"}
                </span>
              </span>
              <span className="block overflow-hidden pb-1">
                <em className="hero-line block italic text-[#D9B780] mt-0.5 md:mt-1">
                  {heroSec?.subtitle || "Beautifully."}
                </em>
              </span>
            </h1>

            <div
              aria-hidden="true"
              className="hero-gold-accent w-12 h-[1px] bg-[#D9B780] origin-left mt-4 sm:mt-5"
            />

            <p className="hero-desc mt-4 text-[0.98rem] sm:text-[1.05rem] md:text-[1.14rem] leading-[1.6] text-[#FFF9F1]/92 max-w-[460px] font-normal drop-shadow-[0_1px_12px_rgba(16,17,15,0.65)]">
              {heroSec?.body || "Authentic flavors. Extraordinary moments."}
            </p>

            <div className="mt-7 sm:mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 sm:gap-4">
              <div className="hero-cta-item">
                <MagneticButton
                  onClick={onOpenReserve}
                  className="w-full sm:w-auto px-7 md:px-8 py-3.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/65 text-[#FFF9F1] text-[0.78rem] md:text-[0.82rem] font-medium tracking-[0.13em] uppercase transition-all duration-200 hover:-translate-y-0.5 shadow-lg whitespace-nowrap min-h-[46px] text-center"
                >
                  {heroSec?.button_text || "Reserve Your Table"}
                </MagneticButton>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("menu")}
                className="hero-cta-item cursor-pointer px-7 md:px-8 py-3.5 bg-[#10110F]/40 backdrop-blur-[2px] border border-[#D9B780]/80 hover:bg-[#D9B780] hover:border-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] text-[0.78rem] md:text-[0.82rem] font-medium tracking-[0.13em] uppercase transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap min-h-[46px] text-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              >
                {heroSec?.secondary_button_text || "Explore Our Menu"}
              </button>
            </div>
          </div>

          {/* Sophisticated Scroll Indicator (Desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:flex flex-col items-center gap-2 absolute right-8 bottom-10 text-[#D9B780]/85 pointer-events-none"
          >
            <span className="text-[0.6rem] tracking-[0.26em] uppercase [writing-mode:vertical-rl]">
              Scroll
            </span>
            <span className="hero-scroll-line origin-top block w-[1px] h-10 bg-gradient-to-b from-[#D9B780] to-transparent" />
          </div>
        </div>
      </section>

      {/* 03. ANIMATED BRAND STRIP MARQUEE */}
      <BrandStrip />

      {/* 04. EDITORIAL RESTAURANT STORY (Warm Ivory Break) */}
      <section className="story-section py-14 md:py-26 bg-[#F7F2E9] text-[#10110F] overflow-hidden">
        <div className="luxury-container grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
          {/* Layered Architectural Photography */}
          <div className="lg:col-span-7 relative">
            <div className="story-photo-main overflow-hidden bg-[#12352B] lg:w-[86%]">
              <SafeImage
                src={storySec?.image_url || ASSETS.introInterior}
                alt={storySec?.image_alt || "Architectural dining room banquettes and brass globe chandeliers at Deccan Spice"}
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="w-full aspect-[4/3] object-cover object-[18%_55%]"
              />
            </div>

            <div className="story-photo-overlap overflow-hidden mt-3 sm:mt-4 lg:mt-0 lg:w-[46%] lg:ml-auto lg:-mt-36 relative z-10 border-[5px] border-[#F7F2E9] shadow-2xl bg-[#10110F]">
              <SafeImage
                src={storySec?.secondary_image_url || ASSETS.spicedAppetizer}
                alt={storySec?.secondary_image_alt || "Handcrafted golden samosas and spiced fritters plated on honed dark stone"}
                sizes="(max-width: 1024px) 100vw, 25vw"
                className="w-full aspect-[16/10] lg:aspect-[3/4] object-cover"
              />
            </div>
          </div>

          {/* Editorial Copy Column */}
          <div className="lg:col-span-5 space-y-5 lg:pl-4">
            <div
              aria-hidden="true"
              className="story-gold-line w-14 h-[1px] bg-[#D9B780] origin-left"
            />
            <p className="story-copy text-[0.72rem] tracking-[0.22em] uppercase text-[#811C36] font-semibold">
              {storySec?.eyebrow || "Our Heritage · Pompano Beach"}
            </p>
            <h2
              className="font-display text-[#10110F] font-medium leading-[1.06]"
              style={{ fontSize: "clamp(2.1rem, 3.8vw, 3.6rem)" }}
            >
              <span className="block overflow-hidden">
                <span className="story-line block">{storySec?.title || "A Journey Through"}</span>
              </span>
              <span className="block overflow-hidden pb-1">
                <em className="story-line block italic text-[#811C36]">
                  {storySec?.subtitle || "India’s Flavors."}
                </em>
              </span>
            </h2>
            <p className="story-copy text-[0.96rem] md:text-[1.04rem] leading-[1.7] text-[#4C453E] max-w-md whitespace-pre-line">
              {storySec?.body || "Discover authentic recipes, aromatic spices, and the warmth of Indian hospitality in the heart of Pompano Beach."}
            </p>
            <div className="story-copy pt-1">
              <button
                type="button"
                onClick={() => onNavigate("about")}
                className="group cursor-pointer inline-flex items-center gap-3 text-[0.8rem] font-semibold tracking-[0.14em] uppercase text-[#10110F] hover:text-[#811C36] border-b-2 border-[#D9B780] hover:border-[#811C36] pb-1.5 transition-colors duration-200 min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#811C36]"
              >
                <span>{storySec?.button_text || "Our Story"}</span>
                <ArrowRight className="w-4 h-4 text-[#811C36] transition-transform duration-250 group-hover:translate-x-1.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 05. INTERACTIVE SIGNATURE DISH SHOWCASE */}
      <section className="relative py-14 md:py-26 bg-[#10110F] text-[#FFF9F1] overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0 transition-all duration-700 ease-out pointer-events-none"
          style={{ background: currentDish.moodBg }}
        />
        <div aria-hidden="true" className="film-grain absolute inset-0 pointer-events-none" />

        <div className="relative z-10 luxury-container space-y-8 md:space-y-12">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#D9B780]/20 pb-5">
            <RevealBlock className="space-y-2">
              <p className="text-[0.72rem] tracking-[0.22em] uppercase text-[#D9B780] font-semibold">
                {sections.signature?.eyebrow || "Signature Creations"}
              </p>
              <h2
                className="font-display font-medium leading-[1.05]"
                style={{ fontSize: "clamp(2.1rem, 4.1vw, 3.9rem)" }}
              >
                {sections.signature?.title || "Crafted Over Fire &"}{" "}
                <em className="italic text-[#D9B780]">{sections.signature?.subtitle || "Saffron."}</em>
              </h2>
            </RevealBlock>

            <button
              type="button"
              onClick={() => onNavigate("menu")}
              className="hidden md:inline-flex items-center gap-2 cursor-pointer text-[0.78rem] font-medium tracking-[0.12em] uppercase text-[#D9B780] hover:text-[#FFF9F1] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780]"
            >
              {sections.signature?.button_text || "Discover the Full Menu"}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Interactive Single-Dish Stage */}
          <div
            onTouchStart={handleDishTouchStart}
            onTouchEnd={handleDishTouchEnd}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-12 items-center"
          >
            {/* Main Dish Frame */}
            <div className="lg:col-span-7 relative">
              <button
                type="button"
                onClick={() => onNavigate("menu")}
                className="group cursor-pointer block w-full text-left relative aspect-[4/3] md:aspect-[16/10] overflow-hidden bg-[#12352B]/40 border border-[#D9B780]/25 hover:border-[#D9B780]/60 transition-colors duration-250 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780]"
                aria-label={`Explore ${currentDish.name} on the menu`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={currentDish.id}
                    initial={
                      reducedMotion
                        ? { opacity: 0 }
                        : {
                            clipPath:
                              dishDirection >= 0
                                ? "inset(0% 0% 0% 100%)"
                                : "inset(0% 100% 0% 0%)",
                            scale: 1.06,
                          }
                    }
                    animate={{
                      clipPath: "inset(0% 0% 0% 0%)",
                      scale: 1,
                      opacity: 1,
                    }}
                    exit={
                      reducedMotion
                        ? { opacity: 0 }
                        : {
                            clipPath:
                              dishDirection >= 0
                                ? "inset(0% 100% 0% 0%)"
                                : "inset(0% 0% 0% 100%)",
                            opacity: 0.75,
                          }
                    }
                    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="w-full h-full"
                  >
                    <SafeImage
                      src={currentDish.image}
                      alt={currentDish.name}
                      sizes="(max-width: 1024px) 100vw, 58vw"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                  </motion.div>
                </AnimatePresence>

                <div
                  aria-hidden="true"
                  className="absolute inset-0 bg-gradient-to-t from-[#10110F]/72 via-transparent to-transparent pointer-events-none"
                />

                <span className="absolute bottom-3.5 left-3.5 md:bottom-5 md:left-5 px-3.5 py-1.5 bg-[#10110F]/85 border border-[#D9B780]/45 text-[0.68rem] uppercase tracking-[0.16em] text-[#F7F2E9] tabular-nums">
                  {currentDish.course} · {currentDish.priceLabel}
                </span>
              </button>
            </div>

            {/* Editorial Control & Details Column */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-5 lg:space-y-7">
              {/* Counter, Animated Progress Line & Prev/Next Controls */}
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-baseline gap-2 tabular-nums">
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={activeDish}
                        initial={{ y: 10, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -10, opacity: 0 }}
                        transition={{ duration: 0.24 }}
                        className="font-display text-3xl md:text-4xl text-[#D9B780]"
                      >
                        0{activeDish + 1}
                      </motion.span>
                    </AnimatePresence>
                    <span className="text-[0.8rem] text-[#F7F2E9]/55 tracking-[0.14em]">
                      / 0{showcaseDishes.length}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => stepDish(-1)}
                      aria-label="Previous signature dish"
                      className="w-11 h-11 cursor-pointer border border-[#D9B780]/40 hover:border-[#D9B780] hover:bg-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => stepDish(1)}
                      aria-label="Next signature dish"
                      className="w-11 h-11 cursor-pointer border border-[#D9B780]/40 hover:border-[#D9B780] hover:bg-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Track */}
                <div className="w-full h-[1.5px] bg-[#D9B780]/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-[#D9B780] origin-left"
                    animate={{ width: `${dishProgressPercent}%` }}
                    transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              </div>

              {/* Vertical Dish Title + Crossfade Description */}
              <div className="min-h-[116px] md:min-h-[150px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentDish.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="space-y-2.5 md:space-y-3"
                  >
                    <div className="overflow-hidden">
                      <motion.h3
                        initial={reducedMotion ? { opacity: 1 } : { y: 26, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                        className="font-display font-medium text-[#FFF9F1] leading-[1.06]"
                        style={{ fontSize: "clamp(1.85rem, 3.1vw, 3.05rem)" }}
                      >
                        {currentDish.name}
                      </motion.h3>
                    </div>
                    <p className="text-[0.94rem] md:text-[1.02rem] leading-relaxed text-[#F7F2E9]/85 max-w-md">
                      {currentDish.tagline}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Thumbnail Preview Rail */}
              <div className="space-y-2">
                <p className="lg:hidden text-[0.68rem] uppercase tracking-[0.18em] text-[#D9B780]/80">
                  Swipe dish or select below
                </p>
                <div className="grid grid-cols-4 gap-2.5">
                  {showcaseDishes.map((dish, idx) => {
                    const isActive = idx === activeDish;
                    return (
                      <button
                        key={dish.id}
                        type="button"
                        onClick={() => selectDish(idx)}
                        aria-label={`Showcase ${dish.name}`}
                        aria-pressed={isActive}
                        className={`group cursor-pointer relative text-left transition-opacity duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780] ${
                          isActive ? "opacity-100" : "opacity-50 hover:opacity-85"
                        }`}
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-[#10110F] border border-[#D9B780]/30">
                          <SafeImage
                            src={dish.image}
                            alt={dish.name}
                            sizes="120px"
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                        </div>
                        <span className="mt-1 block text-[0.65rem] tabular-nums tracking-[0.14em] text-[#F7F2E9]">
                          0{idx + 1}
                        </span>
                        {isActive && (
                          <motion.span
                            layoutId="dish-active-bar"
                            className="block h-[2px] w-full bg-[#D9B780] mt-1"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Compact Primary Menu CTA */}
          <div className="pt-1 flex justify-center md:justify-start">
            <MagneticButton
              onClick={() => onNavigate("menu")}
              className="w-full sm:w-auto px-7 py-3.5 border border-[#D9B780]/80 text-[#FFF9F1] hover:bg-[#D9B780] hover:text-[#10110F] text-[0.78rem] font-medium tracking-[0.12em] uppercase transition-colors min-h-[44px]"
            >
              Discover the Full Menu
            </MagneticButton>
          </div>
        </div>
      </section>

      {/* 06. CINEMATIC DINING EXPERIENCE — MORE THAN A MEAL */}
      <section className="experience-section relative py-20 md:py-36 bg-[#12352B] text-[#FFF9F1] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <SafeImage
            src={bannerSec?.image_url || ASSETS.experienceLounge}
            alt={bannerSec?.image_alt || "Evening toast and celebration cocktails at Deccan Spice Pompano"}
            sizes="100vw"
            className="experience-parallax-img w-full h-[116%] -top-[8%] relative object-cover object-center"
          />
        </div>
        {/* Warm balanced scrim preserving hospitality glow */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none bg-gradient-to-b from-[#10110F]/64 via-[#10110F]/38 to-[#10110F]/70"
        />

        <RevealBlock className="relative z-10 luxury-container text-center space-y-5 max-w-2xl">
          <DrawGoldLine className="w-16" origin="center" />
          <h2
            className="font-display font-medium leading-[1.03] drop-shadow-[0_2px_16px_rgba(16,17,15,0.55)]"
            style={{ fontSize: "clamp(2.3rem, 5vw, 4.7rem)" }}
          >
            {bannerSec?.title || "More Than a Meal."}
          </h2>
          <p className="text-[1rem] md:text-[1.15rem] text-[#FFF9F1]/92 font-normal drop-shadow-[0_1px_10px_rgba(16,17,15,0.65)]">
            {bannerSec?.body || "Make every occasion extraordinary."}
          </p>
          <div className="pt-2">
            <MagneticButton
              onClick={onOpenReserve}
              className="px-8 py-3.5 border border-[#D9B780]/85 bg-[#10110F]/55 backdrop-blur-xs hover:bg-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.12em] uppercase transition-colors min-h-[46px]"
            >
              {bannerSec?.button_text || "Experience Deccan Spice"}
            </MagneticButton>
          </div>
        </RevealBlock>
      </section>

      {/* 07. ART-DIRECTED EMERALD GALLERY */}
      <section className="py-14 md:py-26 bg-[#12352B] jali-ornament text-[#FFF9F1]">
        <div className="luxury-container space-y-8 md:space-y-12">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#D9B780]/22 pb-5">
            <RevealBlock className="space-y-2">
              <p className="text-[0.72rem] tracking-[0.22em] uppercase text-[#D9B780] font-semibold">
                {gallerySec?.eyebrow || "Visual Exhibition"}
              </p>
              <h2
                className="font-display font-medium leading-[1.05]"
                style={{ fontSize: "clamp(2.1rem, 4vw, 3.8rem)" }}
              >
                {gallerySec?.title || "Atmosphere &"}{" "}
                <em className="italic text-[#D9B780]">{gallerySec?.subtitle || "Celebrations"}</em>
              </h2>
            </RevealBlock>
            <button
              type="button"
              onClick={() => onNavigate("gallery")}
              className="group cursor-pointer inline-flex items-center gap-2 text-[0.78rem] font-medium tracking-[0.12em] uppercase text-[#D9B780] hover:text-[#FFF9F1] transition-colors duration-200 self-start sm:self-auto min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780]"
            >
              <span>{gallerySec?.button_text || "Explore Gallery"}</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-250 group-hover:translate-x-1" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-5 items-stretch">
            {/* Large Featured Frame */}
            <MaskImageReveal className="md:col-span-7 bg-[#10110F]">
              <button
                type="button"
                onClick={() => setLightboxIdx(0)}
                className="group cursor-pointer relative w-full h-full aspect-[4/3] md:aspect-auto md:min-h-[470px] overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              >
                <SafeImage
                  src={exhibitionPhotos[0].image}
                  alt={exhibitionPhotos[0].title}
                  sizes="(max-width: 768px) 100vw, 58vw"
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#10110F]/85 via-transparent to-transparent" />
                <div className="absolute bottom-5 left-5 right-5 pointer-events-none transition-transform duration-250 group-hover:-translate-y-1">
                  <p className="text-[0.68rem] uppercase tracking-[0.16em] text-[#D9B780]">
                    {exhibitionPhotos[0].category}
                  </p>
                  <p className="font-display text-2xl mt-0.5 text-[#FFF9F1]">
                    {exhibitionPhotos[0].title}
                  </p>
                </div>
              </button>
            </MaskImageReveal>

            {/* Right Asymmetric Stack */}
            <div className="md:col-span-5 grid grid-cols-2 md:grid-cols-1 gap-4 md:gap-5">
              {exhibitionPhotos.slice(1).map((photo, i) => (
                <MaskImageReveal key={photo.id} delay={0.1 * (i + 1)} className="bg-[#10110F]">
                  <button
                    type="button"
                    onClick={() => setLightboxIdx(i + 1)}
                    className="group cursor-pointer relative w-full h-full aspect-[4/5] md:aspect-[16/10] overflow-hidden text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                  >
                    <SafeImage
                      src={photo.image}
                      alt={photo.title}
                      sizes="(max-width: 768px) 50vw, 40vw"
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#10110F]/85 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 pointer-events-none transition-transform duration-250 group-hover:-translate-y-0.5">
                      <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#D9B780]">
                        {photo.category}
                      </p>
                      <p className="font-display text-lg text-[#FFF9F1] mt-0.5 leading-snug">
                        {photo.title}
                      </p>
                    </div>
                  </button>
                </MaskImageReveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 08. VERIFIED GUEST RATINGS (Audited Platform Attributions) */}
      <section className="py-14 md:py-20 bg-[#F7F2E9] text-[#10110F]">
        <RevealBlock className="luxury-container max-w-3xl text-center space-y-5">
          <div className="space-y-1.5">
            <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#811C36] font-semibold">
              {reviewsSec?.eyebrow || "Verified Guest Ratings · Pompano Beach"}
            </p>
            <h2
              className="font-display font-medium leading-[1.05]"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3.1rem)" }}
            >
              {reviewsSec?.title || "Memorable"}{" "}
              <em className="italic text-[#811C36]">{reviewsSec?.subtitle || "Moments."}</em>
            </h2>
          </div>

          <div
            className="flex items-center justify-center gap-1 text-[#D9B780]"
            aria-hidden="true"
          >
            <Star className="w-4 h-4 fill-[#D9B780]" />
            <Star className="w-4 h-4 fill-[#D9B780]" />
            <Star className="w-4 h-4 fill-[#D9B780]" />
            <Star className="w-4 h-4 fill-[#D9B780]" />
            <Star className="w-4 h-4 fill-[#D9B780]/65" />
          </div>

          <div className="min-h-[118px] md:min-h-[108px] flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentReview.platform}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35 }}
                className="space-y-3.5"
              >
                <p className="font-display text-[1.35rem] md:text-[1.8rem] leading-[1.38] text-[#10110F] max-w-2xl mx-auto">
                  {currentReview.summary}
                </p>
                <p className="text-[0.76rem] tracking-[0.15em] uppercase text-[#811C36] font-semibold tabular-nums">
                  {currentReview.platform} · {currentReview.score} / 5 ·{" "}
                  {currentReview.detail}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 pt-1">
            <button
              type="button"
              onClick={() =>
                setActiveReview(
                  (prev) =>
                    (prev - 1 + reviewsList.length) % reviewsList.length
                )
              }
              aria-label="Previous verified rating"
              className="w-11 h-11 cursor-pointer border border-[#D9B780]/70 flex items-center justify-center text-[#10110F] hover:border-[#811C36] hover:text-[#811C36] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#811C36]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {reviewsList.map((item, idx) => (
                <button
                  key={`${item.platform}-${idx}`}
                  type="button"
                  onClick={() => setActiveReview(idx)}
                  aria-label={`Show ${item.platform} rating`}
                  className={`h-2 cursor-pointer transition-all duration-250 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#811C36] ${
                    activeReview === idx ? "w-7 bg-[#811C36]" : "w-2.5 bg-[#D9B780]/60 hover:bg-[#D9B780]"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() =>
                setActiveReview((prev) => (prev + 1) % reviewsList.length)
              }
              aria-label="Next verified rating"
              className="w-11 h-11 cursor-pointer border border-[#D9B780]/70 flex items-center justify-center text-[#10110F] hover:border-[#811C36] hover:text-[#811C36] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#811C36]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </RevealBlock>
      </section>

      {/* 09. LUXURY RESERVATION SECTION */}
      {ctaSec?.is_visible !== false && (
        <section className="reservation-section scroll-mt-24 relative py-20 md:py-28 bg-[#10110F] text-[#FFF9F1] overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <SafeImage
              src={ctaSec?.image_url || ASSETS.reservationTable}
              alt={ctaSec?.image_alt || "Intimate candlelit dinner table set with hammered brass charger plates"}
              sizes="100vw"
              className="reservation-parallax-img w-full h-[112%] -top-[6%] relative object-cover object-center"
            />
          </div>
          <div
            aria-hidden="true"
            className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#10110F]/92 via-[#10110F]/66 to-[#10110F]/76"
          />

          <RevealBlock className="relative z-10 luxury-container">
            <div className="max-w-2xl mx-auto text-center p-7 sm:p-10 md:p-14 border border-[#D9B780]/45 bg-[#10110F]/74 backdrop-blur-md space-y-5">
              <DrawGoldLine className="w-16" origin="center" />
              <h2
                className="font-display font-medium leading-[1.05]"
                style={{ fontSize: "clamp(2.15rem, 4.3vw, 4.1rem)" }}
              >
                {ctaSec?.title || "An Extraordinary Evening"}{" "}
                <em className="italic text-[#D9B780]">{ctaSec?.subtitle || "Awaits."}</em>
              </h2>
              <p className="text-[0.96rem] md:text-[1.06rem] text-[#F7F2E9]/90">
                {ctaSec?.body || "Your next memorable dining experience begins here."}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3.5">
                <MagneticButton
                  onClick={onOpenReserve}
                  className="px-7 py-3.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/60 text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.12em] uppercase transition-colors min-h-[46px]"
                >
                  {ctaSec?.button_text || "Reserve Your Table"}
                </MagneticButton>
                <a
                  href={settings?.phone ? `tel:${settings.phone.replace(/[^0-9+]/g, "")}` : SITE_INFO.phoneHref}
                  className="inline-flex items-center justify-center gap-2 px-7 py-3.5 border border-[#D9B780]/75 hover:bg-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] text-[0.78rem] font-medium tracking-[0.12em] uppercase transition-colors min-h-[46px]"
                >
                  <Phone className="w-3.5 h-3.5 text-[#D9B780]" />
                  {ctaSec?.secondary_button_text || "Call Restaurant"}
                </a>
              </div>
            </div>
          </RevealBlock>
        </section>
      )}

      {/* Swipeable Fullscreen Exhibition Lightbox */}
      <AnimatePresence>
        {activeLightbox && lightboxIdx !== null && (
          <motion.div
            key="home-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#10110F]/95 flex items-center justify-center p-4 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={activeLightbox.title}
            onClick={() => setLightboxIdx(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="relative max-w-5xl w-full bg-[#10110F] border border-[#D9B780]/35"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleLightboxTouchStart}
              onTouchEnd={handleLightboxTouchEnd}
            >
              <div className="relative aspect-[16/10] bg-black">
                <SafeImage
                  src={activeLightbox.image}
                  alt={activeLightbox.title}
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setLightboxIdx(null)}
                  className="absolute top-3 right-3 w-11 h-11 cursor-pointer bg-[#10110F]/85 border border-[#D9B780]/45 hover:border-[#D9B780] text-[#FFF9F1] flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                  aria-label="Close lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx(
                      (lightboxIdx - 1 + exhibitionPhotos.length) %
                        exhibitionPhotos.length
                    )
                  }
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 cursor-pointer bg-[#10110F]/85 border border-[#D9B780]/45 hover:border-[#D9B780] text-[#FFF9F1] flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                  aria-label="Previous photograph"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxIdx((lightboxIdx + 1) % exhibitionPhotos.length)
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 cursor-pointer bg-[#10110F]/85 border border-[#D9B780]/45 hover:border-[#D9B780] text-[#FFF9F1] flex items-center justify-center transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                  aria-label="Next photograph"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#FFF9F1]">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#D9B780]">
                    {activeLightbox.category}
                  </p>
                  <p className="font-display text-xl">{activeLightbox.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLightboxIdx(null);
                    onNavigate("gallery");
                  }}
                  className="cursor-pointer text-[0.76rem] uppercase tracking-[0.1em] text-[#D9B780] hover:text-[#FFF9F1] hover:underline underline-offset-4 transition-colors duration-200 self-start sm:self-auto min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Full Exhibition
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
