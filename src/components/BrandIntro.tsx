import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { DeccanLogo } from "./DeccanLogo";

interface BrandIntroProps {
  onIntroComplete?: () => void;
}

export function BrandIntro({ onIntroComplete }: BrandIntroProps) {
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      onIntroComplete?.();
      return;
    }

    if (prefersReduced) {
      onIntroComplete?.();
      return;
    }

    const navConn = (
      navigator as Navigator & { connection?: { effectiveType?: string } }
    ).connection;
    if (navConn?.effectiveType === "2g" || navConn?.effectiveType === "slow-2g") {
      onIntroComplete?.();
      return;
    }

    if (window.sessionStorage.getItem("ds-intro-seen") === "1") {
      onIntroComplete?.();
      return;
    }

    window.sessionStorage.setItem("ds-intro-seen", "1");
    setVisible(true);

    // Reveal hero right as curtain begins lifting (~920ms)
    const timer = window.setTimeout(() => {
      setVisible(false);
      onIntroComplete?.();
    }, 920);

    return () => window.clearTimeout(timer);
  }, [prefersReduced, onIntroComplete]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="brand-intro"
          initial={{ clipPath: "inset(0% 0% 0% 0%)", opacity: 1 }}
          exit={{
            clipPath: "inset(0% 0% 100% 0%)",
            opacity: 0.92,
            transition: { duration: 0.52, ease: [0.22, 1, 0.36, 1] },
          }}
          aria-hidden="true"
          className="fixed inset-0 z-50 bg-[#10110F] flex flex-col items-center justify-center gap-4 pointer-events-none select-none"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.44, ease: [0.16, 1, 0.3, 1] }}
          >
            <DeccanLogo variant="light" size="lg" />
          </motion.div>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.52, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            className="w-28 h-[1px] bg-[#D9B780] origin-center"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
