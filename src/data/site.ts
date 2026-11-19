export const ASSETS = {
  brandLogo: "/assets/aistudio/image_f73263cd.png",
  brandLogoDarkBg: "/assets/deccan-spice-logo-dark-bg.png",
  heroDiningRoom: "/src/assets/images/hero_dining_room_1794981482226.jpg",
  introInterior: "/src/assets/images/hero_interior_1794978228441.jpg",
  spicedAppetizer: "/src/assets/images/spiced_appetizer_editorial_1794983647932.jpg",
  experienceLounge: "/src/assets/images/experience_bar_lounge_1794981481916.jpg",
  buffetSpread: "/src/assets/images/buffet_spread_1794978228921.jpg",
  biryani: "/src/assets/images/biryani_signature_1794978233123.jpg",
  lambChops: "/src/assets/images/tandoori_sizzler_1794978230226.jpg",
  tikkaMasala: "/src/assets/images/curry_naan_plate_1794978230600.jpg",
  tandooriSpecialties: "/src/assets/images/tandoori_specialties_1794981483880.jpg",
  craftCocktails: "/src/assets/images/craft_cocktail_bar_1794981483570.jpg",
  dessertMithai: "/src/assets/images/dessert_mithai_editorial_1794983648777.jpg",
  reservationTable: "/src/assets/images/reservation_table_1794983647500.jpg",
} as const;

export const SITE_INFO = {
  name: "Deccan Spice Pompano",
  shortName: "Deccan Spice",
  tagline: "Indian Kitchen & Bar",
  address: "1151 S Federal Hwy, Pompano Beach, FL 33062",
  center: "Pompano Marketplace",
  country: "United States",
  phoneDisplay: "+1 954-366-1847",
  phoneHref: "tel:+19543661847",
  email: "dspicepompano@gmail.com",
  emailHref: "mailto:dspicepompano@gmail.com",
  opensDaily: "Opens daily at 11:30 AM",
  priceRange: "$20–30 per person",
  buffetLabel: "Friday Buffet · Popular Weekend Buffet",
  hours: [
    { days: "Sun", lunch: "11:30 AM – 3:00 PM", dinner: "5:00 – 9:30 PM" },
    { days: "Mon–Thu", lunch: "11:30 AM – 3:00 PM", dinner: "5:00 – 10:00 PM" },
    { days: "Fri–Sat", lunch: "11:30 AM – 3:00 PM", dinner: "5:00 – 10:30 PM" },
  ],
  ratings: [
    {
      platform: "Google",
      score: "4.4",
      detail: "1,081 verified reviews",
      summary:
        "Guest favorites highlighted across Google reviews include slow-steamed Hyderabadi dum biryani, sizzling tandoori platters, and warm evening hospitality in Pompano Marketplace.",
    },
    {
      platform: "Tripadvisor",
      score: "4.4",
      detail: "Verified diner rating",
      summary:
        "Recognized on Tripadvisor for our Friday & weekend lunch buffet presentation, clay-oven blistered garlic naan, and attentive dining room service.",
    },
    {
      platform: "Facebook",
      score: "4.9",
      detail: "40 community recommendations",
      summary:
        "Recommended by local South Florida diners for family celebrations, spiced craft cocktails at the bar, and authentic regional Deccan specialties.",
    },
  ],
};

export interface SignatureShowcaseItem {
  id: string;
  name: string;
  course: string;
  priceLabel: string;
  tagline: string;
  image: string;
  moodBg: string;
}

