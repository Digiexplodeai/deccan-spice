import React, { useState } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Image as ImageIcon,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { supabase, type GalleryItem, type SignatureDish, type CmsReview } from "../../lib/supabase";
import { useCMS } from "../../lib/cmsContext";
import { ImageUploader } from "./ImageUploader";

type CmsSubTab =
  | "hero"
  | "story"
  | "signature"
  | "banner"
  | "gallery"
  | "reviews"
  | "contact"
  | "hours"
  | "seo";

const SUB_TABS: { id: CmsSubTab; label: string; icon: any }[] = [
  { id: "hero", label: "Hero Banner", icon: Globe },
  { id: "story", label: "Our Story", icon: Layers },
  { id: "signature", label: "Signature Dishes", icon: Flame },
  { id: "banner", label: "Experience Banner", icon: Sparkles },
  { id: "gallery", label: "Gallery Photos", icon: ImageIcon },
  { id: "reviews", label: "Guest Reviews", icon: MessageSquare },
  { id: "contact", label: "Contact & Footer", icon: Globe },
  { id: "hours", label: "Opening Hours", icon: Layers },
  { id: "seo", label: "SEO & Branding", icon: Sparkles },
];

export function AdminCmsSection() {
  const {
    settings,
    sections,
    signatureDishes,
    gallery,
    reviews,
    refreshCMS,
  } = useCMS();

  const [activeSubTab, setActiveSubTab] = useState<CmsSubTab>("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable local copies of section states
  const [sectionForms, setSectionForms] = useState<Record<string, any>>({});
  const [settingsForm, setSettingsForm] = useState<Record<string, any>>({});

  // Modals for array items
  const [editingDish, setEditingDish] = useState<Partial<SignatureDish> | null>(null);
  const [editingGallery, setEditingGallery] = useState<Partial<GalleryItem> | null>(null);
  const [editingReview, setEditingReview] = useState<Partial<CmsReview> | null>(null);

  // Initialize or get section form state
  const getSectionState = (key: string) => {
    if (sectionForms[key]) return sectionForms[key];
    const sec = sections[key] || {};
    return {
      title: sec.title || "",
      subtitle: sec.subtitle || "",
      eyebrow: sec.eyebrow || "",
      body: sec.body || "",
      button_text: sec.button_text || "",
      button_link: sec.button_link || "",
      secondary_button_text: sec.secondary_button_text || "",
      secondary_button_link: sec.secondary_button_link || "",
      image_url: sec.image_url || "",
      image_key: sec.image_key || "",
      image_alt: sec.image_alt || "",
      secondary_image_url: sec.secondary_image_url || "",
      secondary_image_key: sec.secondary_image_key || "",
      secondary_image_alt: sec.secondary_image_alt || "",
      is_visible: sec.is_visible !== false,
      extra: sec.extra || {},
    };
  };

  const updateSectionField = (key: string, field: string, value: any) => {
    const current = getSectionState(key);
    setSectionForms((prev) => ({
      ...prev,
      [key]: { ...current, [field]: value },
    }));
  };

  const getSettingsState = () => {
    return {
      restaurant_name: settingsForm.restaurant_name ?? settings.restaurant_name ?? "",
      tagline: settingsForm.tagline ?? settings.tagline ?? "",
      phone: settingsForm.phone ?? settings.phone ?? "",
      email: settingsForm.email ?? settings.email ?? "",
      address: settingsForm.address ?? settings.address ?? "",
      center: settingsForm.center ?? settings.center ?? "",
      google_maps_url: settingsForm.google_maps_url ?? settings.google_maps_url ?? "",
      seo_title: settingsForm.seo_title ?? settings.seo_title ?? "",
      seo_description: settingsForm.seo_description ?? settings.seo_description ?? "",
      logo_url: settingsForm.logo_url ?? settings.logo_url ?? "",
      logo_key: settingsForm.logo_key ?? settings.logo_key ?? "",
      logo_dark_url: settingsForm.logo_dark_url ?? settings.logo_dark_url ?? "",
      logo_dark_key: settingsForm.logo_dark_key ?? settings.logo_dark_key ?? "",
      social_links: settingsForm.social_links ?? settings.social_links ?? {
        instagram: "",
        facebook: "",
        tripadvisor: "",
        yelp: "",
      },
      opening_hours: settingsForm.opening_hours ?? settings.opening_hours ?? [],
    };
  };

  const updateSettingsField = (field: string, value: any) => {
    setSettingsForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Save Section
  const handleSaveSection = async (key: string) => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);
    try {
      const data = getSectionState(key);
      const { error } = await supabase
        .from("site_sections")
        .upsert({
          key,
          title: data.title,
          subtitle: data.subtitle,
          eyebrow: data.eyebrow,
          body: data.body,
          button_text: data.button_text,
          button_link: data.button_link,
          secondary_button_text: data.secondary_button_text,
          secondary_button_link: data.secondary_button_link,
          image_url: data.image_url,
          image_key: data.image_key,
          image_alt: data.image_alt,
          secondary_image_url: data.secondary_image_url,
          secondary_image_key: data.secondary_image_key,
          secondary_image_alt: data.secondary_image_alt,
          is_visible: data.is_visible,
          extra: data.extra,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      await refreshCMS();
      setSaveSuccess(`Section "${key}" updated successfully!`);
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save section.");
    } finally {
      setIsSaving(false);
    }
  };

  // Save Settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(null);
    try {
      const data = getSettingsState();
      const { error } = await supabase
        .from("site_settings")
        .update({
          restaurant_name: data.restaurant_name,
          tagline: data.tagline,
          phone: data.phone,
          email: data.email,
          address: data.address,
          center: data.center,
          google_maps_url: data.google_maps_url,
          seo_title: data.seo_title,
          seo_description: data.seo_description,
          logo_url: data.logo_url,
          logo_key: data.logo_key,
          logo_dark_url: data.logo_dark_url,
          logo_dark_key: data.logo_dark_key,
          social_links: data.social_links,
          opening_hours: data.opening_hours,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "current");

      if (error) throw error;
      await refreshCMS();
      setSaveSuccess("Site settings updated successfully!");
      setTimeout(() => setSaveSuccess(null), 3500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  // Signature Dishes CRUD
  const handleSaveDish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDish || !editingDish.name) return;
    setIsSaving(true);
    try {
      if (editingDish.id) {
        const { error } = await supabase
          .from("signature_dishes")
          .update({
            name: editingDish.name,
            course: editingDish.course || "Entrée",
            price_label: editingDish.price_label || "$24.95",
            tagline: editingDish.tagline || "",
            description: editingDish.description || "",
            image_url: editingDish.image_url,
            image_key: editingDish.image_key,
            mood_bg: editingDish.mood_bg,
            is_visible: editingDish.is_visible !== false,
            sort_order: editingDish.sort_order ?? 0,
          })
          .eq("id", editingDish.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("signature_dishes").insert({
          name: editingDish.name,
          course: editingDish.course || "Entrée",
          price_label: editingDish.price_label || "$24.95",
          tagline: editingDish.tagline || "",
          description: editingDish.description || "",
          image_url: editingDish.image_url || "",
          image_key: editingDish.image_key || null,
          mood_bg: editingDish.mood_bg || null,
          is_visible: editingDish.is_visible !== false,
          sort_order: (signatureDishes.length + 1) * 10,
        });
        if (error) throw error;
      }
      setEditingDish(null);
      await refreshCMS();
      setSaveSuccess("Dish updated successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      alert(`Error saving dish: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteDish = async (id: string, name: string) => {
    if (!confirm(`Delete signature dish "${name}"?`)) return;
    try {
      const { error } = await supabase.from("signature_dishes").delete().eq("id", id);
      if (error) throw error;
      await refreshCMS();
      setSaveSuccess(`Deleted "${name}".`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  const handleToggleDishVisibility = async (dish: SignatureDish) => {
    try {
      const { error } = await supabase
        .from("signature_dishes")
        .update({ is_visible: !dish.is_visible })
        .eq("id", dish.id);
      if (error) throw error;
      await refreshCMS();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Gallery CRUD
  const handleSaveGalleryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGallery || !editingGallery.image_url) return;
    setIsSaving(true);
    try {
      if (editingGallery.id) {
        const { error } = await supabase
          .from("gallery_items")
          .update({
            title: editingGallery.title || "Gallery Photograph",
            category: editingGallery.category || "The Restaurant",
            caption: editingGallery.caption || "",
            image_url: editingGallery.image_url,
            image_key: editingGallery.image_key,
            alt_text: editingGallery.alt_text || editingGallery.title,
            is_visible: editingGallery.is_visible !== false,
            sort_order: editingGallery.sort_order ?? 0,
          })
          .eq("id", editingGallery.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("gallery_items").insert({
          title: editingGallery.title || "Gallery Photograph",
          category: editingGallery.category || "The Restaurant",
          caption: editingGallery.caption || "",
          image_url: editingGallery.image_url,
          image_key: editingGallery.image_key || null,
          alt_text: editingGallery.alt_text || editingGallery.title,
          is_visible: editingGallery.is_visible !== false,
          sort_order: (gallery.length + 1) * 10,
        });
        if (error) throw error;
      }
      setEditingGallery(null);
      await refreshCMS();
      setSaveSuccess("Gallery item saved successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      alert(`Error saving gallery photo: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGalleryItem = async (id: string, title: string) => {
    if (!confirm(`Delete gallery photo "${title}"?`)) return;
    try {
      const { error } = await supabase.from("gallery_items").delete().eq("id", id);
      if (error) throw error;
      await refreshCMS();
      setSaveSuccess(`Deleted photo.`);
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Reviews CRUD
  const handleSaveReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingReview || !editingReview.text) return;
    setIsSaving(true);
    try {
      if (editingReview.id) {
        const { error } = await supabase
          .from("reviews")
          .update({
            author: editingReview.author || "Guest",
            source: editingReview.source || "Google Review",
            rating: editingReview.rating ? String(editingReview.rating) : "5.0",
            detail: editingReview.detail || "Verified diner rating",
            text: editingReview.text,
            is_visible: editingReview.is_visible !== false,
            sort_order: editingReview.sort_order ?? 0,
          })
          .eq("id", editingReview.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("reviews").insert({
          author: editingReview.author || "Guest",
          source: editingReview.source || "Google Review",
          rating: editingReview.rating ? String(editingReview.rating) : "5.0",
          detail: editingReview.detail || "Verified diner rating",
          text: editingReview.text,
          is_visible: editingReview.is_visible !== false,
          sort_order: (reviews.length + 1) * 10,
        });
        if (error) throw error;
      }
      setEditingReview(null);
      await refreshCMS();
      setSaveSuccess("Review saved successfully!");
      setTimeout(() => setSaveSuccess(null), 3000);
    } catch (err: unknown) {
      alert(`Error saving review: ${err instanceof Error ? err.message : err}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm("Delete this review?")) return;
    try {
      const { error } = await supabase.from("reviews").delete().eq("id", id);
      if (error) throw error;
      await refreshCMS();
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {saveSuccess && (
        <div className="bg-[#12352B] border border-[#D9B780] p-4 text-xs text-[#FFF9F1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D9B780]" />
            <span>{saveSuccess}</span>
          </div>
          <button type="button" onClick={() => setSaveSuccess(null)} className="text-[#D9B780] hover:text-[#FFF9F1]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="bg-[#811C36]/30 border border-[#811C36] p-4 text-xs text-rose-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D9B780]" />
            <span>{errorMessage}</span>
          </div>
          <button type="button" onClick={() => setErrorMessage(null)} className="text-[#D9B780] hover:text-[#FFF9F1]">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Sub-Tabs and Preview Website button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#D9B780]/20 pb-4">
        <div>
          <h2 className="font-display text-2xl text-[#FFF9F1]">Website Content & CMS</h2>
          <p className="text-xs text-[#F7F2E9]/70 mt-0.5">
            Manage all copy, photos, dishes, and layout sections across the public website.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 border border-[#D9B780]/50 hover:bg-[#D9B780] hover:text-[#10110F] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-1.5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Preview Website</span>
          </a>
        </div>
      </div>

      {/* Secondary Horizontal Sub-Nav */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2 border-b border-[#D9B780]/15">
        {SUB_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3 py-2 text-xs font-medium tracking-wider uppercase flex items-center gap-2 border transition-all shrink-0 ${
                active
                  ? "bg-[#811C36] border-[#D9B780] text-[#FFF9F1]"
                  : "bg-[#1D1712]/50 border-[#D9B780]/20 text-[#F7F2E9]/70 hover:text-[#FFF9F1] hover:border-[#D9B780]/50"
              }`}
            >
              <Icon className="w-3.5 h-3.5 text-[#D9B780]" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ======================================================================== */}
      {/* 1. HERO BANNER */}
      {/* ======================================================================== */}
      {activeSubTab === "hero" && (() => {
        const form = getSectionState("hero");
        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Cinematic Hero Section</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  The primary landing banner visible at the top of the homepage.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#D9B780]">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) => updateSectionField("hero", "is_visible", e.target.checked)}
                  className="rounded border-[#D9B780] text-[#811C36] focus:ring-0"
                />
                <span>Visible on Site</span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={form.eyebrow}
                    onChange={(e) => updateSectionField("hero", "eyebrow", e.target.value)}
                    placeholder="INDIAN FINE DINING · POMPANO BEACH"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Primary Headline
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateSectionField("hero", "title", e.target.value)}
                      placeholder="India, Served"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Italic Subtitle
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => updateSectionField("hero", "subtitle", e.target.value)}
                      placeholder="Beautifully."
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Body Description
                  </label>
                  <textarea
                    rows={3}
                    value={form.body}
                    onChange={(e) => updateSectionField("hero", "body", e.target.value)}
                    placeholder="Authentic flavors. Extraordinary moments."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Primary Button Text
                    </label>
                    <input
                      type="text"
                      value={form.button_text}
                      onChange={(e) => updateSectionField("hero", "button_text", e.target.value)}
                      placeholder="Reserve Your Table"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Secondary Button Text
                    </label>
                    <input
                      type="text"
                      value={form.secondary_button_text}
                      onChange={(e) => updateSectionField("hero", "secondary_button_text", e.target.value)}
                      placeholder="Explore Our Menu"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <ImageUploader
                  label="Hero Background Photo"
                  recommendedSize="1920x1080 (High resolution dining room or ambiance)"
                  folder="hero"
                  value={form.image_url}
                  imageKey={form.image_key}
                  altText={form.image_alt}
                  onChange={(url, key, alt) => {
                    updateSectionField("hero", "image_url", url);
                    updateSectionField("hero", "image_key", key);
                    updateSectionField("hero", "image_alt", alt);
                  }}
                  onRemove={() => {
                    updateSectionField("hero", "image_url", "");
                    updateSectionField("hero", "image_key", "");
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSection("hero")}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Hero Section</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 2. OUR STORY */}
      {/* ======================================================================== */}
      {activeSubTab === "story" && (() => {
        const form = getSectionState("story");
        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Our Story & Heritage</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  The warm editorial section introducing the history, philosophy, and craft.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#D9B780]">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) => updateSectionField("story", "is_visible", e.target.checked)}
                  className="rounded border-[#D9B780] text-[#811C36] focus:ring-0"
                />
                <span>Visible on Site</span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Eyebrow Tag
                  </label>
                  <input
                    type="text"
                    value={form.eyebrow}
                    onChange={(e) => updateSectionField("story", "eyebrow", e.target.value)}
                    placeholder="Our Heritage · Pompano Beach"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Headline
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => updateSectionField("story", "title", e.target.value)}
                      placeholder="A Journey Through"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Italic Accent
                    </label>
                    <input
                      type="text"
                      value={form.subtitle}
                      onChange={(e) => updateSectionField("story", "subtitle", e.target.value)}
                      placeholder="India’s Flavors."
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Story Text (Multiline)
                  </label>
                  <textarea
                    rows={5}
                    value={form.body}
                    onChange={(e) => updateSectionField("story", "body", e.target.value)}
                    placeholder="Discover authentic recipes, aromatic spices..."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={form.button_text}
                    onChange={(e) => updateSectionField("story", "button_text", e.target.value)}
                    placeholder="Our Story"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <ImageUploader
                  label="Primary Interior Photo"
                  recommendedSize="1200x900 (Architectural dining room photo)"
                  folder="story"
                  value={form.image_url}
                  imageKey={form.image_key}
                  altText={form.image_alt}
                  onChange={(url, key, alt) => {
                    updateSectionField("story", "image_url", url);
                    updateSectionField("story", "image_key", key);
                    updateSectionField("story", "image_alt", alt);
                  }}
                  onRemove={() => {
                    updateSectionField("story", "image_url", "");
                    updateSectionField("story", "image_key", "");
                  }}
                />

                <ImageUploader
                  label="Overlapping Accent Photo"
                  recommendedSize="800x600 (Plated dish or spice close-up)"
                  folder="story"
                  value={form.secondary_image_url}
                  imageKey={form.secondary_image_key}
                  altText={form.secondary_image_alt}
                  onChange={(url, key, alt) => {
                    updateSectionField("story", "secondary_image_url", url);
                    updateSectionField("story", "secondary_image_key", key);
                    updateSectionField("story", "secondary_image_alt", alt);
                  }}
                  onRemove={() => {
                    updateSectionField("story", "secondary_image_url", "");
                    updateSectionField("story", "secondary_image_key", "");
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSection("story")}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Story Section</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 3. SIGNATURE DISHES */}
      {/* ======================================================================== */}
      {activeSubTab === "signature" && (() => {
        const form = getSectionState("signature");
        return (
          <div className="space-y-6">
            <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
                <div>
                  <h3 className="font-display text-xl text-[#FFF9F1]">Signature Showcase Header</h3>
                  <p className="text-xs text-[#F7F2E9]/70">
                    Customize titles for the interactive signature creations stage.
                  </p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#D9B780]">
                  <input
                    type="checkbox"
                    checked={form.is_visible}
                    onChange={(e) => updateSectionField("signature", "is_visible", e.target.checked)}
                    className="rounded border-[#D9B780] text-[#811C36] focus:ring-0"
                  />
                  <span>Visible on Site</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Eyebrow
                  </label>
                  <input
                    type="text"
                    value={form.eyebrow}
                    onChange={(e) => updateSectionField("signature", "eyebrow", e.target.value)}
                    placeholder="Signature Creations"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateSectionField("signature", "title", e.target.value)}
                    placeholder="Crafted Over Fire &"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Subtitle Accent
                  </label>
                  <input
                    type="text"
                    value={form.subtitle}
                    onChange={(e) => updateSectionField("signature", "subtitle", e.target.value)}
                    placeholder="Saffron."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => handleSaveSection("signature")}
                  disabled={isSaving}
                  className="px-5 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Update Header</span>
                </button>
              </div>
            </div>

            {/* Dishes List & CRUD */}
            <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
                <div>
                  <h3 className="font-display text-xl text-[#FFF9F1]">Showcase Dishes ({signatureDishes.length})</h3>
                  <p className="text-xs text-[#F7F2E9]/70">
                    Add, edit, or replace photos and descriptions for the signature carousel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingDish({
                      name: "",
                      course: "Entrée",
                      price_label: "$24.95",
                      tagline: "",
                      description: "",
                      image_url: "",
                      is_visible: true,
                    })
                  }
                  className="px-4 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Showcase Dish</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {signatureDishes.map((dish, idx) => (
                  <div
                    key={dish.id}
                    className="bg-[#10110F] border border-[#D9B780]/25 overflow-hidden flex flex-col justify-between"
                  >
                    <div className="aspect-[4/3] relative bg-[#12352B]/50 overflow-hidden">
                      {dish.image_url ? (
                        <img
                          src={dish.image_url}
                          alt={dish.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-[#D9B780]">
                          No Photo
                        </div>
                      )}
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#10110F]/85 border border-[#D9B780]/40 text-[0.62rem] text-[#D9B780] uppercase tracking-wider">
                        0{idx + 1} · {dish.course}
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h4 className="font-display text-lg text-[#FFF9F1] leading-snug">{dish.name}</h4>
                          <span className="text-xs text-[#D9B780] font-medium shrink-0">{dish.price_label}</span>
                        </div>
                        <p className="text-xs text-[#F7F2E9]/70 line-clamp-2 mt-1">
                          {dish.tagline || dish.description}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-[#D9B780]/15 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleDishVisibility(dish)}
                          className={`text-xs p-1.5 border ${
                            dish.is_visible
                              ? "text-emerald-400 border-emerald-500/30"
                              : "text-amber-400 border-amber-500/30"
                          }`}
                          title={dish.is_visible ? "Visible on site" : "Hidden"}
                        >
                          {dish.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingDish(dish)}
                            className="px-2.5 py-1 bg-[#12352B] border border-[#D9B780]/40 text-xs text-[#D9B780] hover:text-[#FFF9F1]"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDish(dish.id, dish.name)}
                            className="p-1 border border-rose-500/30 text-rose-300 hover:bg-rose-500/20"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dish Edit Modal */}
            {editingDish && (
              <div className="fixed inset-0 z-50 bg-[#10110F]/90 flex items-center justify-center p-4">
                <form
                  onSubmit={handleSaveDish}
                  className="bg-[#12352B] border border-[#D9B780] max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
                >
                  <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3">
                    <h4 className="font-display text-xl text-[#FFF9F1]">
                      {editingDish.id ? "Edit Signature Dish" : "Add Signature Dish"}
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingDish(null)}
                      className="text-[#D9B780] hover:text-[#FFF9F1]"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                        Dish Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editingDish.name || ""}
                        onChange={(e) => setEditingDish({ ...editingDish, name: e.target.value })}
                        placeholder="Slow-Cooked Dum Biryani"
                        className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                        Course Tag
                      </label>
                      <input
                        type="text"
                        value={editingDish.course || ""}
                        onChange={(e) => setEditingDish({ ...editingDish, course: e.target.value })}
                        placeholder="Signature Entrée"
                        className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                        Price Display Label
                      </label>
                      <input
                        type="text"
                        value={editingDish.price_label || ""}
                        onChange={(e) => setEditingDish({ ...editingDish, price_label: e.target.value })}
                        placeholder="$24.95"
                        className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </div>
                    <div>
                      <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                        Mood Background (Optional CSS)
                      </label>
                      <input
                        type="text"
                        value={editingDish.mood_bg || ""}
                        onChange={(e) => setEditingDish({ ...editingDish, mood_bg: e.target.value })}
                        placeholder="radial-gradient(...)"
                        className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Description & Flavor Profile
                    </label>
                    <textarea
                      rows={3}
                      value={editingDish.tagline || editingDish.description || ""}
                      onChange={(e) =>
                        setEditingDish({
                          ...editingDish,
                          tagline: e.target.value,
                          description: e.target.value,
                        })
                      }
                      placeholder="Aged saffron basmati layered with tender spiced cuts and sealed under dough."
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                    />
                  </div>

                  <ImageUploader
                    label="Dish Photo"
                    recommendedSize="1200x900 (High-resolution plated culinary photo)"
                    folder="dishes"
                    value={editingDish.image_url || ""}
                    imageKey={editingDish.image_key || ""}
                    onChange={(url, key) =>
                      setEditingDish({
                        ...editingDish,
                        image_url: url,
                        image_key: key,
                      })
                    }
                    onRemove={() =>
                      setEditingDish({
                        ...editingDish,
                        image_url: "",
                        image_key: "",
                      })
                    }
                  />

                  <div className="pt-4 border-t border-[#D9B780]/20 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs text-[#D9B780]">
                      <input
                        type="checkbox"
                        checked={editingDish.is_visible !== false}
                        onChange={(e) => setEditingDish({ ...editingDish, is_visible: e.target.checked })}
                      />
                      <span>Active & Visible</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditingDish(null)}
                        className="px-4 py-2 border border-[#D9B780]/40 text-xs text-[#FFF9F1]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-medium"
                      >
                        {isSaving ? "Saving..." : "Save Dish"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 4. EXPERIENCE BANNER ("More Than a Meal") */}
      {/* ======================================================================== */}
      {activeSubTab === "banner" && (() => {
        const form = getSectionState("banner");
        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Cinematic Experience Banner</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  Full-bleed visual parallax banner celebrating cocktails, ambiance, and gatherings.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs uppercase tracking-wider text-[#D9B780]">
                <input
                  type="checkbox"
                  checked={form.is_visible}
                  onChange={(e) => updateSectionField("banner", "is_visible", e.target.checked)}
                  className="rounded border-[#D9B780] text-[#811C36] focus:ring-0"
                />
                <span>Visible on Site</span>
              </label>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Main Banner Title
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => updateSectionField("banner", "title", e.target.value)}
                    placeholder="More Than a Meal."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Subtitle / Callout Body
                  </label>
                  <textarea
                    rows={3}
                    value={form.body}
                    onChange={(e) => updateSectionField("banner", "body", e.target.value)}
                    placeholder="Make every occasion extraordinary."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Button Text
                  </label>
                  <input
                    type="text"
                    value={form.button_text}
                    onChange={(e) => updateSectionField("banner", "button_text", e.target.value)}
                    placeholder="Experience Deccan Spice"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <ImageUploader
                  label="Banner Background Photo"
                  recommendedSize="1920x800 (Lounge, cocktails, or celebratory dinner)"
                  folder="banner"
                  value={form.image_url}
                  imageKey={form.image_key}
                  altText={form.image_alt}
                  onChange={(url, key, alt) => {
                    updateSectionField("banner", "image_url", url);
                    updateSectionField("banner", "image_key", key);
                    updateSectionField("banner", "image_alt", alt);
                  }}
                  onRemove={() => {
                    updateSectionField("banner", "image_url", "");
                    updateSectionField("banner", "image_key", "");
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={() => handleSaveSection("banner")}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Banner Section</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 5. GALLERY PHOTOS */}
      {/* ======================================================================== */}
      {activeSubTab === "gallery" && (
        <div className="space-y-6">
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Exhibition Gallery ({gallery.length})</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  Manage photos displayed in the visual exhibition on the homepage and gallery page.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingGallery({
                    title: "",
                    category: "The Restaurant",
                    caption: "",
                    image_url: "",
                    is_visible: true,
                  })
                }
                className="px-4 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Gallery Photo</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {gallery.map((photo) => (
                <div key={photo.id} className="bg-[#10110F] border border-[#D9B780]/25 overflow-hidden flex flex-col justify-between">
                  <div className="aspect-[4/3] relative bg-[#12352B]/40">
                    <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" />
                    <span className="absolute top-2 left-2 px-2 py-0.5 bg-[#10110F]/85 border border-[#D9B780]/30 text-[0.62rem] text-[#D9B780] uppercase tracking-wider">
                      {photo.category}
                    </span>
                  </div>
                  <div className="p-3 space-y-2">
                    <h4 className="font-display text-base text-[#FFF9F1] truncate">{photo.title}</h4>
                    {photo.caption && <p className="text-xs text-[#F7F2E9]/70 line-clamp-1">{photo.caption}</p>}
                    <div className="pt-2 border-t border-[#D9B780]/15 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={() => setEditingGallery(photo)}
                        className="text-xs text-[#D9B780] hover:text-[#FFF9F1]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteGalleryItem(photo.id, photo.title)}
                        className="text-xs text-rose-300 hover:text-rose-100"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Item Modal */}
          {editingGallery && (
            <div className="fixed inset-0 z-50 bg-[#10110F]/90 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveGalleryItem}
                className="bg-[#12352B] border border-[#D9B780] max-w-md w-full p-6 space-y-4 shadow-2xl overflow-y-auto max-h-[90vh]"
              >
                <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3">
                  <h4 className="font-display text-xl text-[#FFF9F1]">
                    {editingGallery.id ? "Edit Photo" : "Add Gallery Photo"}
                  </h4>
                  <button type="button" onClick={() => setEditingGallery(null)} className="text-[#D9B780]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Photo Title
                  </label>
                  <input
                    type="text"
                    required
                    value={editingGallery.title || ""}
                    onChange={(e) => setEditingGallery({ ...editingGallery, title: e.target.value })}
                    placeholder="Marble & Brass Buffet Counter"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Category
                    </label>
                    <select
                      value={editingGallery.category || "The Restaurant"}
                      onChange={(e) => setEditingGallery({ ...editingGallery, category: e.target.value })}
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                    >
                      <option value="The Restaurant">The Restaurant</option>
                      <option value="Cuisine">Cuisine</option>
                      <option value="Buffet & Bar">Buffet & Bar</option>
                      <option value="Celebrations">Celebrations</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Caption (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingGallery.caption || ""}
                      onChange={(e) => setEditingGallery({ ...editingGallery, caption: e.target.value })}
                      placeholder="Daily luncheon spread"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                    />
                  </div>
                </div>

                <ImageUploader
                  label="Photograph File"
                  recommendedSize="1400x900 (High-res interior or dish)"
                  folder="gallery"
                  value={editingGallery.image_url || ""}
                  imageKey={editingGallery.image_key || ""}
                  onChange={(url, key, alt) =>
                    setEditingGallery({
                      ...editingGallery,
                      image_url: url,
                      image_key: key,
                      alt_text: alt,
                    })
                  }
                  onRemove={() =>
                    setEditingGallery({
                      ...editingGallery,
                      image_url: "",
                      image_key: "",
                    })
                  }
                />

                <div className="pt-3 border-t border-[#D9B780]/20 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#D9B780]">
                    <input
                      type="checkbox"
                      checked={editingGallery.is_visible !== false}
                      onChange={(e) => setEditingGallery({ ...editingGallery, is_visible: e.target.checked })}
                    />
                    <span>Visible</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingGallery(null)}
                      className="px-3 py-1.5 border border-[#D9B780]/40 text-xs text-[#FFF9F1]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-1.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase text-[#FFF9F1]"
                    >
                      {isSaving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* 6. GUEST REVIEWS */}
      {/* ======================================================================== */}
      {activeSubTab === "reviews" && (
        <div className="space-y-6">
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Guest Reviews & Ratings ({reviews.length})</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  Featured diner quotes and third-party platform scores.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingReview({
                    author: "Verified Diner",
                    source: "Google Review",
                    rating: "4.9",
                    detail: "Verified diner rating",
                    text: "",
                    is_visible: true,
                  })
                }
                className="px-4 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Review</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map((r) => (
                <div key={r.id} className="bg-[#10110F] border border-[#D9B780]/25 p-4 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#D9B780] font-semibold uppercase tracking-wider">{r.source}</span>
                      <div className="flex items-center gap-0.5 text-[#D9B780]">
                        <Star className="w-3.5 h-3.5 fill-[#D9B780]" />
                        <span className="text-xs font-bold ml-1">{r.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-xs text-[#FFF9F1] italic font-serif leading-relaxed line-clamp-3">
                      "{r.text}"
                    </p>
                    <p className="text-[0.68rem] text-[#F7F2E9]/60">{r.detail}</p>
                  </div>

                  <div className="pt-2 border-t border-[#D9B780]/15 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setEditingReview(r)}
                      className="text-xs text-[#D9B780] hover:text-[#FFF9F1]"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(r.id)}
                      className="text-xs text-rose-300 hover:text-rose-100"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Modal */}
          {editingReview && (
            <div className="fixed inset-0 z-50 bg-[#10110F]/90 flex items-center justify-center p-4">
              <form
                onSubmit={handleSaveReview}
                className="bg-[#12352B] border border-[#D9B780] max-w-md w-full p-6 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3">
                  <h4 className="font-display text-xl text-[#FFF9F1]">
                    {editingReview.id ? "Edit Review" : "Add Review"}
                  </h4>
                  <button type="button" onClick={() => setEditingReview(null)} className="text-[#D9B780]">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Platform Source
                    </label>
                    <input
                      type="text"
                      required
                      value={editingReview.source || ""}
                      onChange={(e) => setEditingReview({ ...editingReview, source: e.target.value })}
                      placeholder="Google Review / Yelp / OpenTable"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                      Rating (1 to 5)
                    </label>
                    <input
                      type="text"
                      value={editingReview.rating || "4.9"}
                      onChange={(e) => setEditingReview({ ...editingReview, rating: e.target.value })}
                      placeholder="4.9"
                      className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Subtitle / Detail
                  </label>
                  <input
                    type="text"
                    value={editingReview.detail || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, detail: e.target.value })}
                    placeholder="Verified diner rating · 650+ reviews"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Review Text / Quote
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={editingReview.text || ""}
                    onChange={(e) => setEditingReview({ ...editingReview, text: e.target.value })}
                    placeholder="The mutton dum biryani and garlic naan were pure perfection..."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div className="pt-3 border-t border-[#D9B780]/20 flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-[#D9B780]">
                    <input
                      type="checkbox"
                      checked={editingReview.is_visible !== false}
                      onChange={(e) => setEditingReview({ ...editingReview, is_visible: e.target.checked })}
                    />
                    <span>Visible</span>
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingReview(null)}
                      className="px-3 py-1.5 border border-[#D9B780]/40 text-xs text-[#FFF9F1]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-1.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase text-[#FFF9F1]"
                    >
                      {isSaving ? "Saving..." : "Save Review"}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* ======================================================================== */}
      {/* 7. CONTACT & FOOTER */}
      {/* ======================================================================== */}
      {activeSubTab === "contact" && (() => {
        const data = getSettingsState();
        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Contact & Location Details</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  Global address, phone, email, and social media handles.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={data.phone}
                    onChange={(e) => updateSettingsField("phone", e.target.value)}
                    placeholder="(954) 555-0199"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(e) => updateSettingsField("email", e.target.value)}
                    placeholder="info@deccanspice.com"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Shopping Center / Plaza
                  </label>
                  <input
                    type="text"
                    value={data.center}
                    onChange={(e) => updateSettingsField("center", e.target.value)}
                    placeholder="Pompano Marketplace"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Full Street Address
                  </label>
                  <input
                    type="text"
                    value={data.address}
                    onChange={(e) => updateSettingsField("address", e.target.value)}
                    placeholder="1234 N Federal Hwy, Pompano Beach, FL 33062"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Google Maps URL
                  </label>
                  <input
                    type="text"
                    value={data.google_maps_url}
                    onChange={(e) => updateSettingsField("google_maps_url", e.target.value)}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs uppercase tracking-wider text-[#D9B780] font-semibold border-b border-[#D9B780]/20 pb-2">
                  Social Media Links
                </h4>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#F7F2E9]/70 mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={data.social_links?.instagram || ""}
                    onChange={(e) =>
                      updateSettingsField("social_links", {
                        ...data.social_links,
                        instagram: e.target.value,
                      })
                    }
                    placeholder="https://instagram.com/deccanspice"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#F7F2E9]/70 mb-1">
                    Facebook URL
                  </label>
                  <input
                    type="text"
                    value={data.social_links?.facebook || ""}
                    onChange={(e) =>
                      updateSettingsField("social_links", {
                        ...data.social_links,
                        facebook: e.target.value,
                      })
                    }
                    placeholder="https://facebook.com/deccanspice"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#F7F2E9]/70 mb-1">
                    Yelp URL
                  </label>
                  <input
                    type="text"
                    value={data.social_links?.yelp || ""}
                    onChange={(e) =>
                      updateSettingsField("social_links", {
                        ...data.social_links,
                        yelp: e.target.value,
                      })
                    }
                    placeholder="https://yelp.com/biz/deccan-spice-pompano"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#F7F2E9]/70 mb-1">
                    Tripadvisor URL
                  </label>
                  <input
                    type="text"
                    value={data.social_links?.tripadvisor || ""}
                    onChange={(e) =>
                      updateSettingsField("social_links", {
                        ...data.social_links,
                        tripadvisor: e.target.value,
                      })
                    }
                    placeholder="https://tripadvisor.com/..."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Contact Info</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 8. OPENING HOURS */}
      {/* ======================================================================== */}
      {activeSubTab === "hours" && (() => {
        const data = getSettingsState();
        const hours = data.opening_hours || [];

        const updateHourRow = (index: number, field: string, val: string) => {
          const next = [...hours];
          next[index] = { ...next[index], [field]: val };
          updateSettingsField("opening_hours", next);
        };

        const addHourRow = () => {
          const next = [...hours, { days: "Special / Holiday", lunch: "11:30 AM – 3:00 PM", dinner: "5:00 PM – 10:00 PM" }];
          updateSettingsField("opening_hours", next);
        };

        const removeHourRow = (index: number) => {
          const next = hours.filter((_: any, i: number) => i !== index);
          updateSettingsField("opening_hours", next);
        };

        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-4">
              <div>
                <h3 className="font-display text-xl text-[#FFF9F1]">Weekly Operating Hours</h3>
                <p className="text-xs text-[#F7F2E9]/70">
                  Controls lunch & dinner schedules shown in footer, contact page, and reservation forms.
                </p>
              </div>
              <button
                type="button"
                onClick={addHourRow}
                className="px-3 py-1.5 bg-[#12352B] border border-[#D9B780] text-[#D9B780] text-xs uppercase tracking-wider flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Row</span>
              </button>
            </div>

            <div className="space-y-3">
              {hours.map((row: any, idx: number) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center bg-[#10110F] border border-[#D9B780]/20 p-3">
                  <div className="sm:col-span-4">
                    <label className="block text-[0.65rem] uppercase tracking-wider text-[#D9B780] mb-0.5">Days</label>
                    <input
                      type="text"
                      value={row.days}
                      onChange={(e) => updateHourRow(idx, "days", e.target.value)}
                      placeholder="Mon – Thu"
                      className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 px-2.5 py-1.5 text-xs text-[#FFF9F1]"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="block text-[0.65rem] uppercase tracking-wider text-[#D9B780] mb-0.5">Lunch</label>
                    <input
                      type="text"
                      value={row.lunch}
                      onChange={(e) => updateHourRow(idx, "lunch", e.target.value)}
                      placeholder="11:30 AM – 3:00 PM"
                      className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 px-2.5 py-1.5 text-xs text-[#FFF9F1]"
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <label className="block text-[0.65rem] uppercase tracking-wider text-[#D9B780] mb-0.5">Dinner</label>
                    <input
                      type="text"
                      value={row.dinner}
                      onChange={(e) => updateHourRow(idx, "dinner", e.target.value)}
                      placeholder="5:00 PM – 10:00 PM"
                      className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 px-2.5 py-1.5 text-xs text-[#FFF9F1]"
                    />
                  </div>
                  <div className="sm:col-span-1 flex justify-end">
                    <button
                      type="button"
                      onClick={() => removeHourRow(idx)}
                      className="p-1.5 text-rose-300 hover:text-rose-100 border border-rose-500/20"
                      title="Remove"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Operating Hours</span>
              </button>
            </div>
          </div>
        );
      })()}

      {/* ======================================================================== */}
      {/* 9. SEO & BRANDING */}
      {/* ======================================================================== */}
      {activeSubTab === "seo" && (() => {
        const data = getSettingsState();
        return (
          <div className="bg-[#12352B]/20 border border-[#D9B780]/25 p-6 space-y-6">
            <div className="border-b border-[#D9B780]/15 pb-4">
              <h3 className="font-display text-xl text-[#FFF9F1]">Brand Assets & Search Engine Optimization</h3>
              <p className="text-xs text-[#F7F2E9]/70">
                Official restaurant logos, Google search title, and social sharing meta description.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Restaurant Official Name
                  </label>
                  <input
                    type="text"
                    value={data.restaurant_name}
                    onChange={(e) => updateSettingsField("restaurant_name", e.target.value)}
                    placeholder="Deccan Spice Indian Kitchen + Bar"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Short Tagline
                  </label>
                  <input
                    type="text"
                    value={data.tagline}
                    onChange={(e) => updateSettingsField("tagline", e.target.value)}
                    placeholder="Authentic Indian Fine Dining in Pompano Beach"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    SEO Meta Title
                  </label>
                  <input
                    type="text"
                    value={data.seo_title}
                    onChange={(e) => updateSettingsField("seo_title", e.target.value)}
                    placeholder="Deccan Spice Pompano | Authentic Indian Fine Dining"
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                  <p className="text-[0.65rem] text-[#F7F2E9]/60 mt-1">Recommended length: 50–60 characters.</p>
                </div>

                <div>
                  <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    SEO Meta Description
                  </label>
                  <textarea
                    rows={3}
                    value={data.seo_description}
                    onChange={(e) => updateSettingsField("seo_description", e.target.value)}
                    placeholder="Experience authentic Hyderabadi dum biryani, tandoori specialties..."
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 px-3 py-2 text-xs text-[#FFF9F1]"
                  />
                  <p className="text-[0.65rem] text-[#F7F2E9]/60 mt-1">Recommended length: 140–160 characters.</p>
                </div>
              </div>

              <div className="lg:col-span-5 space-y-4">
                <ImageUploader
                  label="Navbar / Dark Background Logo (Light Text)"
                  recommendedSize="960x240 PNG or WebP with transparent background"
                  folder="branding"
                  value={data.logo_dark_url || data.logo_url}
                  imageKey={data.logo_dark_key || data.logo_key}
                  onChange={(url, key) => {
                    updateSettingsField("logo_dark_url", url);
                    updateSettingsField("logo_dark_key", key);
                  }}
                  onRemove={() => {
                    updateSettingsField("logo_dark_url", "");
                    updateSettingsField("logo_dark_key", "");
                  }}
                />

                <ImageUploader
                  label="Light Background Logo (Dark Text)"
                  recommendedSize="960x240 PNG or WebP with transparent background"
                  folder="branding"
                  value={data.logo_url}
                  imageKey={data.logo_key}
                  onChange={(url, key) => {
                    updateSettingsField("logo_url", url);
                    updateSettingsField("logo_key", key);
                  }}
                  onRemove={() => {
                    updateSettingsField("logo_url", "");
                    updateSettingsField("logo_key", "");
                  }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-[#D9B780]/20 flex justify-end">
              <button
                type="button"
                onClick={handleSaveSettings}
                disabled={isSaving}
                className="px-6 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-wider font-medium flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save SEO & Branding</span>
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
