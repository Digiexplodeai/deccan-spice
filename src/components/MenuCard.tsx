import { Check, ChevronDown, Plus, Utensils } from "lucide-react";
import { useState } from "react";
import type { DishItem } from "../data/site";
import { SafeImage } from "./SafeImage";

interface MenuCardProps {
  dish: DishItem;
  onAddToOrder: (dish: DishItem) => void;
}

export function MenuCard({ dish, onAddToOrder }: MenuCardProps) {
  const [justAdded, setJustAdded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleAdd = () => {
    onAddToOrder(dish);
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1200);
  };

  const isVegetarian = dish.dietary.includes("Vegetarian");
  const isGF = dish.dietary.includes("Gluten-Free");

  return (
    <article className="bg-[#1D1712]/65 border border-[#D9B780]/22 p-3.5 sm:p-5 flex flex-row sm:flex-col justify-between gap-3.5 sm:gap-4 transition-all duration-300 hover:border-[#D9B780]/60 hover:bg-[#1D1712]/85">
      {dish.image ? (
        <div className="w-20 h-20 sm:w-full sm:aspect-[16/10] shrink-0 overflow-hidden bg-[#10110F]">
          <SafeImage
            src={dish.image}
            alt={dish.name}
            fallbackTitle={dish.name}
            loading="lazy"
            sizes="(max-width: 640px) 80px, (max-width: 1024px) 50vw, 33vw"
            className="w-full h-full object-cover transition-transform duration-700 hover:scale-[1.04]"
          />
        </div>
      ) : (
        <div className="hidden sm:flex items-center justify-between text-[0.7rem] tracking-[0.14em] uppercase text-[#D9B780] font-medium border-b border-[#D9B780]/15 pb-2">
          <span>{dish.category}</span>
          <Utensils className="w-3.5 h-3.5 text-[#D9B780]/75" />
        </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-display text-[1.15rem] sm:text-[1.38rem] leading-snug text-[#FFF9F1]">
              {dish.name}
            </h3>
            <span className="text-[0.92rem] font-medium text-[#D9B780] tabular-nums whitespace-nowrap shrink-0">
              {dish.priceLabel}
            </span>
          </div>

          <p className="mt-0.5 text-[0.72rem] text-[#F7F2E9]/70">
            {dish.spiceLevel}
            {isVegetarian ? " · Vegetarian" : ""}
            {isGF ? " · Gluten-Free" : ""}
          </p>

          <p
            className={`mt-1.5 text-[0.82rem] leading-relaxed text-[#F7F2E9]/85 ${
              expanded ? "" : "line-clamp-2"
            }`}
          >
            {dish.description}
          </p>
        </div>

        <div className="pt-1 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[0.72rem] uppercase tracking-[0.08em] font-medium text-[#D9B780] hover:text-[#FFF9F1] transition-colors min-h-[44px]"
            aria-expanded={expanded}
          >
            <span>{expanded ? "Less" : "Details"}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>

          <button
            type="button"
            onClick={handleAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780]/50 text-[#FFF9F1] text-[0.72rem] font-medium tracking-[0.08em] uppercase transition-colors whitespace-nowrap shrink-0 min-h-[44px]"
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#D9B780]" />
                Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5 text-[#D9B780]" />
                Add
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
}
