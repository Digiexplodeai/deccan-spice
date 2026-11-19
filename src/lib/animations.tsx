import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface AnimationContextValue {
  scrollToTop: (immediate?: boolean) => void;
  refreshScrollTriggers: () => void;
  reducedMotion: boolean;
}

const AnimationContext = createContext<AnimationContextValue>({
  scrollToTop: () => {
    if (typeof window !== "undefined") window.scrollTo({ top: 0 });
  },
  refreshScrollTriggers: () => {
    ScrollTrigger.refresh();
  },
  reducedMotion: false,
});

export function useAnimationSystem() {
  return useContext(AnimationContext);
}

export function AnimationProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Desktop-only Lenis smooth scrolling cleanly synced with GSAP ticker + ScrollTrigger
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (reducedMotion) return;

    const isDesktopFinePointer = window.matchMedia(
      "(pointer: fine) and (min-width: 1024px)"
    ).matches;

    if (!isDesktopFinePointer) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });
    lenisRef.current = lenis;

    lenis.on("scroll", ScrollTrigger.update);

    const tick = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    let alive = true;
    document.fonts?.ready?.then(() => {
      if (alive) ScrollTrigger.refresh();
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    const fallbackTimer = window.setTimeout(() => ScrollTrigger.refresh(), 450);

    return () => {
      alive = false;
      window.clearTimeout(fallbackTimer);
      window.removeEventListener("load", onLoad);
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, [reducedMotion]);

  const scrollToTop = useCallback((immediate = false) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate });
    } else if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: immediate ? "auto" : "smooth" });
    }
  }, []);

  const refreshScrollTriggers = useCallback(() => {
    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
    });
  }, []);

  return (
    <AnimationContext.Provider
      value={{ scrollToTop, refreshScrollTriggers, reducedMotion }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

/**
 * Thin Champagne Gold scroll progress bar along top edge (Desktop).
 */
export function ScrollProgressBar() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    const update = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(Math.max(window.scrollY / max, 0), 1) : 0;
      bar.style.transform = `scaleX(${progress})`;
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="hidden md:block fixed top-0 left-0 right-0 z-50 h-[2px] pointer-events-none bg-transparent"
    >
      <div
        ref={barRef}
        className="w-full h-full bg-gradient-to-r from-[#D9B780]/75 via-[#D9B780] to-[#FFF9F1] origin-left will-change-transform"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/**
 * Scroll-triggered vertical reveal with guaranteed visibility safety fallback.
 */
interface RevealBlockProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
}

export function RevealBlock({
  children,
  className = "",
  delay = 0,
  y = 24,
}: RevealBlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useAnimationSystem();

  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion) return;

    let completed = false;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { y, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.78,
          delay,
          ease: "power3.out",
          clearProps: "transform",
          onComplete: () => {
            completed = true;
          },
          scrollTrigger: {
            trigger: el,
            start: "top 90%",
            once: true,
          },
        }
      );
    }, ref);

    const safety = window.setTimeout(() => {
      if (!completed && el) {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.1) {
          gsap.to(el, { y: 0, opacity: 1, duration: 0.45, clearProps: "transform" });
        }
      }
    }, 1050);

    return () => {
      window.clearTimeout(safety);
      ctx.revert();
    };
  }, [delay, y, reducedMotion]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/**
 * Animated Champagne Gold line drawing itself horizontally on scroll.
 */
export function DrawGoldLine({
  className = "w-16",
  origin = "left",
}: {
  className?: string;
  origin?: "left" | "center";
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useAnimationSystem();

  useEffect(() => {
    const el = lineRef.current;
    if (!el || reducedMotion) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 92%",
            once: true,
          },
        }
      );
    }, lineRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <div
      ref={lineRef}
      aria-hidden="true"
      className={`h-[1px] bg-[#D9B780] ${
        origin === "center" ? "origin-center mx-auto" : "origin-left"
      } ${className}`}
    />
  );
}

/**
 * Architectural clip-path image reveal with inner scale transition on nested <img>.
 */
export function MaskImageReveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { reducedMotion } = useAnimationSystem();

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reducedMotion) return;

    const img = el.querySelector("img");
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: "top 88%",
          once: true,
        },
        delay,
      });

      tl.fromTo(
        el,
        { clipPath: "inset(14% 0% 14% 0%)", opacity: 0.45 },
        {
          clipPath: "inset(0% 0% 0% 0%)",
          opacity: 1,
          duration: 0.85,
          ease: "power3.out",
          clearProps: "clipPath",
        }
      );

      if (img) {
        tl.fromTo(
          img,
          { scale: 1.09 },
          {
            scale: 1,
            duration: 1.05,
            ease: "power3.out",
            clearProps: "transform",
          },
          0
        );
      }
    }, wrapRef);

    return () => ctx.revert();
  }, [delay, reducedMotion]);

  return (
    <div ref={wrapRef} className={`overflow-hidden ${className}`}>
      {children}
    </div>
  );
}

/**
 * Subtle desktop-only pointer magnetic micro-interaction for primary luxury CTAs.
 */
interface MagneticButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  strength?: number;
  disabled?: boolean;
}

export function MagneticButton({
  children,
  onClick,
  className = "",
  type = "button",
  ariaLabel,
  strength = 0.2,
  disabled = false,
}: MagneticButtonProps) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const { reducedMotion } = useAnimationSystem();

  const handleMouseMove = (e: ReactMouseEvent<HTMLButtonElement>) => {
    if (disabled || reducedMotion || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer: fine) and (min-width: 1024px)").matches) return;
    const node = btnRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * strength;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * strength;
    gsap.to(node, { x: dx, y: dy, duration: 0.35, ease: "power2.out" });
  };

  const handleMouseLeave = () => {
    const node = btnRef.current;
    if (!node) return;
    gsap.to(node, { x: 0, y: 0, duration: 0.45, ease: "elastic.out(1, 0.5)" });
  };

  return (
    <button
      ref={btnRef}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      aria-label={ariaLabel}
      className={`cursor-pointer disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780] ${className}`}
    >
      {children}
    </button>
  );
}
