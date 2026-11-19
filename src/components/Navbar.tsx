import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Facebook, Instagram, X } from "lucide-react";
import { DeccanLogo } from "./DeccanLogo";
import { SITE_INFO } from "../data/site";
import { MagneticButton } from "../lib/animations";

export type RouteId = "home" | "about" | "menu" | "gallery" | "contact" | "buffet";

interface NavbarProps {
  activeRoute: RouteId;
  onNavigate: (route: RouteId) => void;
  onOpenReserve: () => void;
}

const NAV_ITEMS: { id: RouteId; label: string }[] = [
  { id: "home", label: "Home" },
  { id: "about", label: "Our Story" },
  { id: "menu", label: "Menu" },
  { id: "gallery", label: "Gallery" },
  { id: "contact", label: "Contact" },
];

export function Navbar({ activeRoute, onNavigate, onOpenReserve }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const openBtnRef = useRef<HTMLButtonElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 36);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      wasOpenRef.current = true;
      closeBtnRef.current?.focus();
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setMobileOpen(false);
      };
      window.addEventListener("keydown", onKey);
      return () => window.removeEventListener("keydown", onKey);
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      openBtnRef.current?.focus();
    }
  }, [mobileOpen]);

  const isTransparent = activeRoute === "home" && !scrolled && !mobileOpen;

  const handleLinkClick = (id: RouteId) => {
    setMobileOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          isTransparent
            ? "bg-gradient-to-b from-[#10110F]/75 to-transparent"
            : "bg-[#10110F]/95 backdrop-blur-md border-b border-[#D9B780]/22 shadow-[0_8px_32px_-12px_rgba(0,0,0,0.72)]"
        }`}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="luxury-container h-[66px] md:h-[80px] flex items-center justify-between gap-8"
        >
          <button
            type="button"
            onClick={() => handleLinkClick("home")}
            className="inline-flex items-center cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780] shrink-0"
            aria-label="Deccan Spice Pompano Home"
          >
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center pointer-events-none"
            >
              <DeccanLogo variant="light" size="sm" />
            </motion.span>
          </button>

          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-8 xl:gap-9 text-[0.82rem] font-medium tracking-[0.11em] uppercase"
          >
            {NAV_ITEMS.map((item) => {
              const active = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleLinkClick(item.id)}
                  className={`group relative py-1.5 cursor-pointer whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780] ${
                    active ? "text-[#D9B780]" : "text-[#FFF9F1]/95 hover:text-[#D9B780]"
                  }`}
                >
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute left-0 right-0 -bottom-0.5 h-[1.5px] bg-[#D9B780] transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${
                      active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <MagneticButton
              onClick={onOpenReserve}
              className="hidden lg:inline-flex items-center justify-center px-5 py-2.5 border border-[#D9B780]/85 text-[#FFF9F1] hover:bg-[#D9B780] hover:border-[#D9B780] hover:text-[#10110F] text-[0.78rem] font-medium tracking-[0.11em] uppercase whitespace-nowrap shrink-0 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
            >
              Reserve a Table
            </MagneticButton>

            <button
              ref={openBtnRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden cursor-pointer inline-flex flex-col items-end justify-center gap-1.5 w-11 h-11 text-[#FFF9F1] focus-visible:outline-2 focus-visible:outline-[#D9B780]"
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
            >
              <span className="block w-6 h-[1.5px] bg-[#FFF9F1] transition-all pointer-events-none" />
              <span className="block w-4 h-[1.5px] bg-[#D9B780] transition-all pointer-events-none" />
            </button>
          </div>
        </motion.div>
      </header>

      {/* Full-Screen Dark Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-nav"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="fixed inset-0 z-50 bg-[#10110F] jali-ornament text-[#FFF9F1] flex flex-col justify-between px-6 py-5 lg:hidden overflow-y-auto no-scrollbar"
            role="dialog"
            aria-modal="true"
            aria-label="Mobile Navigation"
          >
            <div className="flex items-center justify-between">
              <DeccanLogo variant="light" size="sm" />
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                className="w-11 h-11 flex items-center justify-center border border-[#D9B780]/35 text-[#FFF9F1] hover:border-[#D9B780]"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav aria-label="Mobile Menu Links" className="py-8 space-y-2">
              {[...NAV_ITEMS, { id: "buffet" as RouteId, label: "Weekend Buffet" }].map(
                (item, index) => {
                  const active = activeRoute === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.34,
                        delay: 0.04 + index * 0.045,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      onClick={() => handleLinkClick(item.id)}
                      className={`block w-full text-left font-display text-[2.15rem] py-2.5 border-b border-[#D9B780]/15 transition-colors ${
                        active ? "text-[#D9B780] italic" : "text-[#FFF9F1]"
                      }`}
                    >
                      {item.label}
                    </motion.button>
                  );
                }
              )}
            </nav>

            <div className="space-y-5 pt-4 border-t border-[#D9B780]/20">
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenReserve();
                }}
                className="w-full py-3.5 px-6 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.8rem] font-medium tracking-[0.11em] uppercase min-h-[48px]"
              >
                Reserve a Table
              </button>

              <div className="flex items-center justify-between gap-4 text-[0.8rem] text-[#F7F2E9]/80">
                <div>
                  <p>{SITE_INFO.address}</p>
                  <p className="tabular-nums mt-1">
                    <a
                      href={SITE_INFO.phoneHref}
                      className="text-[#D9B780] underline underline-offset-4"
                    >
                      {SITE_INFO.phoneDisplay}
                    </a>
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <a
                    href="https://www.instagram.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Instagram"
                    className="w-11 h-11 border border-[#D9B780]/30 flex items-center justify-center text-[#FFF9F1]"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                  <a
                    href="https://www.facebook.com"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Facebook"
                    className="w-11 h-11 border border-[#D9B780]/30 flex items-center justify-center text-[#FFF9F1]"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
