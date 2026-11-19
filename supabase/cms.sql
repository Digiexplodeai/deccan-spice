-- ==============================================================================
-- Deccan Spice Pompano: CMS & Full Website Content Management Schema
-- ==============================================================================
-- Run this script in the Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- Storage for images is handled via Cloudflare R2 (presigned URLs).
-- Do NOT create any Supabase Storage bucket or storage policies.
-- ==============================================================================

-- 1. ADMIN HELPER FUNCTION
-- Used in write policies. Currently permits any authenticated user.
-- To restrict to specific emails later, change to:
--   SELECT auth.jwt()->>'email' IN ('owner@deccanspice.com', 'admin@deccanspice.com');
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT auth.role() = 'authenticated';
$$;

-- 2. ALTER EXISTING TABLES
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS image_key TEXT;

-- 3. CMS TABLES

-- Table: site_settings (Single-row configuration for branding, contacts, hours, SEO)
CREATE TABLE IF NOT EXISTS public.site_settings (
  id TEXT PRIMARY KEY DEFAULT 'current',
  restaurant_name TEXT NOT NULL DEFAULT 'Deccan Spice Pompano',
  short_name TEXT DEFAULT 'Deccan Spice',
  tagline TEXT DEFAULT 'Indian Kitchen & Bar',
  logo_url TEXT DEFAULT '/assets/aistudio/image_f73263cd.png',
  logo_key TEXT,
  logo_dark_url TEXT DEFAULT '/assets/deccan-spice-logo-dark-bg.png',
  logo_dark_key TEXT,
  phone TEXT DEFAULT '+1 954-366-1847',
  phone_href TEXT DEFAULT 'tel:+19543661847',
  email TEXT DEFAULT 'dspicepompano@gmail.com',
  address TEXT DEFAULT '1151 S Federal Hwy, Pompano Beach, FL 33062',
  center TEXT DEFAULT 'Pompano Marketplace',
  google_maps_url TEXT DEFAULT 'https://maps.google.com/?q=1151+S+Federal+Hwy,+Pompano+Beach,+FL+33062',
  reservation_url TEXT DEFAULT '#reserve',
  reservation_phone TEXT DEFAULT '+1 954-366-1847',
  price_range TEXT DEFAULT '$20–30 per person',
  opens_daily TEXT DEFAULT 'Opens daily at 11:30 AM',
  buffet_label TEXT DEFAULT 'Friday Buffet · Popular Weekend Buffet',
  social_links JSONB DEFAULT '{"instagram": "https://www.instagram.com", "facebook": "https://www.facebook.com", "tripadvisor": "https://www.tripadvisor.com", "yelp": "https://www.yelp.com"}'::jsonb,
  opening_hours JSONB DEFAULT '[{"days": "Sun", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 9:30 PM"}, {"days": "Mon–Thu", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 10:00 PM"}, {"days": "Fri–Sat", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 10:30 PM"}]'::jsonb,
  seo_title TEXT DEFAULT 'Deccan Spice Pompano | India, Served Beautifully',
  seo_description TEXT DEFAULT 'Indian Fine Dining in Pompano Beach, Florida. Authentic Hyderabadi dum biryanis, charred tandoori sizzlers, regional curries, and craft cocktails.',
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: site_sections (Controls Hero, Story, Signature, Banner, Gallery, Reviews, CTA, Footer)
CREATE TABLE IF NOT EXISTS public.site_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  eyebrow TEXT,
  body TEXT,
  button_text TEXT,
  button_link TEXT,
  secondary_button_text TEXT,
  secondary_button_link TEXT,
  image_url TEXT,
  image_key TEXT,
  image_alt TEXT,
  secondary_image_url TEXT,
  secondary_image_key TEXT,
  secondary_image_alt TEXT,
  is_visible BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  extra JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: gallery_items (Atmosphere & Celebrations gallery)
CREATE TABLE IF NOT EXISTS public.gallery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  caption TEXT,
  category TEXT DEFAULT 'The Restaurant',
  image_url TEXT NOT NULL,
  image_key TEXT,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: signature_dishes (Homepage showcase carousel)
CREATE TABLE IF NOT EXISTS public.signature_dishes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  course TEXT DEFAULT 'Royal Dum Handi',
  price_label TEXT DEFAULT '$19.00+',
  description TEXT,
  tagline TEXT,
  image_url TEXT NOT NULL,
  image_key TEXT,
  mood_bg TEXT,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: reviews (Diner testimonials & critical acclaim)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author TEXT NOT NULL,
  source TEXT DEFAULT 'Google',
  rating TEXT DEFAULT '4.4',
  detail TEXT DEFAULT '1,081 verified reviews',
  text TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_visible BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.signature_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Public read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admin write site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public read visible sections" ON public.site_sections;
DROP POLICY IF EXISTS "Admin write sections" ON public.site_sections;
DROP POLICY IF EXISTS "Public read visible gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Admin write gallery items" ON public.gallery_items;
DROP POLICY IF EXISTS "Public read visible signature dishes" ON public.signature_dishes;
DROP POLICY IF EXISTS "Admin write signature dishes" ON public.signature_dishes;
DROP POLICY IF EXISTS "Public read visible reviews" ON public.reviews;
DROP POLICY IF EXISTS "Admin write reviews" ON public.reviews;

-- site_settings policies:
CREATE POLICY "Public read site settings"
  ON public.site_settings FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Admin write site settings"
  ON public.site_settings FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- site_sections policies:
CREATE POLICY "Public read visible sections"
  ON public.site_sections FOR SELECT TO anon
  USING (is_visible = true);

CREATE POLICY "Admin write sections"
  ON public.site_sections FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- gallery_items policies:
CREATE POLICY "Public read visible gallery items"
  ON public.gallery_items FOR SELECT TO anon
  USING (is_visible = true);

CREATE POLICY "Admin write gallery items"
  ON public.gallery_items FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- signature_dishes policies:
CREATE POLICY "Public read visible signature dishes"
  ON public.signature_dishes FOR SELECT TO anon
  USING (is_visible = true);

CREATE POLICY "Admin write signature dishes"
  ON public.signature_dishes FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- reviews policies:
CREATE POLICY "Public read visible reviews"
  ON public.reviews FOR SELECT TO anon
  USING (is_visible = true);

CREATE POLICY "Admin write reviews"
  ON public.reviews FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 5. GRANTS
GRANT SELECT ON public.site_settings, public.site_sections, public.gallery_items, public.signature_dishes, public.reviews TO anon;
GRANT ALL ON public.site_settings, public.site_sections, public.gallery_items, public.signature_dishes, public.reviews TO authenticated;

-- 6. SEED DATA (Matches current website content 1:1)

-- Seed Site Settings
INSERT INTO public.site_settings (
  id,
  restaurant_name,
  short_name,
  tagline,
  logo_url,
  logo_dark_url,
  phone,
  phone_href,
  email,
  address,
  center,
  google_maps_url,
  reservation_url,
  reservation_phone,
  price_range,
  opens_daily,
  buffet_label,
  social_links,
  opening_hours,
  seo_title,
  seo_description
) VALUES (
  'current',
  'Deccan Spice Pompano',
  'Deccan Spice',
  'Indian Kitchen & Bar',
  '/assets/aistudio/image_f73263cd.png',
  '/assets/deccan-spice-logo-dark-bg.png',
  '+1 954-366-1847',
  'tel:+19543661847',
  'dspicepompano@gmail.com',
  '1151 S Federal Hwy, Pompano Beach, FL 33062',
  'Pompano Marketplace',
  'https://maps.google.com/?q=1151+S+Federal+Hwy,+Pompano+Beach,+FL+33062',
  '#reserve',
  '+1 954-366-1847',
  '$20–30 per person',
  'Opens daily at 11:30 AM',
  'Friday Buffet · Popular Weekend Buffet',
  '{"instagram": "https://www.instagram.com", "facebook": "https://www.facebook.com", "tripadvisor": "https://www.tripadvisor.com", "yelp": "https://www.yelp.com"}'::jsonb,
  '[{"days": "Sun", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 9:30 PM"}, {"days": "Mon–Thu", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 10:00 PM"}, {"days": "Fri–Sat", "lunch": "11:30 AM – 3:00 PM", "dinner": "5:00 – 10:30 PM"}]'::jsonb,
  'Deccan Spice Pompano | India, Served Beautifully',
  'Indian Fine Dining in Pompano Beach, Florida. Authentic Hyderabadi dum biryanis, charred tandoori sizzlers, regional curries, and craft cocktails.'
)
ON CONFLICT (id) DO UPDATE SET
  restaurant_name = EXCLUDED.restaurant_name,
  short_name = EXCLUDED.short_name,
  tagline = EXCLUDED.tagline,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  seo_title = EXCLUDED.seo_title,
  seo_description = EXCLUDED.seo_description;

-- Seed Site Sections
INSERT INTO public.site_sections (key, title, subtitle, eyebrow, body, button_text, button_link, secondary_button_text, secondary_button_link, image_url, secondary_image_url, is_visible, sort_order, extra)
VALUES
  (
    'hero',
    'India, Served',
    'Beautifully.',
    'INDIAN FINE DINING · POMPANO BEACH',
    'Authentic flavors. Extraordinary moments.',
    'Reserve a Table',
    '#reserve',
    'Explore Our Menu',
    'menu',
    '/src/assets/images/hero_dining_room_1794981482226.jpg',
    NULL,
    true,
    1,
    '{"badge": "POMPANO BEACH, FL"}'::jsonb
  ),
  (
    'marquee',
    'Brand Strip',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    2,
    '{"items": ["HYDERABADI DUM BIRYANI", "FRIDAY & WEEKEND LUNCH BUFFET", "CHARCOAL TANDOOR SIZZLERS", "CRAFT COCKTAIL BAR", "SOUTH FLORIDA FINE DINING"]}'::jsonb
  ),
  (
    'story',
    'Crafted by Fire, Saffron & Memory',
    'From the Deccan Plateau to South Florida',
    'OUR HERITAGE · POMPANO BEACH',
    'At Deccan Spice Pompano, we present royal Indian gastronomy shaped by slow-steamed handi cookery, embers of live clay ovens, and South Florida evening elegance.\n\nFrom fragrant Hyderabadi handis layered with saffron basmati to tender clay-oven tandoori sizzlers, our kitchen honors ancestral South Indian recipes with uncompromised hospitality.',
    'Our Full Story',
    'about',
    NULL,
    NULL,
    '/src/assets/images/hero_interior_1794978228441.jpg',
    '/src/assets/images/spiced_appetizer_editorial_1794983647932.jpg',
    true,
    3,
    '{}'::jsonb
  ),
  (
    'signature',
    'Culinary Masterpieces',
    'Prepared with whole spices roasted daily and centuries-old Hyderabadi technique.',
    'SIGNATURE CREATIONS',
    NULL,
    'Explore Full Menu',
    'menu',
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    4,
    '{}'::jsonb
  ),
  (
    'banner',
    'More Than a Meal. An Occasion.',
    'Acclaimed Friday & Weekend Lunch Buffet in Pompano Marketplace',
    'THE DECCAN SPICE EXPERIENCE',
    'Whether joining us for our acclaimed Friday & weekend lunch buffet or an intimate candlelit dinner in Pompano Marketplace, every moment is served with extraordinary attention.',
    'Explore Weekend Buffet',
    'buffet',
    'Call to Inquire',
    'tel:+19543661847',
    '/src/assets/images/experience_bar_lounge_1794981481916.jpg',
    NULL,
    true,
    5,
    '{}'::jsonb
  ),
  (
    'gallery',
    'Immerse in the Elegance',
    'A glimpse into our candlelit dining spaces, private event celebrations, and culinary craft.',
    'ATMOSPHERE & CELEBRATIONS',
    NULL,
    'View Full Gallery',
    'gallery',
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    6,
    '{}'::jsonb
  ),
  (
    'reviews',
    'What South Florida Diners Say',
    'Over 1,000 verified diner reviews celebrating our slow-steamed biryanis, clay oven sizzlers, and warm hospitality.',
    'GUEST VOICES & CRITICAL ACCLAIM',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    true,
    7,
    '{}'::jsonb
  ),
  (
    'cta',
    'An Unforgettable Evening Awaits',
    NULL,
    'JOIN US TONIGHT',
    'Reserve your table in our candlelit dining room or call us directly. Walk-ins warmly welcomed for dining room & cocktail bar seating.',
    'Reserve Online',
    '#reserve',
    'Call +1 954-366-1847',
    'tel:+19543661847',
    '/src/assets/images/reservation_table_1794983647500.jpg',
    NULL,
    true,
    8,
    '{}'::jsonb
  )
ON CONFLICT (key) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  eyebrow = EXCLUDED.eyebrow,
  body = EXCLUDED.body,
  button_text = EXCLUDED.button_text,
  button_link = EXCLUDED.button_link;

-- Seed Signature Dishes
INSERT INTO public.signature_dishes (name, course, price_label, tagline, description, image_url, mood_bg, sort_order, is_visible)
VALUES
  (
    'Hyderabadi Dum Biryani',
    'Royal Dum Handi',
    '$19.00+',
    'Saffron basmati sealed and steamed over whole Deccan spices.',
    'Aged basmati rice slow-steamed over saffron, caramelized shallots, fresh mint, and house-roasted Deccan garam masala in a sealed handi.',
    '/src/assets/images/biryani_signature_1794978233123.jpg',
    'radial-gradient(circle at 65% 42%, rgba(217,183,128,0.16), rgba(16,17,15,0.7) 52%, #10110F 88%)',
    1,
    true
  ),
  (
    'Hyderabadi Royale Lamb Chops',
    'Charcoal Tandoor',
    '$28.00',
    'Char-seared lamb rack marinated in Kashmiri chili and yogurt.',
    'Australian lamb rack steeped in ginger-garlic paste, raw papaya tenderizer, and freshly cracked Tellicherry black pepper, scorched over clay tandoor embers.',
    '/src/assets/images/tandoori_sizzler_1794978230226.jpg',
    'radial-gradient(circle at 65% 42%, rgba(129,28,54,0.28), rgba(16,17,15,0.72) 54%, #10110F 88%)',
    2,
    true
  ),
  (
    'Chicken Tikka Masala',
    'Signature Curry',
    '$20.00',
    'Clay-oven roasted chicken in velvety tomato fenugreek cream.',
    'Tender tandoor-charred chicken breast morsels simmered gently in a rich San Marzano tomato reduction with toasted kasoori methi and sweet cultured butter.',
    '/src/assets/images/curry_naan_plate_1794978230600.jpg',
    'radial-gradient(circle at 65% 42%, rgba(18,53,43,0.38), rgba(16,17,15,0.76) 56%, #10110F 90%)',
    3,
    true
  ),
  (
    'Tandoori Specialties',
    'From the Clay Oven',
    '$26.00',
    'Smoky skewers and spiced prawns charred over clay embers.',
    'An opulent platter of malai murgh kebab, saffron king prawns, seekh kebabs, and blistered bell peppers served with charred lemon and emerald mint chutney.',
    '/src/assets/images/tandoori_specialties_1794981483880.jpg',
    'radial-gradient(circle at 65% 42%, rgba(217,183,128,0.14), rgba(18,53,43,0.3) 50%, #10110F 88%)',
    4,
    true
  )
ON CONFLICT DO NOTHING;

-- Seed Gallery Items
INSERT INTO public.gallery_items (title, category, caption, image_url, sort_order, is_visible)
VALUES
  (
    'Marble & Brass Buffet Counter',
    'The Restaurant',
    'Copper chafing vessels framed by illuminated geometric lattice screens.',
    '/src/assets/images/buffet_spread_1794978228921.jpg',
    1,
    true
  ),
  (
    'Spiced Craft Cocktails at the Bar',
    'Celebrations',
    'Tamarind margaritas and smoked cardamom old fashioneds poured fresh at the bar.',
    '/src/assets/images/craft_cocktail_bar_1794981483570.jpg',
    2,
    true
  ),
  (
    'Saffron Cardamom Gulab Jamun',
    'Signature Cuisine',
    'Warm golden dumplings steeped in rosewater and crushed green cardamom.',
    '/src/assets/images/dessert_mithai_editorial_1794983648777.jpg',
    3,
    true
  ),
  (
    'Main Dining Room & Brass Chandeliers',
    'The Restaurant',
    'Deep emerald paneling, warm globe lighting, and candlelit tables set in brass.',
    '/src/assets/images/hero_dining_room_1794981482226.jpg',
    4,
    true
  ),
  (
    'Evening Toasts & Group Dining',
    'Celebrations',
    'Memorable gatherings over saffron cocktails and shared brass handis.',
    '/src/assets/images/experience_bar_lounge_1794981481916.jpg',
    5,
    true
  ),
  (
    'Hyderabadi Dum Biryani Handi',
    'Signature Cuisine',
    'Saffron-infused basmati steamed with crispy shallots and fresh mint.',
    '/src/assets/images/biryani_signature_1794978233123.jpg',
    6,
    true
  ),
  (
    'Tandoori Specialties on Slate',
    'Signature Cuisine',
    'Malai chicken skewers, spiced shrimp, and emerald mint chutney.',
    '/src/assets/images/tandoori_specialties_1794981483880.jpg',
    7,
    true
  ),
  (
    'Candlelit Dinner Table',
    'Dining Experience',
    'Hammered brass charger plates and warm candlelight for intimate evenings.',
    '/src/assets/images/reservation_table_1794983647500.jpg',
    8,
    true
  )
ON CONFLICT DO NOTHING;

-- Seed Reviews
INSERT INTO public.reviews (author, source, rating, detail, text, sort_order, is_visible)
VALUES
  (
    'Diner Community',
    'Google',
    '4.4',
    '1,081 verified reviews',
    'Guest favorites highlighted across Google reviews include slow-steamed Hyderabadi dum biryani, sizzling tandoori platters, and warm evening hospitality in Pompano Marketplace.',
    1,
    true
  ),
  (
    'Verified Diners',
    'Tripadvisor',
    '4.4',
    'Verified diner rating',
    'Recognized on Tripadvisor for our Friday & weekend lunch buffet presentation, clay-oven blistered garlic naan, and attentive dining room service.',
    2,
    true
  ),
  (
    'Local Diners',
    'Facebook',
    '4.9',
    '40 community recommendations',
    'Recommended by local South Florida diners for family celebrations, spiced craft cocktails at the bar, and authentic regional Deccan specialties.',
    3,
    true
  )
ON CONFLICT DO NOTHING;
