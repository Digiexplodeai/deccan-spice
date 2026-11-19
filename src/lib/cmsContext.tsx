import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  ASSETS,
  GALLERY_ITEMS,
  SIGNATURE_SHOWCASE,
  SITE_INFO,
} from "../data/site";
import {
  isSupabaseConfigured,
  supabase,
  type CmsReview,
  type GalleryItem,
  type SignatureDish,
  type SiteSection,
  type SiteSettings,
} from "./supabase";

// Default Initial Fallbacks derived from static content
const DEFAULT_SETTINGS: SiteSettings = {
  id: "current",
  restaurant_name: SITE_INFO.name,
  short_name: SITE_INFO.shortName,
  tagline: SITE_INFO.tagline,
  logo_url: ASSETS.brandLogo,
  logo_dark_url: ASSETS.brandLogoDarkBg,
  phone: SITE_INFO.phoneDisplay,
  phone_href: SITE_INFO.phoneHref,
  email: SITE_INFO.email,
  address: SITE_INFO.address,
  center: SITE_INFO.center,
  google_maps_url: "https://maps.google.com/?q=1151+S+Federal+Hwy,+Pompano+Beach,+FL+33062",
  reservation_url: "#reserve",
  reservation_phone: SITE_INFO.phoneDisplay,
  price_range: SITE_INFO.priceRange,
  opens_daily: SITE_INFO.opensDaily,
  buffet_label: SITE_INFO.buffetLabel,
  social_links: {
    instagram: "https://www.instagram.com",
    facebook: "https://www.facebook.com",
    tripadvisor: "https://www.tripadvisor.com",
    yelp: "https://www.yelp.com",
  },
  opening_hours: SITE_INFO.hours,
  seo_title: "Deccan Spice Pompano | India, Served Beautifully",
  seo_description:
    "Indian Fine Dining in Pompano Beach, Florida. Authentic Hyderabadi dum biryanis, charred tandoori sizzlers, regional curries, and craft cocktails.",
  updated_at: new Date().toISOString(),
};

const DEFAULT_SECTIONS: Record<string, SiteSection> = {
  hero: {
    id: "hero",
    key: "hero",
    title: "India, Served",
    subtitle: "Beautifully.",
    eyebrow: "INDIAN FINE DINING · POMPANO BEACH",
    body: "Authentic flavors. Extraordinary moments.",
    button_text: "Reserve a Table",
    button_link: "#reserve",
    secondary_button_text: "Explore Our Menu",
    secondary_button_link: "menu",
    image_url: ASSETS.heroDiningRoom,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 1,
    extra: { badge: "POMPANO BEACH, FL" },
    updated_at: new Date().toISOString(),
  },
  marquee: {
    id: "marquee",
    key: "marquee",
    title: "Brand Strip",
    subtitle: null,
    eyebrow: null,
    body: null,
    button_text: null,
    button_link: null,
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: null,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 2,
    extra: {
      items: [
        "HYDERABADI DUM BIRYANI",
        "FRIDAY & WEEKEND LUNCH BUFFET",
        "CHARCOAL TANDOOR SIZZLERS",
        "CRAFT COCKTAIL BAR",
        "SOUTH FLORIDA FINE DINING",
      ],
    },
    updated_at: new Date().toISOString(),
  },
  story: {
    id: "story",
    key: "story",
    title: "Crafted by Fire, Saffron & Memory",
    subtitle: "From the Deccan Plateau to South Florida",
    eyebrow: "OUR HERITAGE · POMPANO BEACH",
    body: "At Deccan Spice Pompano, we present royal Indian gastronomy shaped by slow-steamed handi cookery, embers of live clay ovens, and South Florida evening elegance.\n\nFrom fragrant Hyderabadi handis layered with saffron basmati to tender clay-oven tandoori sizzlers, our kitchen honors ancestral South Indian recipes with uncompromised hospitality.",
    button_text: "Our Full Story",
    button_link: "about",
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: ASSETS.introInterior,
    secondary_image_url: ASSETS.spicedAppetizer,
    is_visible: true,
    sort_order: 3,
    extra: {},
    updated_at: new Date().toISOString(),
  },
  signature: {
    id: "signature",
    key: "signature",
    title: "Culinary Masterpieces",
    subtitle: "Prepared with whole spices roasted daily and centuries-old Hyderabadi technique.",
    eyebrow: "SIGNATURE CREATIONS",
    body: null,
    button_text: "Explore Full Menu",
    button_link: "menu",
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: null,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 4,
    extra: {},
    updated_at: new Date().toISOString(),
  },
  banner: {
    id: "banner",
    key: "banner",
    title: "More Than a Meal. An Occasion.",
    subtitle: "Acclaimed Friday & Weekend Lunch Buffet in Pompano Marketplace",
    eyebrow: "THE DECCAN SPICE EXPERIENCE",
    body: "Whether joining us for our acclaimed Friday & weekend lunch buffet or an intimate candlelit dinner in Pompano Marketplace, every moment is served with extraordinary attention.",
    button_text: "Explore Weekend Buffet",
    button_link: "buffet",
    secondary_button_text: "Call to Inquire",
    secondary_button_link: "tel:+19543661847",
    image_url: ASSETS.experienceLounge,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 5,
    extra: {},
    updated_at: new Date().toISOString(),
  },
  gallery: {
    id: "gallery",
    key: "gallery",
    title: "Immerse in the Elegance",
    subtitle: "A glimpse into our candlelit dining spaces, private event celebrations, and culinary craft.",
    eyebrow: "ATMOSPHERE & CELEBRATIONS",
    body: null,
    button_text: "View Full Gallery",
    button_link: "gallery",
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: null,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 6,
    extra: {},
    updated_at: new Date().toISOString(),
  },
  reviews: {
    id: "reviews",
    key: "reviews",
    title: "What South Florida Diners Say",
    subtitle: "Over 1,000 verified diner reviews celebrating our slow-steamed biryanis, clay oven sizzlers, and warm hospitality.",
    eyebrow: "GUEST VOICES & CRITICAL ACCLAIM",
    body: null,
    button_text: null,
    button_link: null,
    secondary_button_text: null,
    secondary_button_link: null,
    image_url: null,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 7,
    extra: {},
    updated_at: new Date().toISOString(),
  },
  cta: {
    id: "cta",
    key: "cta",
    title: "An Unforgettable Evening Awaits",
    subtitle: null,
    eyebrow: "JOIN US TONIGHT",
    body: "Reserve your table in our candlelit dining room or call us directly. Walk-ins warmly welcomed for dining room & cocktail bar seating.",
    button_text: "Reserve Online",
    button_link: "#reserve",
    secondary_button_text: "Call +1 954-366-1847",
    secondary_button_link: "tel:+19543661847",
    image_url: ASSETS.reservationTable,
    secondary_image_url: null,
    is_visible: true,
    sort_order: 8,
    extra: {},
    updated_at: new Date().toISOString(),
  },
};

