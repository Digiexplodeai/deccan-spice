import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Search, ShoppingBag, X } from "lucide-react";
import {
  ASSETS,
  MENU_CATEGORIES,
  MENU_ITEMS,
  type DishItem,
  type MenuCategory,
} from "../data/site";
import { DrawGoldLine, MagneticButton, RevealBlock } from "../lib/animations";
import { MenuCard } from "./MenuCard";

interface MenuPageProps {
  onAddToOrder: (dish: DishItem) => void;
  cartCount: number;
  onOpenCart: () => void;
}

export function MenuPage({ onAddToOrder, cartCount, onOpenCart }: MenuPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategory | "All">(
    "All"
  );
  const [vegetarianOnly, setVegetarianOnly] = useState(false);
  const [query, setQuery] = useState("");

  const filteredDishes = useMemo(() => {
    const q = query.trim().toLowerCase();
    return MENU_ITEMS.filter((item) => {
      if (selectedCategory !== "All" && item.category !== selectedCategory) return false;
      if (vegetarianOnly && !item.dietary.includes("Vegetarian")) return false;
      if (
        q &&
        !item.name.toLowerCase().includes(q) &&
        !item.description.toLowerCase().includes(q) &&
        !item.category.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [selectedCategory, vegetarianOnly, query]);

  return (
    <div className="pb-24 bg-[#10110F] text-[#FFF9F1] min-h-screen">
      {/* Editorial Cover Banner */}
      <section className="relative pt-28 pb-10 md:pt-36 md:pb-14 overflow-hidden bg-[#1D1712] border-b border-[#D9B780]/25">
        <img
          src={ASSETS.tandooriSpecialties}
          alt="Clay-oven roasted tandoori dishes at Deccan Spice Pompano"
          loading="eager"
          decoding="async"
          className="absolute inset-0 w-full h-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-[#10110F] via-[#10110F]/70 to-[#10110F]/85"
        />
        <div className="relative z-10 luxury-container flex flex-col sm:flex-row sm:items-end justify-between gap-5">
          <RevealBlock className="space-y-2.5">
            <DrawGoldLine className="w-14" origin="left" />
            <p className="text-[0.7rem] tracking-[0.22em] uppercase text-[#D9B780] font-medium">
              A La Carte · Dine-In &amp; Pickup
            </p>
            <h1
              className="font-display text-[#FFF9F1] font-normal leading-[1.03]"
              style={{ fontSize: "clamp(2.25rem, 4.5vw, 4.1rem)" }}
            >
              The Culinary <em className="italic text-[#D9B780]">Menu</em>
            </h1>
          </RevealBlock>

          <MagneticButton
            onClick={onOpenCart}
            className="inline-flex items-center gap-2.5 px-5 py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/55 text-[#FFF9F1] text-[0.76rem] font-medium tracking-[0.1em] uppercase transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto min-h-[44px]"
          >
            <ShoppingBag className="w-4 h-4 text-[#D9B780]" />
            <span>Pickup Bag</span>
            <span className="tabular-nums px-2 py-0.5 bg-[#10110F]/60 text-xs text-[#D9B780]">
              {cartCount}
            </span>
          </MagneticButton>
        </div>
      </section>

      <div className="luxury-container pt-6 md:pt-8 space-y-6 md:space-y-8">
        {/* Sticky Horizontal Category Navigation & Search */}
        <div className="sticky top-[66px] md:top-[80px] z-20 -mx-4 px-4 md:mx-0 md:px-0 py-3.5 bg-[#10110F]/95 backdrop-blur-md border-b border-[#D9B780]/20 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 text-[#D9B780] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search dishes..."
                aria-label="Search menu dishes"
                className="w-full pl-9 pr-8 py-2.5 bg-[#1D1712]/70 border border-[#D9B780]/30 text-[0.84rem] text-[#FFF9F1] placeholder:text-[#F7F2E9]/55 focus:outline-none focus:border-[#D9B780] min-h-[44px]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#F7F2E9] hover:text-[#FFF9F1] p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setVegetarianOnly((prev) => !prev)}
              aria-pressed={vegetarianOnly}
              className={`px-4 py-2 text-[0.74rem] font-medium tracking-[0.1em] uppercase border transition-colors self-start sm:self-auto whitespace-nowrap min-h-[44px] ${
                vegetarianOnly
                  ? "bg-[#D9B780] text-[#10110F] border-[#D9B780]"
                  : "bg-transparent text-[#FFF9F1] border-[#D9B780]/35 hover:border-[#D9B780]"
              }`}
            >
              Vegetarian Only
            </button>
          </div>

          <div
            className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-0.5"
            role="tablist"
            aria-label="Menu Categories"
          >
            {(["All", ...MENU_CATEGORIES] as const).map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedCategory(cat)}
                  className={`relative px-3.5 py-2 text-[0.74rem] font-medium tracking-[0.06em] uppercase whitespace-nowrap shrink-0 border transition-colors min-h-[44px] ${
                    active
                      ? "bg-[#811C36] text-[#FFF9F1] border-[#D9B780]/65"
                      : "bg-[#1D1712]/55 text-[#F7F2E9] border-[#D9B780]/20 hover:border-[#D9B780]"
                  }`}
                >
                  {cat}
                  {active && (
                    <motion.span
                      layoutId="menu-cat-underline"
                      className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#D9B780]"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Animated Dish Grid */}
        {filteredDishes.length === 0 ? (
          <div className="py-12 px-6 border border-[#D9B780]/25 bg-[#1D1712]/45 text-center space-y-3">
            <p className="font-display text-2xl text-[#FFF9F1]">
              No matching dishes found
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory("All");
                setVegetarianOnly(false);
                setQuery("");
              }}
              className="px-5 py-2.5 bg-[#D9B780] text-[#10110F] text-[0.76rem] uppercase tracking-[0.08em] font-medium min-h-[44px]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${vegetarianOnly}-${query}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 md:gap-5"
            >
              {filteredDishes.map((dish) => (
                <MenuCard key={dish.id} dish={dish} onAddToOrder={onAddToOrder} />
              ))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
