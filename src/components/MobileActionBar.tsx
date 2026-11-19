import { Calendar, Phone, UtensilsCrossed } from "lucide-react";
import { SITE_INFO } from "../data/site";
import type { RouteId } from "./Navbar";

interface MobileActionBarProps {
  onNavigate: (route: RouteId) => void;
  onOpenReserve: () => void;
}

export function MobileActionBar({ onNavigate, onOpenReserve }: MobileActionBarProps) {
  return (
    <nav
      aria-label="Quick Mobile Actions"
      className="fixed bottom-0 left-0 right-0 z-30 md:hidden bg-[#10110F]/95 backdrop-blur-md text-[#FFF9F1] border-t border-[#D9B780]/35 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_28px_-8px_rgba(0,0,0,0.75)]"
    >
      <div className="grid grid-cols-3 h-[56px] divide-x divide-[#D9B780]/20">
        <button
          type="button"
          onClick={() => onNavigate("menu")}
          className="flex items-center justify-center gap-1.5 text-[0.74rem] font-medium tracking-[0.06em] uppercase text-[#FFF9F1] hover:text-[#D9B780] transition-colors min-h-[44px]"
        >
          <UtensilsCrossed className="w-3.5 h-3.5 text-[#D9B780]" />
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={onOpenReserve}
          className="flex items-center justify-center gap-1.5 bg-[#811C36] active:bg-[#67142A] text-[0.76rem] font-medium tracking-[0.08em] uppercase text-[#FFF9F1] border-x border-[#D9B780]/55 min-h-[44px]"
        >
          <Calendar className="w-3.5 h-3.5 text-[#D9B780]" />
          <span>Reserve</span>
        </button>

        <a
          href={SITE_INFO.phoneHref}
          className="flex items-center justify-center gap-1.5 text-[0.74rem] font-medium tracking-[0.06em] uppercase text-[#FFF9F1] hover:text-[#D9B780] transition-colors min-h-[44px]"
        >
          <Phone className="w-3.5 h-3.5 text-[#D9B780]" />
          <span>Call</span>
        </a>
      </div>
    </nav>
  );
}
