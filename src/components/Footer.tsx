import { useState } from "react";
import { ChevronDown, Facebook, Instagram } from "lucide-react";
import { DeccanLogo } from "./DeccanLogo";
import { SITE_INFO } from "../data/site";
import { DrawGoldLine, RevealBlock } from "../lib/animations";
import { useCMS } from "../lib/cmsContext";
import type { RouteId } from "./Navbar";

interface FooterProps {
  onNavigate: (route: RouteId) => void;
  onOpenReserve: () => void;
}

export function Footer({ onNavigate, onOpenReserve }: FooterProps) {
  const { settings } = useCMS();
  const [openSection, setOpenSection] = useState<"nav" | "hours" | "visit" | null>(
    null
  );

  const toggle = (key: "nav" | "hours" | "visit") => {
    setOpenSection((prev) => (prev === key ? null : key));
  };

  const hoursList = settings.opening_hours && settings.opening_hours.length > 0
    ? settings.opening_hours
    : SITE_INFO.hours;

  return (
    <footer className="relative bg-[#10110F] text-[#FFF9F1] border-t border-[#D9B780]/20 pb-24 md:pb-12">
      <div className="luxury-container pt-12 md:pt-16">
        <DrawGoldLine className="w-full opacity-25 mb-10 md:mb-12" origin="left" />

        <RevealBlock className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-10 pb-10 border-b border-[#D9B780]/15">
          {/* Brand Column */}
          <div className="md:col-span-4 space-y-4">
            <button
              type="button"
              onClick={() => onNavigate("home")}
              aria-label="Deccan Spice Pompano Home"
              className="inline-flex items-center cursor-pointer transition-opacity duration-200 hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#D9B780]"
            >
              <DeccanLogo variant="light" size="md" />
            </button>
            <p className="text-[0.86rem] text-[#F7F2E9]/78 leading-relaxed max-w-xs">
              Authentic Indian fine dining &amp; craft bar in {settings.center || SITE_INFO.center}.
            </p>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={settings.social_links?.instagram || "https://www.instagram.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Deccan Spice Pompano on Instagram"
                className="w-10 h-10 border border-[#D9B780]/30 flex items-center justify-center text-[#FFF9F1]/85 hover:border-[#D9B780] hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={settings.social_links?.facebook || "https://www.facebook.com"}
                target="_blank"
                rel="noreferrer"
                aria-label="Deccan Spice Pompano on Facebook"
                className="w-10 h-10 border border-[#D9B780]/30 flex items-center justify-center text-[#FFF9F1]/85 hover:border-[#D9B780] hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Navigation — Collapsible on Mobile */}
          <div className="md:col-span-2 border-t border-[#D9B780]/15 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggle("nav")}
              className="w-full flex items-center justify-between cursor-pointer md:cursor-default md:pointer-events-none min-h-[44px] md:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              aria-expanded={openSection === "nav"}
            >
              <span className="font-display text-[1.2rem] text-[#D9B780]">
                Explore
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#D9B780] md:hidden transition-transform ${
                  openSection === "nav" ? "rotate-180" : ""
                }`}
              />
            </button>
            <ul
              className={`mt-2.5 space-y-2 text-[0.86rem] text-[#F7F2E9]/82 ${
                openSection === "nav" ? "block pb-2" : "hidden md:block"
              }`}
            >
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("home")}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("about")}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Our Story
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("menu")}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Menu
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("buffet")}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Weekend Buffet
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => onNavigate("gallery")}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Gallery
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenReserve}
                  className="cursor-pointer hover:text-[#D9B780] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
                >
                  Reserve a Table
                </button>
              </li>
            </ul>
          </div>

          {/* Dining Hours — Collapsible on Mobile */}
          <div className="md:col-span-3 border-t border-[#D9B780]/15 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggle("hours")}
              className="w-full flex items-center justify-between cursor-pointer md:cursor-default md:pointer-events-none min-h-[44px] md:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              aria-expanded={openSection === "hours"}
            >
              <span className="font-display text-[1.2rem] text-[#D9B780]">
                Opening Hours
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#D9B780] md:hidden transition-transform ${
                  openSection === "hours" ? "rotate-180" : ""
                }`}
              />
            </button>
            <dl
              className={`mt-2.5 space-y-2.5 text-[0.84rem] text-[#F7F2E9]/82 tabular-nums ${
                openSection === "hours" ? "block pb-2" : "hidden md:block"
              }`}
            >
              {hoursList.map((row) => (
                <div key={row.days}>
                  <dt className="font-medium text-[#FFF9F1]">{row.days}</dt>
                  <dd>
                    {row.lunch} · {row.dinner}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Contact & Address — Collapsible on Mobile */}
          <div className="md:col-span-3 border-t border-[#D9B780]/15 pt-3 md:border-t-0 md:pt-0">
            <button
              type="button"
              onClick={() => toggle("visit")}
              className="w-full flex items-center justify-between cursor-pointer md:cursor-default md:pointer-events-none min-h-[44px] md:min-h-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#D9B780]"
              aria-expanded={openSection === "visit"}
            >
              <span className="font-display text-[1.2rem] text-[#D9B780]">
                Visit &amp; Contact
              </span>
              <ChevronDown
                className={`w-4 h-4 text-[#D9B780] md:hidden transition-transform ${
                  openSection === "visit" ? "rotate-180" : ""
                }`}
              />
            </button>
            <address
              className={`not-italic mt-2.5 space-y-1.5 text-[0.84rem] text-[#F7F2E9]/82 ${
                openSection === "visit" ? "block pb-2" : "hidden md:block"
              }`}
            >
              <p className="text-[#FFF9F1] font-medium">{settings.center || SITE_INFO.center}</p>
              <p>{settings.address || SITE_INFO.address}</p>
              <p className="tabular-nums pt-1">
                <a
                  href={settings.phone_href || `tel:${settings.phone}` || SITE_INFO.phoneHref}
                  className="text-[#FFF9F1] hover:text-[#D9B780] underline underline-offset-4 transition-colors"
                >
                  {settings.phone || SITE_INFO.phoneDisplay}
                </a>
              </p>
              <p>
                <a
                  href={`mailto:${settings.email || SITE_INFO.email}`}
                  className="hover:text-[#D9B780] transition-colors"
                >
                  {settings.email || SITE_INFO.email}
                </a>
              </p>
            </address>
          </div>
        </RevealBlock>

        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[0.76rem] text-[#F7F2E9]/60">
          <p>
            &copy; {new Date().getFullYear()} {SITE_INFO.name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span>Pompano Beach, Florida</span>
            <span className="opacity-40">•</span>
            <a href="/admin" className="hover:text-[#D9B780] transition-colors">
              Staff Portal
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