export const SIGNATURE_SHOWCASE: SignatureShowcaseItem[] = [
  {
    id: "hyderabadi-dum-biryani",
    name: "Hyderabadi Dum Biryani",
    course: "Royal Dum Handi",
    priceLabel: "$19.00+",
    tagline: "Saffron basmati sealed and steamed over whole Deccan spices.",
    image: ASSETS.biryani,
    moodBg: "radial-gradient(circle at 65% 42%, rgba(217,183,128,0.16), rgba(16,17,15,0.7) 52%, #10110F 88%)",
  },
  {
    id: "royale-lamb-chops",
    name: "Hyderabadi Royale Lamb Chops",
    course: "Charcoal Tandoor",
    priceLabel: "$28.00",
    tagline: "Char-seared lamb rack marinated in Kashmiri chili and yogurt.",
    image: ASSETS.lambChops,
    moodBg: "radial-gradient(circle at 65% 42%, rgba(129,28,54,0.28), rgba(16,17,15,0.72) 54%, #10110F 88%)",
  },
  {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    course: "Signature Curry",
    priceLabel: "$20.00",
    tagline: "Clay-oven roasted chicken in velvety tomato fenugreek cream.",
    image: ASSETS.tikkaMasala,
    moodBg: "radial-gradient(circle at 65% 42%, rgba(18,53,43,0.38), rgba(16,17,15,0.76) 56%, #10110F 90%)",
  },
  {
    id: "tandoori-specialties",
    name: "Tandoori Specialties",
    course: "From the Clay Oven",
    priceLabel: "$26.00",
    tagline: "Smoky skewers and spiced prawns charred over clay embers.",
    image: ASSETS.tandooriSpecialties,
    moodBg: "radial-gradient(circle at 65% 42%, rgba(217,183,128,0.14), rgba(18,53,43,0.3) 50%, #10110F 88%)",
  },
];

export type MenuCategory =
  | "Starters & Chaat"
  | "Hyderabadi Biryanis"
  | "Tandoori Sizzlers"
  | "Signature Curries"
  | "Breads & Dosa"
  | "Desserts & Chai";

export interface DishItem {
  id: string;
  name: string;
  category: MenuCategory;
  price: number;
  priceLabel: string;
  description: string;
  dietary: ("Vegetarian" | "Gluten-Free" | "Chef Signature")[];
  spiceLevel: "Mild" | "Medium" | "Signature Spice";
  image?: string;
}

export const MENU_CATEGORIES: MenuCategory[] = [
  "Starters & Chaat",
  "Hyderabadi Biryanis",
  "Tandoori Sizzlers",
  "Signature Curries",
  "Breads & Dosa",
  "Desserts & Chai",
];

