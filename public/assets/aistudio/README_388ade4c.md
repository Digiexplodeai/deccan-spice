# Deccan Spice Pompano — Design V4 ("Warm Editorial Luxury")

A flagship, Awwwards-inspired, high-performance website crafted for **Deccan Spice Pompano** (*Indian Kitchen & Bar located in Pompano Marketplace, 1151 S Federal Hwy, Pompano Beach, FL 33062*).

Rebuilt in **Design V4** with a warm editorial luxury direction:
- **Full Fluid Width & Scaling:** Replaced narrow 55% center column wrappers with a global container `width: min(100% - 3rem, 1560px); margin-inline: auto;` and fluid root typography `html { font-size: clamp(16px, 0.42vw + 11px, 21px); }` that scales gracefully on 1920px widescreen monitors.
- **3 Dynamic Color Themes:** Switched via `?theme=a|b|c` in the URL, stored in localStorage, with a preview switcher pill:
  - **Theme A (Default): "Peacock and Brass"** (`--bg: #FAF5EA`, `--bg-alt: #F1E8D6`, `--deep: #0C3A40`, `--brass: #B8893B`, `--cta: #C82028`)
  - **Theme B: "Midnight and Champagne"** (`--bg: #F7F2E8`, `--bg-alt: #ECE4D3`, `--deep: #0A0F14`, `--brass: #A9823F`, `--cta: #C82028`)
  - **Theme C: "Marigold and Aubergine"** (`--bg: #FFF8EC`, `--bg-alt: #FBEBCF`, `--deep: #2B1033`, `--brass: #D68A10`, `--cta: #C82028`)
- **Typography:** Display serif `Playfair Display (500)` with italic accent words in brass, body `Manrope (400/500)`, fluid clamps for H1 (`clamp(3.2rem, 6.2vw, 7.5rem)`) and H2 (`clamp(2.4rem, 4vw, 4.5rem)`). No monospace fonts.
- **Natural Photography:** All artificial CSS filters, saturation boosts, and dark color washes removed. Real restaurant assets displayed crisp and natural.
- **Floating Pill Navbar:** Centered 72px pill (`rounded-full`), floating 20px from top, hides smoothly on scroll down and reappears on scroll up. Real red logo sits strictly on ivory background.
- **Friday Buffet:** Rebuilt as a split-screen experience with a large sticky authentic buffet photograph on the left and a printed typographic menu list on the right with thin brass dividers.
- **Cleaned-up Copy:** Zero visible "TODO" notes, zero invented claims or service promises.

---

## 🎨 Color Themes

Switch between themes anytime by appending `?theme=a`, `?theme=b`, or `?theme=c` to the URL, or using the floating pill in the bottom-left corner:

| Variable | Role | Theme A (Peacock & Brass) | Theme B (Midnight & Champagne) | Theme C (Marigold & Aubergine) |
| :--- | :--- | :--- | :--- | :--- |
| `--bg` | Page background (Ivory) | `#FAF5EA` | `#F7F2E8` | `#FFF8EC` |
| `--bg-alt` | Alternate sections & cards | `#F1E8D6` | `#ECE4D3` | `#FBEBCF` |
| `--deep` | Deep feature sections | `#0C3A40` | `#0A0F14` | `#2B1033` |
| `--deep-2` | Footer & hero overlay base | `#082A2F` | `#121A22` | `#1D0A23` |
| `--brass` | Hairlines, stars, italic accents | `#B8893B` | `#A9823F` | `#D68A10` |
| `--brass-light` | Subtitles on deep sections | `#D9B26A` | `#D9B97A` | `#F2A52B` |
| `--ink` | High-contrast body text | `#14201F` | `#12161A` | `#1E1521` |
| `--muted` | Secondary body text | `#55615F` | `#566069` | `#625568` |
| `--on-deep` | Text on deep sections | `#F6EFE0` | `#F4EEE2` | `#FFF1DC` |
| `--cta` | Primary buttons (logo red) | `#C82028` | `#C82028` | `#C82028` |

---

## 📸 Real Asset Reference & Placement Table

