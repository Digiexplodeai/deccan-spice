# Deccan Spice Pompano — Zero-Code Website CMS & "Scan & Order at Table" System

A luxury Indian fine dining restaurant web platform for **Deccan Spice Pompano**, powered by Vite, React, TypeScript, **Supabase** (PostgreSQL + Realtime + Auth), and **Cloudflare R2** for image storage via Vercel serverless API routes.

---

## 🌟 Key Features

1. **Zero-Code Website CMS (`/admin > Website CMS`)**:
   - Total control over the entire public website with zero code changes:
     - **Hero Banner**: Eyebrow, headline, italic subtitle, body text, CTAs, background photo via R2 uploader, visibility toggle.
     - **Our Story**: Eyebrow, headline, multiline copy, primary dining room photo, overlapping plated dish photo, button text.
     - **Signature Creations**: Interactive single-dish showcase with live progress bar, full CRUD on signature dishes, custom price labels, course tags, mood backgrounds, and R2 photo uploads.
     - **Experience Banner ("More Than a Meal")**: Visual parallax banner with custom copy, CTAs, and background photo.
     - **Visual Exhibition Gallery**: Categorized photo exhibition with full CRUD, category filtering, captions, and full-screen swipeable lightbox.
     - **Guest Reviews**: Curated diner testimonials with 5-star ratings, platform badges (Google, Yelp, OpenTable), and quote editor.
     - **Contact & Footer**: Real-time address, phone, email, shopping center, Google Maps link, and social media URLs (Instagram, Facebook, Yelp, Tripadvisor).
     - **Opening Hours**: Weekly lunch and dinner schedules editable directly from an interactive schedule table.
     - **SEO & Branding**: Restaurant name, tagline, SEO title, meta description, and light/dark logo uploaders.
   - **Safe Instant Fallbacks**: If the Supabase database is empty or network is offline, public pages automatically fall back to hardcoded editorial assets without crashing or layout shifting.

2. **Cloudflare R2 Media Library (`/admin > Media Library`)**:
   - Direct image uploads to Cloudflare R2 via secure presigned PUT URLs (generated server-side).
   - Client-side WebP image conversion and downscaling (max 1920px, 85% quality) saving 60–80% bandwidth.
   - Comprehensive image scanner showing all photos used across Hero, Story, Dishes, Gallery, Branding, and Menu Items.
   - "Used in" tags showing which section or dish references each image.
   - One-click public URL copy and image deletion from R2.
   - **"Migrate Existing Images to Cloudflare R2"**: 1-click batch tool that uploads all bundled local restaurant photos directly into Cloudflare R2 and updates Supabase database records automatically.

3. **Customer Dine-In Flow (`/order?t=<token>`)**:
   - Unguessable cryptographically random table QR tokens (`tbl_tok_deccan_XX_...`).
   - Digital menu with category tabs, dish search, vegetarian/non-veg filter, and spice level indicators (0–3 🌶️).
   - Instant guest bag / cart drawer with dish notes and special instructions.
   - **Server-Side Price Validation**: Orders are validated and calculated in PostgreSQL (`place_order` RPC), ensuring client prices are never trusted.
   - **Real-Time Order Tracking**: Visual progress stepper (Placed → Accepted → Preparing → Ready → Served) with automatic audio/visual notifications via Supabase Realtime.
   - **Service Requests**: 1-tap "Call Waiter", "Request Bill", and "Water Refill" buttons.

4. **Staff & Kitchen Portal (`/admin`)**:
   - Protected by Supabase Auth (Email + Password).
   - **Live Kitchen Orders Feed**: Realtime order arrival with synthesized dining chime, status transition buttons (`Accept`, `Start Preparing`, `Mark Ready`, `Mark Served`, `Complete & Settle`).
   - **Service Requests Desk**: Realtime alert board for waiter calls and bill requests with one-click resolution.
   - **Tables & QR Generator**: Create, bulk-create (e.g. Tables 1–20), edit, and regenerate table tokens. Download individual high-res QR PNG/SVG files.
   - **Printable A4 QR Sheets**: Generates print-ready table cards with Deccan Spice crest, table number, section, and QR code for acrylic table stands.
   - **Menu Manager**: Category management, menu items CRUD, Cloudflare R2 photo uploads, and 1-click "86'd / Sold Out" availability toggles.
   - **Settings & Emergency Pause**: Configure Florida sales tax (7%), restaurant details, and a master kill-switch to pause incoming orders during rushes.
   - **Dine-In Reports**: Total QR revenue, completed order metrics, and average ticket size.

---

## 🛠️ Step-by-Step Setup Guide

### Step 1: Run Supabase Database Schemas

1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab on the left sidebar.
3. **First**, run [`supabase/schema.sql`](supabase/schema.sql):
   - Sets up `tables`, `menu_categories`, `menu_items`, `orders`, `service_requests`, `settings`.
   - Creates the server-side RPC functions (`place_order`, etc.) and seeds initial tables and dishes.