export const MENU_ITEMS: DishItem[] = [
  {
    id: "hyderabadi-dum-biryani",
    name: "Hyderabadi Dum Biryani",
    category: "Hyderabadi Biryanis",
    price: 19.0,
    priceLabel: "$19.00+",
    description:
      "Aged basmati rice slow-steamed over saffron, caramelized shallots, fresh mint, and house-roasted Deccan garam masala in a sealed handi.",
    dietary: ["Chef Signature", "Gluten-Free"],
    spiceLevel: "Signature Spice",
    image: ASSETS.biryani,
  },
  {
    id: "royale-lamb-chops",
    name: "Hyderabadi Royale Lamb Chops",
    category: "Tandoori Sizzlers",
    price: 28.0,
    priceLabel: "$28.00",
    description:
      "Char-seared lamb rack chops marinated 24 hours in raw papaya, Kashmiri chili, and hung yogurt, served sizzling with mint chutney.",
    dietary: ["Chef Signature", "Gluten-Free"],
    spiceLevel: "Medium",
    image: ASSETS.lambChops,
  },
  {
    id: "chicken-tikka-masala",
    name: "Chicken Tikka Masala",
    category: "Signature Curries",
    price: 20.0,
    priceLabel: "$20.00",
    description:
      "Clay-oven roasted chicken folded into a velvety vine-ripened tomato, fenugreek leaf, and cultured cream reduction.",
    dietary: ["Chef Signature", "Gluten-Free"],
    spiceLevel: "Mild",
    image: ASSETS.tikkaMasala,
  },
  {
    id: "tandoori-mixed-grill",
    name: "Deccan Tandoori Mixed Sizzler",
    category: "Tandoori Sizzlers",
    price: 26.0,
    priceLabel: "$26.00",
    description:
      "Assortment of chicken tikka, malai kabab, seekh kabab, and spiced jumbo shrimp over charred sweet peppers and red onions.",
    dietary: ["Gluten-Free"],
    spiceLevel: "Medium",
    image: ASSETS.tandooriSpecialties,
  },
  {
    id: "railway-pakora",
    name: "Railway Pakora & Crispy Rolls",
    category: "Starters & Chaat",
    price: 11.0,
    priceLabel: "$11.00",
    description:
      "Crisp spiced chickpea-battered fritters and golden vegetable rolls served with tamarind glaze and sweet chili reduction.",
    dietary: ["Vegetarian"],
    spiceLevel: "Medium",
    image: ASSETS.spicedAppetizer,
  },
  {
    id: "chicken-65",
    name: "Deccan Chicken 65",
    category: "Starters & Chaat",
    price: 15.0,
    priceLabel: "$15.00",
    description:
      "Crisp boneless bites tossed with blistered curry leaves, mustard seed, crushed garlic, and fiery red Guntur chilies.",
    dietary: ["Chef Signature"],
    spiceLevel: "Signature Spice",
  },
  {
    id: "egg-biryani",
    name: "Nizam Egg Dum Biryani",
    category: "Hyderabadi Biryanis",
    price: 17.0,
    priceLabel: "$17.00+",
    description:
      "Farm eggs simmered in spiced cashew-onion masala and layered beneath aromatic saffron basmati with cooling burani raita.",
    dietary: ["Gluten-Free"],
    spiceLevel: "Medium",
  },
  {
    id: "paneer-dum-biryani",
    name: "Subz & Paneer Dum Biryani",
    category: "Hyderabadi Biryanis",
    price: 18.0,
    priceLabel: "$18.00",
    description:
      "Fresh cottage cheese cubes and seasonal market vegetables slow-cooked with rose water, saffron strands, and toasted cashews.",
    dietary: ["Vegetarian", "Gluten-Free"],
    spiceLevel: "Medium",
  },
  {
    id: "saagwala",
    name: "Palak Paneer Saagwala",
    category: "Signature Curries",
    price: 18.5,
    priceLabel: "$18.50",
    description:
      "Silky stone-ground spinach simmered with roasted garlic, cumin, ginger juliennes, and pillowy house-pressed paneer.",
    dietary: ["Vegetarian", "Gluten-Free"],
    spiceLevel: "Mild",
  },
  {
    id: "gongura-goat",
    name: "Andhra Gongura Goat Curry",
    category: "Signature Curries",
    price: 23.0,
    priceLabel: "$23.00",
    description:
      "Bone-in goat braised slowly with tangy sorrel leaves, whole Tellicherry peppercorns, and toasted coriander.",
    dietary: ["Chef Signature", "Gluten-Free"],
    spiceLevel: "Signature Spice",
  },
  {
    id: "masala-dosa",
    name: "Crisp Mysore Masala Dosa",
    category: "Breads & Dosa",
    price: 15.0,
    priceLabel: "$15.00",
    description:
      "Golden fermented rice-and-lentil crepe brushed with spiced red chutney, filled with turmeric potato mash, sambar, and coconut chutney.",
    dietary: ["Vegetarian", "Gluten-Free"],
    spiceLevel: "Medium",
  },
  {
    id: "garlic-naan",
    name: "Blistered Garlic Naan",
    category: "Breads & Dosa",
    price: 4.5,
    priceLabel: "$4.50",
    description:
      "Hand-stretched leavened flatbread baked on clay tandoor walls and finished with roasted garlic, cilantro, and cultured butter.",
    dietary: ["Vegetarian"],
    spiceLevel: "Mild",
  },
  {
    id: "gulab-jamun",
    name: "Warm Cardamom Gulab Jamun",
    category: "Desserts & Chai",
    price: 6.0,
    priceLabel: "$6.00",
    description:
      "Golden milk-solid dumplings steeped in rosewater, green cardamom, and saffron blossom syrup.",
    dietary: ["Vegetarian"],
    spiceLevel: "Mild",
    image: ASSETS.dessertMithai,
  },
  {
    id: "iriani-chai",
    name: "Hyderabadi Irani Masala Chai",
    category: "Desserts & Chai",
    price: 4.0,
    priceLabel: "$4.00+",
    description:
      "Slow-reduced Assam black tea brewed with crushed cardamom pods, cinnamon bark, ginger root, and caramelized milk.",
    dietary: ["Vegetarian", "Gluten-Free"],
    spiceLevel: "Mild",
  },
];

