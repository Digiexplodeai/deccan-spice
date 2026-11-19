import React, { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  Filter,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useCMS } from "../../lib/cmsContext";
import { deleteFromR2 } from "../../lib/imageOptimization";
import {
  migrateLocalImagesToCloudflare,
  type MigrationProgress,
} from "../../lib/cmsMigration";
import { ImageUploader } from "./ImageUploader";

interface DiscoveredMedia {
  url: string;
  key?: string | null;
  source: string;
  label: string;
}

export function MediaLibrary() {
  const { settings, sections, signatureDishes, gallery, refreshCMS } = useCMS();

  // Search & filter
  const [filterType, setFilterType] = useState<string>("all");
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Migration state
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState<MigrationProgress | null>(null);
  const [migrationErrors, setMigrationErrors] = useState<string[]>([]);
  const [migrationCompleted, setMigrationCompleted] = useState(false);

  // Menu items list for image scanning
  const [menuItems, setMenuItems] = useState<any[]>([]);
  const [loadingMedia, setLoadingMedia] = useState(false);

  // Fetch menu items to discover all images
  const fetchMenuItems = async () => {
    try {
      setLoadingMedia(true);
      const { data } = await supabase
        .from("menu_items")
        .select("id, name, image_url, image_key");
      if (data) setMenuItems(data);
    } catch {
      // Ignore if supabase offline
    } finally {
      setLoadingMedia(false);
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // Aggregate all images currently referenced across the entire system
  const mediaItems: DiscoveredMedia[] = useMemo(() => {
    const list: DiscoveredMedia[] = [];

    // Logos
    if (settings.logo_url) {
      list.push({
        url: settings.logo_url,
        key: settings.logo_key,
        source: "Branding",
        label: "Light Logo (Dark Background)",
      });
    }
    if (settings.logo_dark_url) {
      list.push({
        url: settings.logo_dark_url,
        key: settings.logo_dark_key,
        source: "Branding",
        label: "Dark Logo (Light Background)",
      });
    }

    // Sections
    Object.entries(sections).forEach(([secKey, sec]) => {
      if (sec.image_url) {
        list.push({
          url: sec.image_url,
          key: sec.image_key,
          source: secKey.charAt(0).toUpperCase() + secKey.slice(1),
          label: `${secKey} Main Image`,
        });
      }
      if (sec.secondary_image_url) {
        list.push({
          url: sec.secondary_image_url,
          key: sec.secondary_image_key,
          source: secKey.charAt(0).toUpperCase() + secKey.slice(1),
          label: `${secKey} Secondary Image`,
        });
      }
    });

    // Signature Dishes
    signatureDishes.forEach((dish) => {
      if (dish.image_url) {
        list.push({
          url: dish.image_url,
          key: dish.image_key,
          source: "Signature Dishes",
          label: dish.name,
        });
      }
    });

    // Gallery
    gallery.forEach((g) => {
      if (g.image_url) {
        list.push({
          url: g.image_url,
          key: g.image_key,
          source: "Gallery",
          label: g.title,
        });
      }
    });

    // Menu Items
    menuItems.forEach((m) => {
      if (m.image_url) {
        list.push({
          url: m.image_url,
          key: m.image_key,
          source: "Menu Items",
          label: m.name,
        });
      }
    });

    // Deduplicate by URL while collecting multiple usages
    const deduplicated = new Map<string, DiscoveredMedia>();
    list.forEach((item) => {
      if (!item.url) return;
      const existing = deduplicated.get(item.url);
      if (existing) {
        existing.label = `${existing.label}, ${item.label}`;
      } else {
        deduplicated.set(item.url, { ...item });
      }
    });

    return Array.from(deduplicated.values());
  }, [settings, sections, signatureDishes, gallery, menuItems]);

  const filteredMedia = useMemo(() => {
    if (filterType === "all") return mediaItems;
    return mediaItems.filter(
      (m) => m.source.toLowerCase() === filterType.toLowerCase()
    );
  }, [mediaItems, filterType]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const handleDelete = async (item: DiscoveredMedia) => {
    const confirmMsg = `Are you sure you want to delete this image?\n\nIt is currently referenced in: ${item.label}\n\nThis will remove the file from Cloudflare R2.`;
    if (!confirm(confirmMsg)) return;

    try {
      if (item.key) {
        await deleteFromR2(item.key);
      }
      alert("Image deleted from Cloudflare R2.");
      fetchMenuItems();
      await refreshCMS();
    } catch (err: unknown) {
      alert(`Delete failed: ${err instanceof Error ? err.message : err}`);
    }
  };

  const handleRunMigration = async () => {
    if (
      !confirm(
        "Upload all local project assets to your Cloudflare R2 bucket and update Supabase with the permanent R2 URLs?\n\nThis will take ~10-20 seconds."
      )
    ) {
      return;
    }

    setIsMigrating(true);
    setMigrationCompleted(false);
    setMigrationErrors([]);

    try {
      const result = await migrateLocalImagesToCloudflare((p) => {
        setMigrationStatus(p);
      });

      if (result.errors.length > 0) {
        setMigrationErrors(result.errors);
      }
      setMigrationCompleted(true);
      await refreshCMS();
      await fetchMenuItems();
    } catch (err: unknown) {
      alert(`Migration error: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-[#D9B780]/20 pb-4">
        <h2 className="font-display text-2xl text-[#FFF9F1]">Cloudflare R2 Media Library</h2>
        <p className="text-xs text-[#F7F2E9]/70 mt-0.5">
          Fast, optimized image storage powered by Cloudflare R2 and client-side WebP compression.
        </p>
      </div>

      {/* Migration to Cloudflare Banner */}
      <div className="bg-[#12352B]/40 border border-[#D9B780]/40 p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D9B780]" />
              <h3 className="font-display text-lg text-[#FFF9F1]">
                Migrate Existing Local Images to Cloudflare R2
              </h3>
            </div>
            <p className="text-xs text-[#F7F2E9]/80 leading-relaxed">
              Upload all bundled restaurant photos (dining room, dishes, logos, ambiance) into your
              Cloudflare R2 bucket and automatically update the database with permanent R2 URLs.
            </p>
          </div>

          <button
            type="button"
            disabled={isMigrating}
            onClick={handleRunMigration}
            className="px-5 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center justify-center gap-2 shrink-0 transition-colors"
          >
            {isMigrating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#D9B780]" />
                <span>Migrating ({migrationStatus?.completed || 0}/{migrationStatus?.total || 14})...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-4 h-4 text-[#D9B780]" />
                <span>Migrate Existing Images to Cloudflare</span>
              </>
            )}
          </button>
        </div>

        {/* Live Migration Progress Bar */}
        {isMigrating && migrationStatus && (
          <div className="mt-4 pt-4 border-t border-[#D9B780]/20 space-y-2">
            <div className="flex justify-between text-xs text-[#D9B780]">
              <span>Uploading: {migrationStatus.currentName}</span>
              <span>{Math.round((migrationStatus.completed / migrationStatus.total) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-[#10110F] border border-[#D9B780]/30 overflow-hidden">
              <div
                className="h-full bg-[#D9B780] transition-all duration-300"
                style={{
                  width: `${(migrationStatus.completed / migrationStatus.total) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {migrationCompleted && (
          <div className="mt-4 pt-4 border-t border-[#D9B780]/20 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Migration completed! All website assets are stored in Cloudflare R2.</span>
          </div>
        )}

        {migrationErrors.length > 0 && (
          <div className="mt-3 bg-[#811C36]/30 border border-[#811C36] p-3 text-xs text-rose-200 space-y-1">
            <p className="font-semibold text-rose-100">Notice:</p>
            {migrationErrors.map((e, idx) => (
              <p key={idx}>{e}</p>
            ))}
          </div>
        )}
      </div>

      {/* Direct Cloudflare R2 Upload Widget */}
      <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-4">
        <h3 className="font-display text-lg text-[#FFF9F1] flex items-center gap-2">
          <UploadCloud className="w-4 h-4 text-[#D9B780]" />
          <span>Quick Upload New Media to R2</span>
        </h3>
        <p className="text-xs text-[#F7F2E9]/70">
          Upload any new photo. It will be converted to high-performance WebP and stored on Cloudflare R2.
        </p>
        <ImageUploader
          label="Select Image to Upload to Cloudflare"
          folder="uploads"
          value=""
          onChange={(url) => {
            alert(`File uploaded to Cloudflare R2 successfully!\n\nPublic URL: ${url}`);
            fetchMenuItems();
            refreshCMS();
          }}
        />
      </div>

      {/* Media Browser & Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D9B780]/20 pb-3">
          <div className="flex items-center gap-2">
            <h3 className="font-display text-xl text-[#FFF9F1]">
              Media Gallery ({mediaItems.length} items discovered)
            </h3>
            {loadingMedia && <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D9B780]" />}
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-[#D9B780]" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-[#10110F] border border-[#D9B780]/30 px-3 py-1.5 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
            >
              <option value="all">All Sources</option>
              <option value="hero">Hero</option>
              <option value="story">Our Story</option>
              <option value="signature dishes">Signature Dishes</option>
              <option value="banner">Banner</option>
              <option value="gallery">Gallery</option>
              <option value="branding">Branding</option>
              <option value="menu items">Menu Items</option>
            </select>
          </div>
        </div>

        {filteredMedia.length === 0 ? (
          <div className="p-12 text-center border border-[#D9B780]/20 bg-[#12352B]/10">
            <ImageIcon className="w-8 h-8 text-[#D9B780]/40 mx-auto mb-2" />
            <p className="text-xs text-[#F7F2E9]/60">No media items found for this filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedia.map((item, idx) => (
              <div
                key={`${item.url}-${idx}`}
                className="bg-[#10110F] border border-[#D9B780]/25 overflow-hidden flex flex-col justify-between group"
              >
                {/* Thumbnail */}
                <div className="aspect-[4/3] bg-[#12352B]/30 relative overflow-hidden">
                  <img
                    src={item.url}
                    alt={item.label}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#10110F]/85 border border-[#D9B780]/30 text-[0.62rem] text-[#D9B780] uppercase tracking-wider">
                    {item.source}
                  </span>
                </div>

                {/* Details */}
                <div className="p-3 space-y-2">
                  <div>
                    <p className="text-xs text-[#FFF9F1] font-medium line-clamp-1">{item.label}</p>
                    <p className="text-[0.68rem] text-[#D9B780]/80 truncate font-mono mt-0.5">
                      {item.key || item.url.split("/").pop()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-[#D9B780]/15 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleCopy(item.url)}
                      className="px-2.5 py-1 bg-[#12352B] border border-[#D9B780]/30 text-xs text-[#FFF9F1] hover:border-[#D9B780] flex items-center gap-1 transition-colors"
                      title="Copy Public URL"
                    >
                      {copiedUrl === item.url ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3 text-[#D9B780]" />
                          <span>Copy URL</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 border border-[#D9B780]/30 text-[#D9B780] hover:text-[#FFF9F1]"
                        title="Open image in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(item)}
                        className="p-1 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                        title="Delete from R2"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