4. **Second**, run [`supabase/cms.sql`](supabase/cms.sql):
   - Creates the CMS tables: `site_settings`, `site_sections`, `gallery_items`, `signature_dishes`, `reviews`.
   - Creates the admin helper function `public.is_admin()`.
   - Seeds all current website copy, photos, and ratings.
   - Configures public read (`is_visible = true`) and admin write RLS policies.
   - Adds the `image_key` column to `menu_items`.

---

### Step 2: Configure Cloudflare R2

1. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com) and navigate to **R2**.
2. Click **Create bucket**:
   - Name your bucket (e.g., `deccan-spice-media`).
   - Location: **Automatic** (or North America).
3. **Enable Public Access**:
   - Go to your bucket settings > **Public Access**.
   - Either connect a Custom Domain (e.g., `media.deccanspice.com`) or enable the `r2.dev` public bucket URL.
   - Copy this URL — this is your `VITE_MEDIA_BASE_URL` (e.g., `https://pub-xxxxxx.r2.dev` or `https://media.deccanspice.com`).
4. **Create R2 API Token**:
   - On the R2 overview page, click **Manage R2 API Tokens** > **Create API token**.
   - Permissions: **Object Read & Write**.
   - Specify bucket: choose your bucket or all buckets.
   - Copy the **Access Key ID**, **Secret Access Key**, and your **Account ID** (found on the right sidebar of the R2 overview page).
5. **Set CORS Policy on R2 Bucket**:
   - Go to your bucket > **Settings** > **CORS Policy** and add:
   ```json
   [
     {
       "AllowedOrigins": [
         "https://*.vercel.app",
         "https://deccanspice.com",
         "http://localhost:5173",
         "http://localhost:3000"
       ],
       "AllowedMethods": ["GET", "PUT", "DELETE", "HEAD"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

---

### Step 3: Configure Environment Variables

Create or update `.env.local` locally, and add these in your **Vercel Project Settings > Environment Variables**:

```bash
# ==============================================================================
# Client-side (Vite frontend) — Available in browser via import.meta.env
# ==============================================================================
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
VITE_MEDIA_BASE_URL=https://media.deccanspice.com  # or https://pub-xxxx.r2.dev

# ==============================================================================
# Server-side (Vercel Serverless Functions in /api) — Node.js process.env
# ==============================================================================
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-cloudflare-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-cloudflare-r2-secret-access-key
R2_BUCKET=deccan-spice-media

SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
```

> **Security Note:** The serverless functions at `/api/upload-url` and `/api/delete-image` verify the user's Supabase JWT before issuing any presigned upload URLs or deleting objects. Frontend code never has access to the R2 secret key or Supabase `service_role`.

---

### Step 4: Create Admin User in Supabase Auth

1. In Supabase Dashboard, go to **Authentication** > **Users**.
2. Click **Add User** > **Create User**.
3. Enter your staff email (e.g., `admin@deccanspice.com`) and password.
4. Set **Auto Confirm User?** to **Yes**.
5. You can now log into `/admin` with these credentials.

---

### Step 5: Test Locally & Migrate Assets

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```
   *(Note: To test the `/api` serverless upload functions locally, you can use `npx vercel dev` which emulates Vercel API routes on port 3000).*

3. Build production bundle:
   ```bash
   npm run build
   ```

4. **Migrate bundled assets to Cloudflare R2**:
   - Log into `/admin`.
   - Click the **Media Library** tab.
   - Click **Migrate Existing Images to Cloudflare**.
   - Watch the live progress bar upload all dining room photos, dishes, and logos into your R2 bucket and link them in Supabase!
   - Now any edits you make in the **Website CMS** tab will instantly update the live site.

---

## 📁 Architecture & File Layout

- `api/upload-url.ts`: Vercel Serverless Function that authenticates user JWT via Supabase and returns an S3 presigned PUT URL for Cloudflare R2 (expires in 5 minutes).
- `api/delete-image.ts`: Vercel Serverless Function that authenticates user JWT and deletes objects from Cloudflare R2 via `DeleteObjectCommand`.
- `src/lib/supabase.ts`: Supabase client and TypeScript interfaces (`SiteSettings`, `SiteSection`, `GalleryItem`, `SignatureDish`, `CmsReview`, etc.).
- `src/lib/cmsContext.tsx`: React Context (`CmsProvider`, `useCMS`) providing real-time data sync, document head updates, and static fallbacks.
- `src/lib/imageOptimization.ts`: Client-side image compressor (converts images to WebP, limits max dimension to 1920px, quality 0.85).
- `src/lib/cmsMigration.ts`: One-click asset migration utility from local static bundles to Cloudflare R2.
- `src/components/admin/ImageUploader.tsx`: Drag & drop image uploader with WebP compression, upload progress bar, and preview.
- `src/components/admin/AdminCmsSection.tsx`: Admin panel for Hero, Story, Signature Dishes, Banner, Gallery, Reviews, Hours, Contact, and SEO.
- `src/components/admin/MediaLibrary.tsx`: Media asset browser, R2 quick uploader, and migration tool.
- `src/components/dinein/AdminDashboard.tsx`: Live orders, kitchen feeds, service desk, tables, and menu manager.
- `supabase/cms.sql`: Full SQL schema and seeds for the website CMS with Row-Level Security.
- `supabase/schema.sql`: Full SQL schema and seeds for the table dine-in ordering system.
