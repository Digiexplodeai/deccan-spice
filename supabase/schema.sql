-- ==============================================================================
-- Deccan Spice Pompano: Scan & Order at Table (QR Dine-In Ordering Schema)
-- ==============================================================================
-- Run this complete script in the Supabase SQL Editor (SQL Editor -> New Query -> Run)
-- ==============================================================================

-- 1. EXTENSIONS & SEQUENCES
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE SEQUENCE IF NOT EXISTS order_number_seq START WITH 1001;

-- 2. TABLES

-- Table: tables (Dining tables with unguessable random tokens for QR codes)
CREATE TABLE IF NOT EXISTS public.tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INTEGER UNIQUE NOT NULL,
  label TEXT,
  seats INTEGER DEFAULT 4,
  section TEXT DEFAULT 'Main Dining',
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: menu_categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: menu_items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  image_url TEXT,
  is_veg BOOLEAN DEFAULT FALSE,
  spice_level INTEGER DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL,
  table_id UUID REFERENCES public.tables(id) ON DELETE RESTRICT,
  table_number INTEGER NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  subtotal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tax NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'placed' CHECK (status IN ('placed', 'accepted', 'preparing', 'ready', 'served', 'completed', 'cancelled')),
  customer_note TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: service_requests (Waiter call, bill, water refill)
