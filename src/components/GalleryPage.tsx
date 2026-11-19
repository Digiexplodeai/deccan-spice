import { useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { GALLERY_CATEGORIES, GALLERY_ITEMS } from "../data/site";
import { DrawGoldLine, RevealBlock } from "../lib/animations";
import { SafeImage } from "./SafeImage";
import { useCMS } from "../lib/cmsContext";

export function GalleryPage() {
  const { gallery } = useCMS();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const allItems = useMemo(() => {
    if (gallery && gallery.length > 0) {
      return gallery.map((g) => ({
        id: g.id,
        title: g.title,
        category: (g.category as any) || "The Restaurant",
        caption: g.caption || "",
        image: g.image_url,
      }));
    }
    return GALLERY_ITEMS;
  }, [gallery]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    GALLERY_CATEGORIES.forEach((c) => set.add(c));
    return ["All", ...Array.from(set)];
  }, [allItems]);

  const visibleItems =
    selectedCategory === "All"
      ? allItems
      : allItems.filter((item) => item.category === selectedCategory);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveIndex(null);
      if (e.key === "ArrowRight")
        setActiveIndex((prev) =>
          prev === null ? null : (prev + 1) % visibleItems.length
        );
      if (e.key === "ArrowLeft")
        setActiveIndex((prev) =>
          prev === null
            ? null
            : (prev - 1 + visibleItems.length) % visibleItems.length
        );
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, visibleItems.length]);

  const handleTouchStart = (e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || activeIndex === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 42 && visibleItems.length > 1) {
      setActiveIndex(
        (activeIndex + (diff > 0 ? 1 : -1) + visibleItems.length) %
          visibleItems.length
      );
    }
    touchStartX.current = null;
  };

  const activeItem = activeIndex !== null ? visibleItems[activeIndex] : null;

  return (
    <div className="pt-24 md:pt-32 pb-24 bg-[#10110F] text-[#FFF9F1] min-h-screen">
      <div className="luxury-container space-y-8 md:space-y-10">
        <RevealBlock className="space-y-3 pb-6 border-b border-[#D9B780]/20">
          <DrawGoldLine className="w-14" origin="left" />
          <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#D9B780] font-medium">
            Exhibition · Pompano Beach
          </p>
          <h1
            className="font-display font-normal leading-[1.04]"
            style={{ fontSize: "clamp(2.25rem, 4.3vw, 3.9rem)" }}
          >
            Visual <em className="italic text-[#D9B780]">Gallery</em>
          </h1>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2">
            {categories.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    setActiveIndex(null);
                  }}
                  className={`px-4 py-2 text-[0.74rem] font-medium tracking-[0.06em] uppercase border whitespace-nowrap shrink-0 transition-colors min-h-[44px] ${
                    active
                      ? "bg-[#811C36] text-[#FFF9F1] border-[#D9B780]/60"
                      : "bg-[#1D1712]/55 text-[#F7F2E9] border-[#D9B780]/20 hover:border-[#D9B780]"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </RevealBlock>

        {/* Asymmetric Exhibition Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.28 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 md:gap-5"
          >
            {visibleItems.map((item, idx) => {
              const isHeroTile = idx === 0 || idx === 3;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  className={`group cursor-pointer relative overflow-hidden bg-[#12352B] text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780] ${
                    isHeroTile
                      ? "sm:col-span-2 lg:col-span-6 aspect-[16/10]"
                      : "lg:col-span-3 aspect-[4/3] lg:aspect-[4/4]"
                  }`}
                >
                  <SafeImage
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    sizes={
                      isHeroTile
                        ? "(max-width: 1024px) 100vw, 50vw"
                        : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    }
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#10110F]/88 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 pointer-events-none text-[#FFF9F1]">
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-[#D9B780]">
                      {item.category}
                    </p>
                    <h2 className="font-display text-xl mt-0.5">{item.title}</h2>
                  </div>
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Fullscreen Swipeable Lightbox */}
      <AnimatePresence>
        {activeItem && activeIndex !== null && (
          <motion.div
            key="gallery-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#10110F]/95 flex items-center justify-center p-4 md:p-10"
            role="dialog"
            aria-modal="true"
            aria-label={activeItem.title}
            onClick={() => setActiveIndex(null)}
          >
            <div
              className="relative max-w-5xl w-full bg-[#10110F] border border-[#D9B780]/35"
              onClick={(e) => e.stopPropagation()}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              <div className="relative aspect-[16/10] bg-black">
                <SafeImage
                  src={activeItem.image}
                  alt={activeItem.title}
                  loading="eager"
                  className="w-full h-full object-contain"
                />
                <button
                  type="button"
                  onClick={() => setActiveIndex(null)}
                  className="absolute top-3 right-3 w-11 h-11 bg-[#10110F]/85 border border-[#D9B780]/45 text-[#FFF9F1] flex items-center justify-center"
                  aria-label="Close lightbox"
                >
                  <X className="w-5 h-5" />
                </button>
                {visibleItems.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex(
                          (activeIndex - 1 + visibleItems.length) %
                            visibleItems.length
                        )
                      }
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#10110F]/85 border border-[#D9B780]/45 text-[#FFF9F1] flex items-center justify-center"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setActiveIndex((activeIndex + 1) % visibleItems.length)
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-[#10110F]/85 border border-[#D9B780]/45 text-[#FFF9F1] flex items-center justify-center"
                      aria-label="Next image"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}
              </div>
              <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[#FFF9F1]">
                <div>
                  <p className="text-[0.68rem] uppercase tracking-[0.14em] text-[#D9B780]">
                    {activeItem.category}
                  </p>
                  <h3 className="font-display text-xl">{activeItem.title}</h3>
                  <p className="text-[0.84rem] text-[#F7F2E9]/80">
                    {activeItem.caption}
                  </p>
                </div>
                <span className="text-[0.8rem] text-[#D9B780] tabular-nums shrink-0">
                  {activeIndex + 1} / {visibleItems.length}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