export const BUFFET_SECTIONS = [
  {
    title: "Chaat & Street Starters",
    items: [
      { name: "Crispy Onion & Spinach Pakora", note: "Tamarind & mint chutneys" },
      { name: "Dahi Papdi Chaat Station", note: "Cool yogurt, pomegranate, sev" },
      { name: "Deccan Chicken 65", note: "Curry leaf & Guntur chili toss" },
    ],
  },
  {
    title: "The Dum Handi & Tandoor",
    items: [
      { name: "Hyderabadi Chicken Dum Biryani", note: "Saffron basmati & burani raita" },
      { name: "Subz Vegetable Dum Biryani", note: "Aromatic whole spices" },
      { name: "Tandoori Chicken Tikka & Fresh Garlic Naan", note: "Served warm to the table" },
    ],
  },
  {
    title: "Regional Curries & Mithai",
    items: [
      { name: "Velvet Butter Chicken & Goat Curry", note: "Slow-braised regional gravies" },
      { name: "Dal Tadka & Palak Paneer", note: "Vegetarian classics" },
      { name: "Warm Cardamom Gulab Jamun & Rice Kheer", note: "Traditional sweet finale" },
    ],
  },
];

export type GalleryCategory =
  | "The Restaurant"
  | "Signature Cuisine"
  | "Celebrations"
  | "Dining Experience";

export interface GalleryPhoto {
  id: string;
  title: string;
  category: GalleryCategory;
  caption: string;
  image: string;
}

export const GALLERY_CATEGORIES: GalleryCategory[] = [
  "The Restaurant",
  "Signature Cuisine",
  "Celebrations",
  "Dining Experience",
];

export const GALLERY_ITEMS: GalleryPhoto[] = [
  {
    id: "gal-buffet",
    title: "Marble & Brass Buffet Counter",
    category: "The Restaurant",
    caption: "Copper chafing vessels framed by illuminated geometric lattice screens.",
    image: ASSETS.buffetSpread,
  },
  {
    id: "gal-cocktails",
    title: "Spiced Craft Cocktails at the Bar",
    category: "Celebrations",
    caption: "Tamarind margaritas and smoked cardamom old fashioneds poured fresh at the bar.",
    image: ASSETS.craftCocktails,
  },
  {
    id: "gal-mithai",
    title: "Saffron Cardamom Gulab Jamun",
    category: "Signature Cuisine",
    caption: "Warm golden dumplings steeped in rosewater and crushed green cardamom.",
    image: ASSETS.dessertMithai,
  },
  {
    id: "gal-dining-room",
    title: "Main Dining Room & Brass Chandeliers",
    category: "The Restaurant",
    caption: "Deep emerald paneling, warm globe lighting, and candlelit tables set in brass.",
    image: ASSETS.heroDiningRoom,
  },
  {
    id: "gal-celebration",
    title: "Evening Toasts & Group Dining",
    category: "Celebrations",
    caption: "Memorable gatherings over saffron cocktails and shared brass handis.",
    image: ASSETS.experienceLounge,
  },
  {
    id: "gal-biryani",
    title: "Hyderabadi Dum Biryani Handi",
    category: "Signature Cuisine",
    caption: "Saffron-infused basmati steamed with crispy shallots and fresh mint.",
    image: ASSETS.biryani,
  },
  {
    id: "gal-tandoori",
    title: "Tandoori Specialties on Slate",
    category: "Signature Cuisine",
    caption: "Malai chicken skewers, spiced shrimp, and emerald mint chutney.",
    image: ASSETS.tandooriSpecialties,
  },
  {
    id: "gal-evening-table",
    title: "Candlelit Dinner Table",
    category: "Dining Experience",
    caption: "Hammered brass charger plates and warm candlelight for intimate evenings.",
    image: ASSETS.reservationTable,
  },
];