CREATE TABLE IF NOT EXISTS public.service_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES public.tables(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call_waiter', 'request_bill', 'water', 'other')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Table: settings (Single row config)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'restaurant_settings',
  restaurant_name TEXT DEFAULT 'Deccan Spice Pompano',
  tax_rate NUMERIC(5, 2) DEFAULT 7.00,
  currency TEXT DEFAULT '$',
  accepting_orders BOOLEAN DEFAULT TRUE,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ROW LEVEL SECURITY (RLS) POLICIES

ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clean existing policies for idempotency
DROP POLICY IF EXISTS "Authenticated users full access to tables" ON public.tables;
DROP POLICY IF EXISTS "Public read active categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Authenticated users manage categories" ON public.menu_categories;
DROP POLICY IF EXISTS "Public read menu items" ON public.menu_items;
DROP POLICY IF EXISTS "Authenticated users manage items" ON public.menu_items;
DROP POLICY IF EXISTS "Public read settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated users manage settings" ON public.settings;
DROP POLICY IF EXISTS "Authenticated staff manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Public read table orders via token header" ON public.orders;
DROP POLICY IF EXISTS "Authenticated staff manage service requests" ON public.service_requests;
DROP POLICY IF EXISTS "Public read service requests via token header" ON public.service_requests;

-- Policies for public.tables:
-- Token must remain unguessable; only authenticated staff can inspect table tokens directly
CREATE POLICY "Authenticated users full access to tables"
  ON public.tables
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for menu_categories:
CREATE POLICY "Public read active categories"
  ON public.menu_categories
  FOR SELECT TO anon, authenticated
  USING (is_active = true);

CREATE POLICY "Authenticated users manage categories"
  ON public.menu_categories
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for menu_items:
CREATE POLICY "Public read menu items"
  ON public.menu_items
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users manage items"
  ON public.menu_items
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for settings:
CREATE POLICY "Public read settings"
  ON public.settings
  FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users manage settings"
  ON public.settings
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policies for orders:
CREATE POLICY "Authenticated staff manage all orders"
  ON public.orders
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read table orders via token header"
  ON public.orders
  FOR SELECT TO anon
  USING (
    table_id IN (
      SELECT id FROM public.tables 
      WHERE token = COALESCE(current_setting('request.headers', true)::json->>'x-table-token', '')
      AND is_active = true
    )
  );

-- Policies for service_requests:
CREATE POLICY "Authenticated staff manage service requests"
  ON public.service_requests
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public read service requests via token header"
  ON public.service_requests
  FOR SELECT TO anon
  USING (
    table_id IN (
      SELECT id FROM public.tables 
      WHERE token = COALESCE(current_setting('request.headers', true)::json->>'x-table-token', '')
      AND is_active = true
    )
  );

-- 4. POSTGRES FUNCTIONS & RPC (Server-Side Price Validation & Security)

-- RPC 1: Validate Table Token & Retrieve Dining Info
CREATE OR REPLACE FUNCTION public.get_table_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN NULL;
  END IF;

  SELECT id, number, label, seats, section, is_active
  INTO v_table
  FROM public.tables
  WHERE token = trim(p_token) AND is_active = true;

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  RETURN to_jsonb(v_table);
END;
$$;

-- RPC 2: Place Order (COMPUTES & VALIDATES ALL PRICES SERVER-SIDE)
CREATE OR REPLACE FUNCTION public.place_order(
  p_table_token TEXT,
  p_items JSONB,
  p_customer_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_settings RECORD;
  v_item_elem JSONB;
  v_item_id UUID;
  v_qty INT;
  v_item_note TEXT;
  v_menu_item RECORD;
  v_line_total NUMERIC(10, 2);
  v_subtotal NUMERIC(10, 2) := 0;
  v_tax NUMERIC(10, 2) := 0;
  v_total NUMERIC(10, 2) := 0;
  v_order_items JSONB := '[]'::jsonb;
  v_order_number TEXT;
  v_new_order RECORD;
BEGIN
  -- Validate table token
  SELECT id, number, is_active INTO v_table
  FROM public.tables
  WHERE token = trim(p_table_token) AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive table token';
  END IF;

  -- Verify settings
  SELECT tax_rate, accepting_orders INTO v_settings
  FROM public.settings
  LIMIT 1;

  IF v_settings.accepting_orders = false THEN
    RAISE EXCEPTION 'The kitchen is currently not accepting new orders';
  END IF;

  -- Validate items
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item';
  END IF;

  -- Loop through items and calculate prices strictly on the server
  FOR v_item_elem IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_item_id := (v_item_elem->>'item_id')::uuid;
    v_qty := COALESCE((v_item_elem->>'quantity')::int, 1);
    v_item_note := v_item_elem->>'notes';

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantity must be greater than zero';
    END IF;

    SELECT id, name, price, is_available, is_veg
    INTO v_menu_item
    FROM public.menu_items
    WHERE id = v_item_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Menu item not found: %', v_item_id;
    END IF;

    IF v_menu_item.is_available = false THEN
      RAISE EXCEPTION 'Item "%" is currently sold out', v_menu_item.name;
    END IF;

    v_line_total := round((v_menu_item.price * v_qty)::numeric, 2);
    v_subtotal := v_subtotal + v_line_total;

    v_order_items := v_order_items || jsonb_build_object(
      'item_id', v_menu_item.id,
      'name', v_menu_item.name,
      'price', v_menu_item.price,
      'quantity', v_qty,
      'notes', v_item_note,
      'is_veg', v_menu_item.is_veg,
      'line_total', v_line_total
    );
  END LOOP;

  -- Calculate tax & total
  v_tax := round((v_subtotal * (COALESCE(v_settings.tax_rate, 7.00) / 100.0))::numeric, 2);
  v_total := v_subtotal + v_tax;

  -- Generate order number
  v_order_number := 'DS-' || nextval('order_number_seq')::text;

  -- Insert order
  INSERT INTO public.orders (
    order_number,
    table_id,
    table_number,
    items,
    subtotal,
    tax,
    total,
    status,
    customer_note
  ) VALUES (
    v_order_number,
    v_table.id,
    v_table.number,
    v_order_items,
    v_subtotal,
    v_tax,
    v_total,
    'placed',
    trim(p_customer_note)
  )
  RETURNING * INTO v_new_order;

  RETURN to_jsonb(v_new_order);
END;
$$;

-- RPC 3: Create Service Request (Waiter, Bill, Water)
CREATE OR REPLACE FUNCTION public.create_service_request(
  p_table_token TEXT,
  p_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_request RECORD;
BEGIN
  SELECT id, number INTO v_table
  FROM public.tables
  WHERE token = trim(p_table_token) AND is_active = true;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or inactive table token';
  END IF;

  IF p_type NOT IN ('call_waiter', 'request_bill', 'water', 'other') THEN
    RAISE EXCEPTION 'Invalid service request type: %', p_type;
  END IF;

  INSERT INTO public.service_requests (
    table_id,
    table_number,
    type,
    status
  ) VALUES (
    v_table.id,
    v_table.number,
    p_type,
    'pending'
  )
  RETURNING * INTO v_request;

  RETURN to_jsonb(v_request);
END;
$$;

-- RPC 4: Get Active Table Orders (By Token)
CREATE OR REPLACE FUNCTION public.get_table_orders(p_table_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_result JSONB;
BEGIN
  SELECT id INTO v_table
  FROM public.tables
  WHERE token = trim(p_table_token) AND is_active = true;

  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(o) ORDER BY o.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM public.orders o
  WHERE o.table_id = v_table.id
  AND o.created_at >= (timezone('utc'::text, now()) - interval '18 hours');

  RETURN v_result;
END;
$$;

-- RPC 5: Get Active Table Service Requests (By Token)
CREATE OR REPLACE FUNCTION public.get_table_service_requests(p_table_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_table RECORD;
  v_result JSONB;
BEGIN
  SELECT id INTO v_table
  FROM public.tables
  WHERE token = trim(p_table_token) AND is_active = true;

  IF NOT FOUND THEN
    RETURN '[]'::jsonb;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(sr) ORDER BY sr.created_at DESC), '[]'::jsonb)
  INTO v_result
  FROM public.service_requests sr
  WHERE sr.table_id = v_table.id
  AND sr.status IN ('pending', 'in_progress');

  RETURN v_result;
END;
$$;

-- 5. REALTIME PUBLICATIONS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'service_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.service_requests;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Fallback in environments where publication configuration is restricted
    NULL;
END $$;

-- 6. STORAGE BUCKET FOR MENU IMAGES
INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update menu images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete menu images" ON storage.objects;

CREATE POLICY "Public can view menu images"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can upload menu images"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can update menu images"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'menu-images');

CREATE POLICY "Authenticated users can delete menu images"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'menu-images');

-- 7. SEED DATA

-- Settings
INSERT INTO public.settings (id, restaurant_name, tax_rate, currency, accepting_orders)
VALUES ('restaurant_settings', 'Deccan Spice Pompano', 7.00, '$', true)
ON CONFLICT (id) DO UPDATE SET
  restaurant_name = EXCLUDED.restaurant_name,
  tax_rate = EXCLUDED.tax_rate,
  currency = EXCLUDED.currency,
  accepting_orders = EXCLUDED.accepting_orders;

-- 12 Sample Dining Tables with random tokens
INSERT INTO public.tables (number, label, seats, section, token, is_active)
VALUES
  (1, 'Table 1', 4, 'Main Dining', 'tbl_tok_deccan_01_a9f8b2c4e6', true),
  (2, 'Table 2', 4, 'Main Dining', 'tbl_tok_deccan_02_b8c7d6e5f4', true),
  (3, 'Table 3', 4, 'Main Dining', 'tbl_tok_deccan_03_c7d6e5f4a3', true),
  (4, 'Table 4', 4, 'Main Dining', 'tbl_tok_deccan_04_d6e5f4a3b2', true),
  (5, 'Booth 5', 6, 'Main Dining Booths', 'tbl_tok_deccan_05_e5f4a3b2c1', true),
  (6, 'Booth 6', 6, 'Main Dining Booths', 'tbl_tok_deccan_06_f4a3b2c1d0', true),
  (7, 'Patio 7', 4, 'Patio Terrace', 'tbl_tok_deccan_07_a3b2c1d0e9', true),
  (8, 'Patio 8', 4, 'Patio Terrace', 'tbl_tok_deccan_08_b2c1d0e9f8', true),
  (9, 'Bar 9', 2, 'Bar & Cocktail Lounge', 'tbl_tok_deccan_09_c1d0e9f8a7', true),
  (10, 'Bar 10', 2, 'Bar & Cocktail Lounge', 'tbl_tok_deccan_10_d0e9f8a7b6', true),
  (11, 'Private 11', 8, 'Royal Private Dining', 'tbl_tok_deccan_11_e9f8a7b6c5', true),
  (12, 'Private 12', 10, 'Royal Private Dining', 'tbl_tok_deccan_12_f8a7b6c5d4', true)
ON CONFLICT (number) DO NOTHING;

-- Menu Categories
INSERT INTO public.menu_categories (id, name, slug, sort_order, is_active)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Royal Biryanis', 'biryanis', 1, true),
  ('c2222222-2222-2222-2222-222222222222', 'Tandoor & Starters', 'tandoor-starters', 2, true),
  ('c3333333-3333-3333-3333-333333333333', 'Signature Curries', 'curries', 3, true),
  ('c4444444-4444-4444-4444-444444444444', 'Artisanal Breads & Rice', 'breads-rice', 4, true),
  ('c5555555-5555-5555-5555-555555555555', 'Desserts & Mithai', 'desserts', 5, true),
  ('c6666666-6666-6666-6666-666666666666', 'Beverages & Mocktails', 'beverages', 6, true)
ON CONFLICT (slug) DO NOTHING;

-- Sample Indian Menu Items
INSERT INTO public.menu_items (category_id, name, description, price, is_veg, spice_level, is_available, sort_order, image_url)
VALUES
  -- Biryanis
  ('c1111111-1111-1111-1111-111111111111', 'Hyderabadi Dum Chicken Biryani', 'Aged long-grain basmati, marinated chicken, saffron, caramelised onions, sealed in clay handi with mirchi ka salan and dahi raita.', 19.99, false, 2, true, 1, '/src/assets/images/biryani_signature_1794978233123.jpg'),
  ('c1111111-1111-1111-1111-111111111111', 'Nawabi Goat Biryani', 'Slow-cooked bone-in tender goat, aromatic potli masala, rose petal essence, paired with burani raita and salan.', 23.99, false, 2, true, 2, '/src/assets/images/biryani_signature_1794978233123.jpg'),
  ('c1111111-1111-1111-1111-111111111111', 'Shahi Paneer Tikka Biryani', 'Char-grilled cottage cheese cubes layered over spiced saffron rice with roasted cashews and crispy mint.', 17.99, true, 1, true, 3, '/src/assets/images/biryani_signature_1794978233123.jpg'),
  ('c1111111-1111-1111-1111-111111111111', 'Coastal Tiger Prawn Biryani', 'Jumbo black tiger prawns tossed in coastal Guntur spices, tempered mustard seeds, and fragranced basmati.', 24.99, false, 2, true, 4, '/src/assets/images/biryani_signature_1794978233123.jpg'),

  -- Tandoor & Starters
  ('c2222222-2222-2222-2222-222222222222', 'Deccan Charred Chicken Tikka', 'Boneless chicken breast steeped in hung curd, Kashmiri deggi mirch, and mustard oil, flash-charred on sword skewers.', 16.99, false, 2, true, 1, '/src/assets/images/tandoori_sizzler_1794978230226.jpg'),
  ('c2222222-2222-2222-2222-222222222222', 'Murgh Malai Kebab', 'Silky chicken morsels coated in reduced cream, roasted green cardamom, and Philadelphia cream cheese, tender and smoky.', 17.99, false, 0, true, 2, '/src/assets/images/tandoori_specialties_1794981483880.jpg'),
  ('c2222222-2222-2222-2222-222222222222', 'Tandoori Smoked Paneer Shashlik', 'Fresh cottage cheese, Spanish bell peppers, and red onions with carom seed marinade and mint-coriander coulis.', 15.99, true, 1, true, 3, '/src/assets/images/spiced_appetizer_editorial_1794983647932.jpg'),
  ('c2222222-2222-2222-2222-222222222222', 'Hyderabadi Apollo Fish', 'Fresh local tilapia fillet tossed with curry leaves, crushed green chilies, yogurt, and toasted sesame.', 18.99, false, 3, true, 4, '/src/assets/images/spiced_appetizer_editorial_1794983647932.jpg'),
  ('c2222222-2222-2222-2222-222222222222', 'Amritsari Crispy Samosa Platter', 'Flaky carom-scented pastry stuffed with spiced spiced Yukon potatoes and green peas, served with sweet date-tamarind chutney.', 9.99, true, 1, true, 5, '/src/assets/images/spiced_appetizer_editorial_1794983647932.jpg'),

  -- Curries
  ('c3333333-3333-3333-3333-333333333333', 'Old Delhi Butter Chicken (Murgh Makhani)', 'Tandoor-pulled chicken steeped in velvety roasted tomato sauce finished with pure French butter, dried fenugreek, and clover honey.', 19.99, false, 1, true, 1, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c3333333-3333-3333-3333-333333333333', 'Chicken Tikka Masala', 'Fire-roasted chicken pieces in a robust British-Indian onion-tomato gravy with charred sweet peppers and whole spices.', 19.99, false, 2, true, 2, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c3333333-3333-3333-3333-333333333333', 'Nizam''s Rogan Josh', 'Fork-tender Australian lamb shank braised in Kashmiri shallot paste, ratanjot bark, and sun-dried fennel.', 22.99, false, 2, true, 3, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c3333333-3333-3333-3333-333333333333', 'Paneer Butter Masala', 'Handcrafted paneer cubes folded into a luxurious cashew and heirloom tomato cream reduction with roasted kasoori methi.', 17.99, true, 1, true, 4, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c3333333-3333-3333-3333-333333333333', 'Dal Bukhara (24-Hour Black Lentils)', 'Slow-simmered whole urad lentils cooked overnight on live tandoor embers with organic churned butter and San Marzano tomatoes.', 15.99, true, 0, true, 5, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c3333333-3333-3333-3333-333333333333', 'Yellow Dal Tadka', 'Organically sourced toor dal tempered with clarified ghee, crushed cumin seeds, roasted garlic, and deggi mirch.', 13.99, true, 1, true, 6, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),

  -- Breads & Rice
  ('c4444444-4444-4444-4444-444444444444', 'Garlic Rosemary Butter Naan', 'Hand-stretched leavened flatbread baked on tandoor walls, brushed with roasted garlic butter and garden rosemary.', 4.99, true, 0, true, 1, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c4444444-4444-4444-4444-444444444444', 'Truffle & Aged Cheddar Naan', 'Stuffed with aged British sharp white cheddar, scorched in the tandoor, and misted with black winter truffle oil.', 7.99, true, 0, true, 2, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c4444444-4444-4444-4444-444444444444', 'Traditional Butter Naan', 'Classic soft, blistered tandoor naan brushed with sweet cream butter.', 3.99, true, 0, true, 3, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c4444444-4444-4444-4444-444444444444', 'Laccha Paratha', 'Multi-layered flaky whole-wheat bread crisped with desi ghee in the clay oven.', 4.99, true, 0, true, 4, '/src/assets/images/curry_naan_plate_1794978230600.jpg'),
  ('c4444444-4444-4444-4444-444444444444', 'Jeera Saffron Pulao', 'Extra-long basmati rice tempered with royal cumin seeds, whole green cardamom, and Kashmiri saffron.', 5.99, true, 0, true, 5, '/src/assets/images/biryani_signature_1794978233123.jpg'),

  -- Desserts
  ('c5555555-5555-5555-5555-555555555555', 'Shahi Tukda with Gold Leaf', 'Ghee-fried brioche steeped in saffron rabri reduction, garnished with Iranian pistachios and edible 24k gold leaf.', 9.99, true, 0, true, 1, '/src/assets/images/dessert_mithai_editorial_1794983647777.jpg'),
  ('c5555555-5555-5555-5555-555555555555', 'Warm Gulab Jamun Flambé', 'Soft khoya dumplings soaked in green cardamom syrup, flamed with Old Monk dark rum and Madagascar vanilla bean gelato.', 8.99, true, 0, true, 2, '/src/assets/images/dessert_mithai_editorial_1794983647777.jpg'),
  ('c5555555-5555-5555-5555-555555555555', 'Kesari Rasmalai', 'Poached cottage cheese discs immersed in reduced saffron milk with slivered Marcona almonds.', 8.99, true, 0, true, 3, '/src/assets/images/dessert_mithai_editorial_1794983647777.jpg'),

  -- Beverages
  ('c6666666-6666-6666-6666-666666666666', 'Alphonso Mango Lassi', 'Ratnagiri Alphonso mango pulp blended with probiotic churned yogurt, green cardamom, and pistachio dust.', 5.99, true, 0, true, 1, '/src/assets/images/craft_cocktail_bar_1794981483570.jpg'),
  ('c6666666-6666-6666-6666-666666666666', 'Hyderabadi Irani Chai', 'Slow-dum brewed black tea with evaporated whole milk, crushed mace, and green cardamom.', 4.49, true, 0, true, 2, '/src/assets/images/craft_cocktail_bar_1794981483570.jpg'),
  ('c6666666-6666-6666-6666-666666666666', 'Kashmiri Rose Mocktail', 'Organic Damascus rose water, muddled Persian mint, fresh lime, and sparkling fever-tree club soda.', 7.99, true, 0, true, 3, '/src/assets/images/craft_cocktail_bar_1794981483570.jpg')
ON CONFLICT DO NOTHING;
