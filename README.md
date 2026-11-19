# Deccan Spice Pompano — "Scan & Order at Table" QR Dine-In System

A high-performance dine-in digital ordering and kitchen management system for Deccan Spice Pompano, powered by Vite, React, TypeScript, and Supabase (PostgreSQL + Realtime).

---

## 🍽️ System Overview

1. **Customer Dine-In Flow (`/order?t=<token>`)**:
   - Guests scan the unguessable QR code on their dining table.
   - Live table connection (e.g. Table 1, Table 4).
   - Digital menu with category tabs, dish search, vegetarian/non-veg filter, and spice level indicators.
   - Instant guest bag / cart drawer with item notes and order instructions.
   - **Server-Side Price Validation**: Orders are validated and calculated in PostgreSQL (`place_order` RPC), ensuring client prices are never trusted.
   - **Real-Time Order Tracking**: Visual progress stepper (Placed → Accepted → Preparing → Ready → Served) with automatic audio/visual notifications.
   - **Service Requests**: 1-tap "Call Waiter", "Request Bill", and "Water Refill" buttons.

2. **Staff & Kitchen Portal (`/admin`)**:
   - Protected by Supabase Auth (Email + Password).
   - **Live Kitchen Orders Feed**: Realtime order arrival with synthesized dining chime, status transition buttons (`Accept`, `Start Preparing`, `Mark Ready`, `Mark Served`, `Complete & Settle`).
   - **Service Requests Desk**: Realtime alert board for waiter calls and bill requests with one-click resolution.
   - **Tables & QR Generator**: Create, bulk-create (e.g. Tables 1-20), edit, and regenerate table tokens. Download individual high-res QR PNG/SVG files.
   - **Printable A4 QR Sheets**: Generates print-ready table cards with Deccan Spice crest, table number, section, and QR code for acrylic table stands.
   - **Menu Manager**: Category management, menu items CRUD, image upload to Supabase Storage, and 1-click "86'd / Sold Out" availability toggles.
   - **Settings & Emergency Pause**: Configure Florida sales tax (7%), restaurant details, and a master kill-switch to pause incoming orders during rushes.
   - **Dine-In Reports**: Total QR revenue, completed order metrics, and average ticket size.

---

## 🚀 Setup Guide

### Step 1: Run the Database Schema in Supabase

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Navigate to the **SQL Editor** tab on the left sidebar.
3. Click **New Query**, paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql), and click **Run**.
4. This will create:
   - Tables: `tables`, `menu_categories`, `menu_items`, `orders`, `service_requests`, `settings`
   - Row Level Security (RLS) policies protecting tables, orders, and tokens
   - Server-side Postgres functions (`place_order`, `get_table_by_token`, `create_service_request`, `get_table_orders`)
   - Supabase Storage bucket `menu-images` for dish photography
   - 12 pre-seeded sample dining tables with random tokens
   - Complete Deccan Spice menu (Royal Biryanis, Tandoori Starters, Curries, Naan, Desserts, Cocktails)

---

### Step 2: Configure Environment Variables

Create or update `.env.local` in your project root (and add these variables in your **Vercel Project Settings > Environment Variables**):

```bash
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-or-anon-key
```

> **Security Note:** Frontend code strictly uses the publishable/anon key. Never use or expose the `service_role` secret key.

---

### Step 3: Create the First Admin User in Supabase Auth

1. In your Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your staff email (e.g., `admin@deccanspice.com`) and a secure password.
4. Set **Auto Confirm User?** to **Yes**.
5. You can now use these credentials to log in at `/admin`.

---

### Step 4: Verify Supabase Realtime is Enabled

The schema automatically attempts to attach `orders` and `service_requests` to `supabase_realtime`. To verify:

1. In Supabase Dashboard, go to **Database** > **Publications**.
2. Click on **supabase_realtime**.
3. Ensure both `orders` and `service_requests` tables are toggled **ON**.

---

### Step 5: Test the System Locally

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. **Test Customer Order Flow**:
   Open: [http://localhost:3000/order?t=tbl_tok_deccan_01_a9f8b2c4e6](http://localhost:3000/order?t=tbl_tok_deccan_01_a9f8b2c4e6)
   - You should see "Table 1 • Main Dining".
   - Add dishes to your bag and tap **Place Dine-In Order**.
   - Watch the live status stepper appear!

4. **Test Staff Portal**:
   Open: [http://localhost:3000/admin](http://localhost:3000/admin)
   - Sign in with the admin credentials created in Step 3.
   - See the order appear in the **Kitchen Orders** feed with an audible dining chime!
   - Advance the status: `Accept Order` → `Start Preparing` → `Mark Ready` → `Mark Served`.
   - Check the customer window to see the stepper update in real time!

---

### Step 6: Print Table QR Cards

1. Log into `/admin`.
2. Go to the **Tables & QR Codes** tab.
3. Click **Print All Cards (A4)**.
4. Your browser's print dialog will open with high-resolution, branded Deccan Spice table cards ready to cut and display in table tents.
