import { ASSETS } from "../data/site";
import { uploadToR2 } from "./imageOptimization";
import { supabase } from "./supabase";

export interface MigrationProgress {
  total: number;
  completed: number;
  currentName: string;
  isComplete: boolean;
  error?: string;
}

/**
 * Uploads all local project images to Cloudflare R2 via /api/upload-url
 * and updates database rows (site_settings, site_sections, signature_dishes, gallery_items, menu_items)
 * with the persistent public R2 URLs and object keys.
 */
export async function migrateLocalImagesToCloudflare(
  onProgress?: (progress: MigrationProgress) => void
): Promise<{ success: boolean; uploadedCount: number; errors: string[] }> {
  const imagesToMigrate = [
    { key: "heroDiningRoom", localUrl: ASSETS.heroDiningRoom, filename: "hero_dining_room.jpg", folder: "hero" },
    { key: "introInterior", localUrl: ASSETS.introInterior, filename: "hero_interior.jpg", folder: "story" },
    { key: "spicedAppetizer", localUrl: ASSETS.spicedAppetizer, filename: "spiced_appetizer_editorial.jpg", folder: "story" },
    { key: "experienceLounge", localUrl: ASSETS.experienceLounge, filename: "experience_bar_lounge.jpg", folder: "banner" },
    { key: "buffetSpread", localUrl: ASSETS.buffetSpread, filename: "buffet_spread.jpg", folder: "gallery" },
    { key: "biryani", localUrl: ASSETS.biryani, filename: "biryani_signature.jpg", folder: "dishes" },
    { key: "lambChops", localUrl: ASSETS.lambChops, filename: "tandoori_sizzler.jpg", folder: "dishes" },
    { key: "tikkaMasala", localUrl: ASSETS.tikkaMasala, filename: "curry_naan_plate.jpg", folder: "dishes" },
    { key: "tandooriSpecialties", localUrl: ASSETS.tandooriSpecialties, filename: "tandoori_specialties.jpg", folder: "dishes" },
    { key: "craftCocktails", localUrl: ASSETS.craftCocktails, filename: "craft_cocktail_bar.jpg", folder: "gallery" },
    { key: "dessertMithai", localUrl: ASSETS.dessertMithai, filename: "dessert_mithai_editorial.jpg", folder: "gallery" },
    { key: "reservationTable", localUrl: ASSETS.reservationTable, filename: "reservation_table.jpg", folder: "cta" },
    { key: "brandLogo", localUrl: ASSETS.brandLogo, filename: "brand_logo.png", folder: "branding" },
    { key: "brandLogoDarkBg", localUrl: ASSETS.brandLogoDarkBg, filename: "brand_logo_dark.png", folder: "branding" },
  ];

  const total = imagesToMigrate.length;
  let completed = 0;
  const resultMap: Record<string, { publicUrl: string; key: string }> = {};
  const errors: string[] = [];

  for (const item of imagesToMigrate) {
    onProgress?.({
      total,
      completed,
      currentName: item.filename,
      isComplete: false,
    });

    try {
      // 1. Fetch local bundled asset
      const res = await fetch(item.localUrl);
      if (!res.ok) {
        throw new Error(`Failed to load local asset: ${item.localUrl}`);
      }
      const blob = await res.blob();

      // 2. Upload to Cloudflare R2 via presigned PUT
      const { publicUrl, key } = await uploadToR2(
        blob,
        item.filename.replace(/\.[^/.]+$/, ""),
        item.folder
      );

      resultMap[item.key] = { publicUrl, key };
      completed++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`${item.filename}: ${msg}`);
    }
  }

  // 3. Update Supabase tables with R2 public URLs and object keys
  try {
    // Site Settings (Logos)
    if (resultMap.brandLogo) {
      await supabase
        .from("site_settings")
        .update({
          logo_url: resultMap.brandLogo.publicUrl,
          logo_key: resultMap.brandLogo.key,
          logo_dark_url: resultMap.brandLogoDarkBg?.publicUrl || resultMap.brandLogo.publicUrl,
          logo_dark_key: resultMap.brandLogoDarkBg?.key || resultMap.brandLogo.key,
        })
        .eq("id", "current");
    }

    // Hero Section
    if (resultMap.heroDiningRoom) {
      await supabase
        .from("site_sections")
        .update({
          image_url: resultMap.heroDiningRoom.publicUrl,
          image_key: resultMap.heroDiningRoom.key,
        })
        .eq("key", "hero");
    }

    // Story Section
    if (resultMap.introInterior || resultMap.spicedAppetizer) {
      await supabase
        .from("site_sections")
        .update({
          image_url: resultMap.introInterior?.publicUrl,
          image_key: resultMap.introInterior?.key,
          secondary_image_url: resultMap.spicedAppetizer?.publicUrl,
          secondary_image_key: resultMap.spicedAppetizer?.key,
        })
        .eq("key", "story");
    }

    // Banner Section
    if (resultMap.experienceLounge) {
      await supabase
        .from("site_sections")
        .update({
          image_url: resultMap.experienceLounge.publicUrl,
          image_key: resultMap.experienceLounge.key,
        })
        .eq("key", "banner");
    }

    // Reservation CTA Section
    if (resultMap.reservationTable) {
      await supabase
        .from("site_sections")
        .update({
          image_url: resultMap.reservationTable.publicUrl,
          image_key: resultMap.reservationTable.key,
        })
        .eq("key", "cta");
    }

    // Signature Dishes
    if (resultMap.biryani) {
      await supabase
        .from("signature_dishes")
        .update({
          image_url: resultMap.biryani.publicUrl,
          image_key: resultMap.biryani.key,
        })
        .ilike("name", "%Biryani%");
    }
    if (resultMap.lambChops) {
      await supabase
        .from("signature_dishes")
        .update({
          image_url: resultMap.lambChops.publicUrl,
          image_key: resultMap.lambChops.key,
        })
        .ilike("name", "%Lamb Chops%");
    }
    if (resultMap.tikkaMasala) {
      await supabase
        .from("signature_dishes")
        .update({
          image_url: resultMap.tikkaMasala.publicUrl,
          image_key: resultMap.tikkaMasala.key,
        })
        .ilike("name", "%Tikka Masala%");
    }
    if (resultMap.tandooriSpecialties) {
      await supabase
        .from("signature_dishes")
        .update({
          image_url: resultMap.tandooriSpecialties.publicUrl,
          image_key: resultMap.tandooriSpecialties.key,
        })
        .ilike("name", "%Tandoori%");
    }

    // Gallery Items
    if (resultMap.buffetSpread) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.buffetSpread.publicUrl,
          image_key: resultMap.buffetSpread.key,
        })
        .ilike("title", "%Buffet%");
    }
    if (resultMap.craftCocktails) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.craftCocktails.publicUrl,
          image_key: resultMap.craftCocktails.key,
        })
        .ilike("title", "%Cocktail%");
    }
    if (resultMap.dessertMithai) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.dessertMithai.publicUrl,
          image_key: resultMap.dessertMithai.key,
        })
        .ilike("title", "%Gulab Jamun%");
    }
    if (resultMap.heroDiningRoom) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.heroDiningRoom.publicUrl,
          image_key: resultMap.heroDiningRoom.key,
        })
        .ilike("title", "%Dining Room%");
    }
    if (resultMap.experienceLounge) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.experienceLounge.publicUrl,
          image_key: resultMap.experienceLounge.key,
        })
        .ilike("title", "%Celebration%");
    }
    if (resultMap.reservationTable) {
      await supabase
        .from("gallery_items")
        .update({
          image_url: resultMap.reservationTable.publicUrl,
          image_key: resultMap.reservationTable.key,
        })
        .ilike("title", "%Dinner Table%");
    }
  } catch (dbErr: unknown) {
    errors.push(`Database update error: ${dbErr instanceof Error ? dbErr.message : dbErr}`);
  }

  onProgress?.({
    total,
    completed,
    currentName: "Migration Finished",
    isComplete: true,
  });

  return {
    success: errors.length === 0,
    uploadedCount: completed,
    errors,
  };
}