const DEFAULT_SIGNATURE_DISHES: SignatureDish[] = SIGNATURE_SHOWCASE.map((d, i) => ({
  id: d.id,
  name: d.name,
  course: d.course,
  price_label: d.priceLabel,
  description: d.tagline,
  tagline: d.tagline,
  image_url: d.image,
  mood_bg: d.moodBg,
  sort_order: i + 1,
  is_visible: true,
  created_at: new Date().toISOString(),
}));

const DEFAULT_GALLERY: GalleryItem[] = GALLERY_ITEMS.map((g, i) => ({
  id: g.id,
  title: g.title,
  caption: g.caption,
  category: g.category,
  image_url: g.image,
  sort_order: i + 1,
  is_visible: true,
  created_at: new Date().toISOString(),
}));

const DEFAULT_REVIEWS: CmsReview[] = SITE_INFO.ratings.map((r, i) => ({
  id: `rev-${i}`,
  author: "Verified Diners",
  source: r.platform,
  rating: r.score,
  detail: r.detail,
  text: r.summary,
  sort_order: i + 1,
  is_visible: true,
  created_at: new Date().toISOString(),
}));

interface CmsContextValue {
  settings: SiteSettings;
  sections: Record<string, SiteSection>;
  gallery: GalleryItem[];
  signatureDishes: SignatureDish[];
  reviews: CmsReview[];
  isLoading: boolean;
  refreshCMS: () => Promise<void>;
}

const CmsContext = createContext<CmsContextValue>({
  settings: DEFAULT_SETTINGS,
  sections: DEFAULT_SECTIONS,
  gallery: DEFAULT_GALLERY,
  signatureDishes: DEFAULT_SIGNATURE_DISHES,
  reviews: DEFAULT_REVIEWS,
  isLoading: false,
  refreshCMS: async () => {},
});

export function CmsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SETTINGS);
  const [sections, setSections] = useState<Record<string, SiteSection>>(DEFAULT_SECTIONS);
  const [gallery, setGallery] = useState<GalleryItem[]>(DEFAULT_GALLERY);
  const [signatureDishes, setSignatureDishes] = useState<SignatureDish[]>(DEFAULT_SIGNATURE_DISHES);
  const [reviews, setReviews] = useState<CmsReview[]>(DEFAULT_REVIEWS);
  const [isLoading, setIsLoading] = useState(true);

  const fetchCMS = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setIsLoading(false);
      return;
    }

    try {
      // 1. Fetch site_settings
      const { data: settingsData } = await supabase
        .from("site_settings")
        .select("*")
        .eq("id", "current")
        .maybeSingle();

      if (settingsData) {
        setSettings((prev) => ({ ...prev, ...(settingsData as SiteSettings) }));
      }

      // 2. Fetch site_sections
      const { data: sectionsData } = await supabase
        .from("site_sections")
        .select("*")
        .order("sort_order", { ascending: true });

      if (sectionsData && sectionsData.length > 0) {
        const secMap: Record<string, SiteSection> = {};
        for (const sec of sectionsData as SiteSection[]) {
          secMap[sec.key] = sec;
        }
        setSections((prev) => ({ ...prev, ...secMap }));
      }

      // 3. Fetch gallery_items
      const { data: galleryData } = await supabase
        .from("gallery_items")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });

      if (galleryData && galleryData.length > 0) {
        setGallery(galleryData as GalleryItem[]);
      }

      // 4. Fetch signature_dishes
      const { data: dishesData } = await supabase
        .from("signature_dishes")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });

      if (dishesData && dishesData.length > 0) {
        setSignatureDishes(dishesData as SignatureDish[]);
      }

      // 5. Fetch reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_visible", true)
        .order("sort_order", { ascending: true });

      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData as CmsReview[]);
      }
    } catch {
      // Graceful fallback to static data
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCMS();
  }, [fetchCMS]);

  // Sync SEO metadata with document head
  useEffect(() => {
    if (settings.seo_title && typeof document !== "undefined") {
      document.title = settings.seo_title;
    }

    if (settings.seo_description && typeof document !== "undefined") {
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.setAttribute("name", "description");
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute("content", settings.seo_description);
    }
  }, [settings.seo_title, settings.seo_description]);

  return (
    <CmsContext.Provider
      value={{
        settings,
        sections,
        gallery,
        signatureDishes,
        reviews,
        isLoading,
        refreshCMS: fetchCMS,
      }}
    >
      {children}
    </CmsContext.Provider>
  );
}

export function useCMS() {
  return useContext(CmsContext);
}