| Asset File | Subject / Description | Where Used in Application |
| :--- | :--- | :--- |
| `/brand/logo.png` | Official Deccan Spice transparent PNG logo | Floating pill `Navbar`, Mobile Drawer, `Preloader`, and `Footer` (ivory badge) |
| `/images/hero-interior.jpg` | Main dining room view with globe chandeliers & illuminated bar | `HeroSection` (full-bleed natural interior with soft bottom gradient) |
| `/images/dining-room.jpg` | Tufted leather dining banquette with royal heritage wall frames | `EditorialIntro` (large photo), `app/buffet/page.tsx`, `app/about/page.tsx`, Gallery |
| `/images/bar.jpg` | Illuminated cocktail bar with backlit liquor shelving | `EditorialIntro` (offset floating photo), `app/about/page.tsx`, Gallery |
| `/images/buffet.jpg` | Marble buffet counter with golden geometric lattice screen | `WeekendBuffetBanner` (sticky left photo), `app/buffet/page.tsx`, Gallery |
| `/images/biryani.jpg` | Steaming vegetable biryani in buffet chafing dish | `SignatureDishesCarousel.tsx`, `MenuCard.tsx`, Menu Explorer, Gallery |
| `/images/tandoori-sizzler.jpg` | Sizzling cast-iron skillet with tandoori grilled meat, onions, lime | Hyderabadi Royale Lamb Chops in `SignatureDishesCarousel.tsx`, Menu Explorer, Gallery |
| `/images/curry-rice-plate.jpg` | Dinner plate with rich chicken curry, rice, and fresh naan | Chicken Tikka Masala in `SignatureDishesCarousel.tsx`, Menu Explorer, Gallery |
| `/images/appetizer-rolls.jpg` | Crispy golden appetizer rolls on black slate with sweet chili dip | Railway Pakora in `SignatureDishesCarousel.tsx`, Menu Explorer, Gallery |
| `/images/noodles-appetizer.jpg` | Indo-Chinese stir-fried wok noodles with shredded vegetables | Indo-Chinese Special in `MenuCard.tsx`, Menu Explorer, Gallery |
| `/images/communal-table.jpg` | Solid wood communal banqueting table with brass inlays | `AtmosphereSection` full-bleed band, Gallery, `app/buffet/page.tsx` |
| `/images/banquette.jpg` | Button-tufted dining booths with lighting | Photo Gallery (`/gallery`) |
| `/images/wine-and-bar.jpg` | Glass wine display case looking through to the full bar | Photo Gallery (`/gallery`) |
| `/images/exterior.jpg` | Daylight photo of Deccan Spice red channel-letter signage | Photo Gallery (`/gallery`) |
| `/images/storefront-entrance.jpg`| Main entryway & exterior at Pompano Marketplace | Photo Gallery (`/gallery`) |
| *No Image (Designed Card)* | Elegant card on `--bg-alt` with `--brass` border & Playfair typography | Gulab Jamun Dessert ($6.00), Egg Biryani ($17.00+), Chai ($4.00+), Naan, Saagwala, Masala Dosa |

---

## 📍 Business Details (Exact & Unaltered)

All business details are maintained centrally in **[`data/site.ts`](./data/site.ts)**:

- **Name:** Deccan Spice Pompano
- **Address:** 1151 S Federal Hwy, Pompano Beach, FL 33062, United States *(located in Pompano Marketplace)*
- **Phone:** `+1 954-366-1847` (clickable `tel:+19543661847` link everywhere)
- **Email:** `dspicepompano@gmail.com`
- **Opening Time:** Opens daily at 11:30 AM
- **Price Range:** $20–30 per person ($$)
- **Ratings:** 4.4 Stars on Google (1,081 reviews), 4.4 on Tripadvisor, 4.9 on Facebook (40 votes)
- **Split Hours:**
  - Sun: 11:30 AM – 3:00 PM & 5:00 – 9:30 PM
  - Mon–Thu: 11:30 AM – 3:00 PM & 5:00 – 10:00 PM
  - Fri–Sat: 11:30 AM – 3:00 PM & 5:00 – 10:30 PM
- **Friday & Weekend Buffet:** "Friday Buffet · Also our popular weekend buffet"

---

## 🚀 Running Locally

\`\`\`bash
# 1. Install dependencies
npm install

# 2. Build for production
npm run build

# 3. Start production server
npm run start
\`\`\`

Open [http://localhost:3000](http://localhost:3000) (or `http://localhost:3000?theme=b` / `?theme=c`) to view the live site.
