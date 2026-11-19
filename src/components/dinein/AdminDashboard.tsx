import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  Download,
  Edit2,
  Eye,
  EyeOff,
  Flame,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  Lock,
  LogOut,
  Mail,
  Plus,
  Printer,
  QrCode,
  RefreshCw,
  Search,
  Settings as SettingsIcon,
  ShoppingBag,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Upload,
  User,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import {
  isSupabaseConfigured,
  supabase,
  type MenuCategory,
  type MenuItem,
  type Order,
  type OrderStatus,
  type RestaurantSettings,
  type RestaurantTable,
  type ServiceRequest,
} from "../../lib/supabase";
import { playChime } from "./audio";
import { PrintableQRCards } from "./PrintableQRCards";
import { useNoIndex } from "./useNoIndex";
import { AdminCmsSection } from "../admin/AdminCmsSection";
import { MediaLibrary } from "../admin/MediaLibrary";
import { ImageUploader } from "../admin/ImageUploader";

type AdminTab = "orders" | "service" | "tables" | "menu" | "website" | "media" | "reports" | "settings";

export function AdminDashboard() {
  useNoIndex();

  // Authentication state
  const [sessionUser, setSessionUser] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>("orders");

  // Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Modals & UI States
  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [bulkTableModalOpen, setBulkTableModalOpen] = useState(false);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Table form state
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);
  const [tableNumber, setTableNumber] = useState<number>(1);
  const [tableLabel, setTableLabel] = useState("");
  const [tableSeats, setTableSeats] = useState<number>(4);
  const [tableSection, setTableSection] = useState("Main Dining");

  // Bulk Table state
  const [bulkStart, setBulkStart] = useState<number>(1);
  const [bulkEnd, setBulkEnd] = useState<number>(10);
  const [bulkSection, setBulkSection] = useState("Main Dining");
  const [bulkSeats, setBulkSeats] = useState<number>(4);

  // Menu Item form state
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemCategoryId, setItemCategoryId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemDesc, setItemDesc] = useState("");
  const [itemPrice, setItemPrice] = useState<string>("16.99");
  const [itemIsVeg, setItemIsVeg] = useState(false);
  const [itemSpiceLevel, setItemSpiceLevel] = useState<number>(0);
  const [itemImageUrl, setItemImageUrl] = useState("");
  const [itemImageKey, setItemImageKey] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Category form state
  const [categoryName, setCategoryName] = useState("");
  const [categorySlug, setCategorySlug] = useState("");

  // Filters
  const [orderFilter, setOrderFilter] = useState<string>("active");
  const [menuSearch, setMenuSearch] = useState("");

  // Base URL for QR generation
  const siteUrl = typeof window !== "undefined" ? window.location.origin : "https://deccanspice.com";

  // Toast helper
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Auth session check
  useEffect(() => {
    async function checkSession() {
      try {
        const { data } = await supabase.auth.getSession();
        setSessionUser(data.session?.user?.email || null);
      } catch {
        setSessionUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionUser(session?.user?.email || null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch all administrative data
  const fetchAllData = useCallback(async () => {
    if (!sessionUser) return;

    try {
      // 1. Fetch Orders
      const { data: ordersData } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      setOrders((ordersData as Order[]) || []);

      // 2. Fetch Service Requests
      const { data: srvData } = await supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setServiceRequests((srvData as ServiceRequest[]) || []);

      // 3. Fetch Tables
      const { data: tablesData } = await supabase
        .from("tables")
        .select("*")
        .order("number", { ascending: true });
      setTables((tablesData as RestaurantTable[]) || []);

      // 4. Fetch Categories
      const { data: catData } = await supabase
        .from("menu_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      setCategories((catData as MenuCategory[]) || []);

      // 5. Fetch Menu Items
      const { data: itemData } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });
      setMenuItems((itemData as MenuItem[]) || []);

      // 6. Fetch Settings
      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (settingsData) setSettings(settingsData as RestaurantSettings);
    } catch (err: unknown) {
      console.error("Failed to load admin data:", err);
    }
  }, [sessionUser]);

  useEffect(() => {
    if (sessionUser) {
      fetchAllData();
    }
  }, [sessionUser, fetchAllData]);

  // Realtime Subscriptions for Staff Orders & Service Requests
  useEffect(() => {
    if (!sessionUser) return;

    const channel = supabase
      .channel("admin-live-stream")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "orders" },
        (payload) => {
          playChime("order");
          setToastMessage(`🚨 New Order #${payload.new.order_number} received from Table ${payload.new.table_number}!`);
          setOrders((prev) => [payload.new as Order, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders" },
        (payload) => {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o))
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "service_requests" },
        (payload) => {
          playChime("service");
          setToastMessage(`🛎️ Service call from Table ${payload.new.table_number}: ${payload.new.type.toUpperCase()}`);
          setServiceRequests((prev) => [payload.new as ServiceRequest, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "service_requests" },
        (payload) => {
          setServiceRequests((prev) =>
            prev.map((s) => (s.id === payload.new.id ? (payload.new as ServiceRequest) : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionUser]);

  // Auth: Log In
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) return;

    try {
      setIsLoggingIn(true);
      setAuthError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      if (error) throw error;
      setSessionUser(data.user?.email || null);
      setToastMessage("Signed in successfully to Deccan Spice Admin.");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Authentication failed.";
      setAuthError(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Auth: Log Out
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSessionUser(null);
  };

  // Status transitions for orders
  const handleUpdateOrderStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from("orders")
        .update({ status: nextStatus, updated_at: new Date().toISOString() })
        .eq("id", orderId);

      if (error) throw error;

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: nextStatus } : o))
      );
      playChime("status");
      setToastMessage(`Order status changed to ${nextStatus.toUpperCase()}`);
    } catch (err: unknown) {
      alert(`Error updating order: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Resolve Service Request
  const handleResolveService = async (id: string) => {
    try {
      const { error } = await supabase
        .from("service_requests")
        .update({ status: "completed" })
        .eq("id", id);

      if (error) throw error;

      setServiceRequests((prev) =>
        prev.map((s) => (s.id === id ? { ...s, status: "completed" } : s))
      );
      setToastMessage("Service request marked as resolved.");
    } catch (err: unknown) {
      alert(`Error resolving request: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Toggle Table Active
  const handleToggleTableActive = async (table: RestaurantTable) => {
    try {
      const nextActive = !table.is_active;
      const { error } = await supabase
        .from("tables")
        .update({ is_active: nextActive })
        .eq("id", table.id);

      if (error) throw error;

      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, is_active: nextActive } : t))
      );
      setToastMessage(`Table ${table.number} ${nextActive ? "activated" : "deactivated"}.`);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Regenerate Table Token
  const handleRegenerateToken = async (table: RestaurantTable) => {
    if (!confirm(`Regenerate token for Table ${table.number}? Existing printed QR codes for this table will stop working.`)) {
      return;
    }

    try {
      const newToken = `tbl_tok_deccan_${table.number.toString().padStart(2, "0")}_${Math.random().toString(36).substring(2, 12)}`;
      const { error } = await supabase
        .from("tables")
        .update({ token: newToken })
        .eq("id", table.id);

      if (error) throw error;

      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, token: newToken } : t))
      );
      setToastMessage(`Token regenerated for Table ${table.number}.`);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Save / Update Table
  const handleSaveTable = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTable) {
        const { error } = await supabase
          .from("tables")
          .update({
            number: tableNumber,
            label: tableLabel.trim() || null,
            seats: tableSeats,
            section: tableSection,
          })
          .eq("id", editingTable.id);

        if (error) throw error;
        setToastMessage(`Table ${tableNumber} updated.`);
      } else {
        const randomHex = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        const newToken = `tbl_tok_deccan_${tableNumber.toString().padStart(2, "0")}_${randomHex}`;
        const { error } = await supabase.from("tables").insert({
          number: tableNumber,
          label: tableLabel.trim() || null,
          seats: tableSeats,
          section: tableSection,
          token: newToken,
          is_active: true,
        });

        if (error) throw error;
        setToastMessage(`Table ${tableNumber} created.`);
      }

      setTableModalOpen(false);
      setEditingTable(null);
      fetchAllData();
    } catch (err: unknown) {
      alert(`Error saving table: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Bulk Create Tables
  const handleBulkCreateTables = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkStart > bulkEnd) {
      alert("Start number must be less than or equal to end number.");
      return;
    }

    try {
      const newRows = [];
      for (let n = bulkStart; n <= bulkEnd; n++) {
        const randomHex = Math.random().toString(36).substring(2, 12) + Math.random().toString(36).substring(2, 12);
        newRows.push({
          number: n,
          label: `Table ${n}`,
          seats: bulkSeats,
          section: bulkSection,
          token: `tbl_tok_deccan_${n.toString().padStart(2, "0")}_${randomHex}`,
          is_active: true,
        });
      }

      const { error } = await supabase.from("tables").upsert(newRows, { onConflict: "number" });
      if (error) throw error;

      setBulkTableModalOpen(false);
      setToastMessage(`Bulk created ${newRows.length} tables (Table ${bulkStart} to ${bulkEnd}).`);
      fetchAllData();
    } catch (err: unknown) {
      alert(`Error bulk creating: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Toggle Menu Item Availability (1-Click 86)
  const handleToggleItemAvailability = async (item: MenuItem) => {
    try {
      const nextAvailable = !item.is_available;
      const { error } = await supabase
        .from("menu_items")
        .update({ is_available: nextAvailable })
        .eq("id", item.id);

      if (error) throw error;

      setMenuItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_available: nextAvailable } : i))
      );
      setToastMessage(`"${item.name}" marked as ${nextAvailable ? "Available" : "Sold Out (86'd)"}.`);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Image Upload to Supabase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const ext = file.name.split(".").pop();
      const fileName = `dish_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(fileName, file, { cacheControl: "3600", upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("menu-images").getPublicUrl(fileName);
      setItemImageUrl(data.publicUrl);
      setToastMessage("Image uploaded to Supabase Storage successfully.");
    } catch (err: unknown) {
      alert(`Storage upload error: ${err instanceof Error ? err.message : err}. You can also type an image URL.`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save / Update Menu Item
  const handleSaveMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemName || !itemCategoryId) return;

    try {
      const payload = {
        name: itemName.trim(),
        category_id: itemCategoryId,
        description: itemDesc.trim() || null,
        price: parseFloat(itemPrice) || 0,
        is_veg: itemIsVeg,
        spice_level: itemSpiceLevel,
        image_url: itemImageUrl.trim() || null,
        image_key: itemImageKey.trim() || null,
        is_available: editingItem ? editingItem.is_available : true,
      };

      if (editingItem) {
        const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
        if (error) throw error;
        setToastMessage(`Dish "${itemName}" updated.`);
      } else {
        const { error } = await supabase.from("menu_items").insert(payload);
        if (error) throw error;
        setToastMessage(`Dish "${itemName}" added to menu.`);
      }

      setItemModalOpen(false);
      setEditingItem(null);
      fetchAllData();
    } catch (err: unknown) {
      alert(`Error saving dish: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Delete Menu Item
  const handleDeleteMenuItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}" from menu?`)) return;
    try {
      const { error } = await supabase.from("menu_items").delete().eq("id", id);
      if (error) throw error;
      setMenuItems((prev) => prev.filter((i) => i.id !== id));
      setToastMessage(`"${name}" deleted.`);
    } catch (err: unknown) {
      alert(`Error: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Save Settings
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    try {
      const { error } = await supabase.from("settings").upsert({
        id: "restaurant_settings",
        restaurant_name: settings.restaurant_name,
        tax_rate: settings.tax_rate,
        currency: settings.currency,
        accepting_orders: settings.accepting_orders,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;
      setToastMessage("Restaurant settings saved.");
    } catch (err: unknown) {
      alert(`Error saving settings: ${err instanceof Error ? err.message : err}`);
    }
  };

  // Download Individual QR Code PNG
  const handleDownloadQRPng = (table: RestaurantTable) => {
    const svgElement = document.getElementById(`qr-svg-${table.id}`) as SVGElement | null;
    if (!svgElement) return;

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = 600;
      canvas.height = 600;
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 50, 50, 500, 500);
        const pngFile = canvas.toDataURL("image/png");
        const downloadLink = document.createElement("a");
        downloadLink.download = `Deccan_Spice_Table_${table.number}_QR.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      }
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (orderFilter === "active") {
        return ["placed", "accepted", "preparing", "ready"].includes(order.status);
      }
      if (orderFilter === "all") return true;
      return order.status === orderFilter;
    });
  }, [orders, orderFilter]);

  // Pending service calls count
  const pendingServiceCount = serviceRequests.filter((s) => s.status === "pending").length;
  const activeOrdersCount = orders.filter((o) =>
    ["placed", "accepted", "preparing", "ready"].includes(o.status)
  ).length;

  // Reports calculations
  const totalRevenue = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.total || 0), 0);
  const completedOrdersCount = orders.filter((o) => o.status === "completed" || o.status === "served").length;
  const avgOrderValue = completedOrdersCount > 0 ? totalRevenue / completedOrdersCount : 0;

  // 1. Loading Authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[#D9B780] border-t-transparent animate-spin" />
      </div>
    );
  }

  // 2. Unauthenticated Login Screen
  if (!sessionUser) {
    return (
      <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#12352B]/40 border border-[#D9B780]/40 p-8 shadow-2xl backdrop-blur-sm relative">
          <div className="text-center mb-6">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#12352B] border border-[#D9B780] flex items-center justify-center text-[#D9B780] font-serif font-bold text-lg mb-3">
              DS
            </div>
            <p className="text-[0.68rem] uppercase tracking-[0.22em] text-[#D9B780] font-semibold">
              Deccan Spice Pompano
            </p>
            <h1 className="font-display text-2xl md:text-3xl text-[#FFF9F1] mt-1">
              Staff & Kitchen Portal
            </h1>
            <p className="text-xs text-[#F7F2E9]/70 mt-1">
              Sign in to manage live dine-in orders, tables, and menu.
            </p>
          </div>

          {authError && (
            <div className="mb-4 bg-[#811C36]/30 border border-[#811C36] p-3 text-xs text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#D9B780]" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                Staff Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#D9B780]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  placeholder="admin@deccanspice.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full bg-[#12352B]/40 border border-[#D9B780]/30 pl-10 pr-3 py-2.5 text-xs text-[#FFF9F1] placeholder-[#F7F2E9]/40 focus:outline-none focus:border-[#D9B780]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#D9B780]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full bg-[#12352B]/40 border border-[#D9B780]/30 pl-10 pr-3 py-2.5 text-xs text-[#FFF9F1] placeholder-[#F7F2E9]/40 focus:outline-none focus:border-[#D9B780]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full py-3 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-[0.15em] font-medium transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoggingIn ? "Authenticating..." : "Sign In to Portal"}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#D9B780]/20 text-center">
            <a
              href="/"
              className="text-xs text-[#D9B780] hover:text-[#FFF9F1] tracking-wider uppercase transition-colors"
            >
              ← Return to Main Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authenticated Staff Portal
  return (
    <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex flex-col">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-[#12352B] text-[#FFF9F1] border border-[#D9B780] px-4 py-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
          <Sparkles className="w-4 h-4 text-[#D9B780] shrink-0" />
          <p className="text-xs leading-snug flex-1">{toastMessage}</p>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-[#D9B780]/70 hover:text-[#FFF9F1]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Admin Bar */}
      <header className="bg-[#12352B]/60 border-b border-[#D9B780]/30 px-4 py-3 sticky top-0 z-40 backdrop-blur-md">
        <div className="luxury-container flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#12352B] border border-[#D9B780] flex items-center justify-center text-[#D9B780] font-serif font-bold text-xs">
              DS
            </div>
            <div>
              <h1 className="font-display text-lg text-[#FFF9F1] leading-none">
                Deccan Spice Admin
              </h1>
              <span className="text-[0.65rem] text-[#D9B780] tracking-widest uppercase">
                Dine-In Management
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#F7F2E9]/70 bg-[#10110F]/60 px-3 py-1.5 border border-[#D9B780]/20">
              <User className="w-3.5 h-3.5 text-[#D9B780]" />
              <span className="truncate max-w-[180px]">{sessionUser}</span>
            </div>

            <button
              type="button"
              onClick={fetchAllData}
              className="p-2 border border-[#D9B780]/30 text-[#D9B780] hover:bg-[#12352B]"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="p-2 border border-[#811C36] text-rose-300 hover:bg-[#811C36]/30"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Admin Navigation Tabs */}
        <div className="luxury-container mt-3 flex items-center gap-1 overflow-x-auto no-scrollbar border-t border-[#D9B780]/15 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "orders"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen Orders</span>
            {activeOrdersCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] bg-[#811C36] text-[#FFF9F1] font-bold">
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("service")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "service"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Service Calls</span>
            {pendingServiceCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] bg-amber-500 text-black font-bold">
                {pendingServiceCount}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tables")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "tables"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Tables & QR Codes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "menu"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Menu Manager</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("website")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "website"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Website CMS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("media")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "media"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Media Library</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "reports"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Reports</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-3 py-2 text-xs tracking-wider uppercase font-medium flex items-center gap-2 border-b-2 transition-colors shrink-0 ${
              activeTab === "settings"
                ? "border-[#D9B780] text-[#D9B780] bg-[#12352B]/40"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <SettingsIcon className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="luxury-container flex-1 py-6">
        {/* ===================== TAB 1: KITCHEN ORDERS ===================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {/* Filter Bar */}
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D9B780]/20 pb-3">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                {[
                  { id: "active", label: "Active Orders" },
                  { id: "all", label: "All Orders" },
                  { id: "placed", label: "Placed" },
                  { id: "preparing", label: "Preparing" },
                  { id: "ready", label: "Ready" },
                  { id: "served", label: "Served" },
                  { id: "completed", label: "Completed" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    className={`px-3 py-1 text-xs uppercase tracking-wider font-medium border transition-colors shrink-0 ${
                      orderFilter === f.id
                        ? "bg-[#D9B780] text-[#10110F] border-[#D9B780]"
                        : "bg-[#12352B]/30 text-[#F7F2E9]/70 border-[#D9B780]/20"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span className="text-xs text-[#D9B780]">
                Showing {filteredOrders.length} orders
              </span>
            </div>

            {/* Orders Grid */}
            {filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-[#12352B]/20 border border-[#D9B780]/20 p-8">
                <ChefHat className="w-12 h-12 text-[#D9B780]/40 mx-auto mb-3" />
                <h3 className="font-display text-xl text-[#FFF9F1]">No Orders in This View</h3>
                <p className="text-xs text-[#F7F2E9]/70 mt-1">
                  Orders placed from tables will appear here live with audio chimes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`bg-[#12352B]/30 border p-4 space-y-3 flex flex-col justify-between transition-all ${
                      order.status === "placed"
                        ? "border-amber-500/80 shadow-lg shadow-amber-950/20"
                        : order.status === "ready"
                        ? "border-emerald-500/80"
                        : "border-[#D9B780]/30"
                    }`}
                  >
                    <div>
                      {/* Order Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#D9B780]/15 pb-2.5">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-display text-xl font-bold text-[#FFF9F1]">
                              Table {order.table_number}
                            </span>
                            <span className="px-2 py-0.5 text-[0.68rem] font-bold bg-[#12352B] border border-[#D9B780]/60 text-[#D9B780]">
                              #{order.order_number}
                            </span>
                          </div>
                          <span className="text-[0.68rem] text-[#F7F2E9]/60 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>

                        {/* Status badge */}
                        <span
                          className={`px-2 py-0.5 text-[0.68rem] uppercase font-bold tracking-wider border ${
                            order.status === "placed"
                              ? "bg-amber-950 text-amber-300 border-amber-600 animate-pulse"
                              : order.status === "preparing"
                              ? "bg-orange-950 text-orange-300 border-orange-600"
                              : order.status === "ready"
                              ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                              : order.status === "served"
                              ? "bg-teal-950 text-teal-300 border-teal-600"
                              : "bg-stone-900 text-stone-300 border-stone-700"
                          }`}
                        >
                          {order.status}
                        </span>
                      </div>

                      {/* Items */}
                      <div className="py-2.5 space-y-1.5 border-b border-[#D9B780]/15">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-start text-xs">
                            <div className="flex gap-2">
                              <span className="font-bold text-[#D9B780]">{it.quantity}×</span>
                              <span className="text-[#FFF9F1] font-medium">{it.name}</span>
                            </div>
                            <span className="text-[#F7F2E9]/70 tabular-nums">
                              ${Number(it.line_total).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer_note && (
                        <div className="mt-2 p-2 bg-amber-950/40 border border-amber-800/40 text-[0.72rem] text-amber-200">
                          <strong>Note:</strong> "{order.customer_note}"
                        </div>
                      )}
                    </div>

                    {/* Actions and Total */}
                    <div className="pt-2">
                      <div className="flex justify-between items-center text-xs text-[#D9B780] font-semibold mb-3">
                        <span>Total Bill</span>
                        <span className="text-base tabular-nums">${Number(order.total).toFixed(2)}</span>
                      </div>

                      {/* Stepper buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        {order.status === "placed" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "accepted")}
                            className="col-span-2 py-2 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780] text-xs uppercase tracking-wider font-semibold text-[#FFF9F1]"
                          >
                            Accept Order →
                          </button>
                        )}

                        {order.status === "accepted" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "preparing")}
                            className="col-span-2 py-2 bg-orange-900 hover:bg-orange-800 border border-[#D9B780] text-xs uppercase tracking-wider font-semibold text-[#FFF9F1]"
                          >
                            Start Preparing 👨‍🍳
                          </button>
                        )}

                        {order.status === "preparing" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "ready")}
                            className="col-span-2 py-2 bg-emerald-900 hover:bg-emerald-800 border border-emerald-400 text-xs uppercase tracking-wider font-semibold text-emerald-100"
                          >
                            Mark Ready to Serve 🍽️
                          </button>
                        )}

                        {order.status === "ready" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "served")}
                            className="col-span-2 py-2 bg-teal-900 hover:bg-teal-800 border border-teal-400 text-xs uppercase tracking-wider font-semibold text-teal-100"
                          >
                            Mark as Served ✓
                          </button>
                        )}

                        {order.status === "served" && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, "completed")}
                            className="col-span-2 py-2 bg-stone-800 hover:bg-stone-700 border border-stone-500 text-xs uppercase tracking-wider font-semibold text-stone-200"
                          >
                            Complete & Settle 💰
                          </button>
                        )}

                        {order.status !== "completed" && order.status !== "cancelled" && (
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Cancel order #${order.order_number}?`)) {
                                handleUpdateOrderStatus(order.id, "cancelled");
                              }
                            }}
                            className="col-span-2 py-1 text-[0.68rem] text-rose-400 hover:underline tracking-wider uppercase"
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: SERVICE CALLS ===================== */}
        {activeTab === "service" && (
          <div className="space-y-4">
            <div className="border-b border-[#D9B780]/20 pb-3 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl text-[#D9B780]">Table Assistance Requests</h2>
                <p className="text-xs text-[#F7F2E9]/70">
                  Waiter call notifications, bill requests, and water refills.
                </p>
              </div>
              <span className="text-xs text-amber-300 font-semibold">
                {pendingServiceCount} Pending Calls
              </span>
            </div>

            {serviceRequests.length === 0 ? (
              <div className="text-center py-20 bg-[#12352B]/20 border border-[#D9B780]/20 p-8">
                <Bell className="w-12 h-12 text-[#D9B780]/40 mx-auto mb-3" />
                <h3 className="font-display text-xl text-[#FFF9F1]">All Tables Attended</h3>
                <p className="text-xs text-[#F7F2E9]/70 mt-1">No pending service calls at this moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {serviceRequests.map((srv) => (
                  <div
                    key={srv.id}
                    className={`bg-[#12352B]/30 border p-4 flex items-center justify-between gap-3 ${
                      srv.status === "pending"
                        ? "border-amber-500 bg-amber-950/20"
                        : "border-[#D9B780]/20 opacity-60"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold text-[#FFF9F1]">
                          Table {srv.table_number}
                        </span>
                        <span className="px-2 py-0.5 text-[0.68rem] uppercase font-bold tracking-wider bg-[#12352B] border border-[#D9B780]/50 text-[#D9B780]">
                          {srv.type.replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-[0.68rem] text-[#F7F2E9]/60 mt-1">
                        {new Date(srv.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    </div>

                    {srv.status === "pending" ? (
                      <button
                        type="button"
                        onClick={() => handleResolveService(srv.id)}
                        className="px-3 py-1.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-semibold"
                      >
                        Resolve ✓
                      </button>
                    ) : (
                      <span className="text-xs text-emerald-400 font-medium">Resolved</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 3: TABLES & QR CODES ===================== */}
        {activeTab === "tables" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D9B780]/20 pb-3">
              <div>
                <h2 className="font-display text-xl text-[#D9B780]">Tables & QR Code Generator</h2>
                <p className="text-xs text-[#F7F2E9]/70">
                  Manage dining tables, regenerate tokens, and export high-res QR codes.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPrintModalOpen(true)}
                  className="px-3 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4 text-[#D9B780]" />
                  <span>Print All Cards (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setBulkTableModalOpen(true)}
                  className="px-3 py-2 bg-[#12352B] hover:bg-[#12352B]/80 border border-[#D9B780]/50 text-xs uppercase tracking-wider text-[#D9B780] font-semibold"
                >
                  Bulk Create
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingTable(null);
                    setTableNumber((tables.length > 0 ? Math.max(...tables.map((t) => t.number)) : 0) + 1);
                    setTableLabel("");
                    setTableSeats(4);
                    setTableSection("Main Dining");
                    setTableModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#12352B] hover:bg-[#12352B]/80 border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#D9B780]" /> Add Table
                </button>
              </div>
            </div>

            {/* Table Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map((tbl) => {
                const orderUrl = `${siteUrl}/order?t=${tbl.token}`;

                return (
                  <div
                    key={tbl.id}
                    className={`bg-[#12352B]/25 border p-4 flex flex-col justify-between transition-colors ${
                      tbl.is_active ? "border-[#D9B780]/30" : "border-stone-800 opacity-60"
                    }`}
                  >
                    <div>
                      {/* Table Header */}
                      <div className="flex items-start justify-between gap-2 border-b border-[#D9B780]/15 pb-2">
                        <div>
                          <h3 className="font-display text-xl text-[#FFF9F1] font-semibold">
                            Table {tbl.number}
                          </h3>
                          <p className="text-[0.68rem] text-[#D9B780]">
                            {tbl.section} • {tbl.seats} Seats {tbl.label ? `(${tbl.label})` : ""}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleToggleTableActive(tbl)}
                          className={`px-2 py-0.5 text-[0.65rem] uppercase font-bold tracking-wider border ${
                            tbl.is_active
                              ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                              : "bg-rose-950 text-rose-300 border-rose-600"
                          }`}
                        >
                          {tbl.is_active ? "Active" : "Inactive"}
                        </button>
                      </div>

                      {/* QR Display */}
                      <div className="py-4 flex flex-col items-center">
                        <div className="p-3 bg-white border border-[#D9B780] shadow-md">
                          <QRCodeSVG
                            id={`qr-svg-${tbl.id}`}
                            value={orderUrl}
                            size={140}
                            level="M"
                            includeMargin={false}
                            fgColor="#10110F"
                            bgColor="#FFFFFF"
                          />
                        </div>
                        <a
                          href={orderUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[0.65rem] text-[#D9B780] hover:underline font-mono mt-2 break-all text-center max-w-xs"
                        >
                          {orderUrl}
                        </a>
                      </div>
                    </div>

                    {/* Table Actions */}
                    <div className="border-t border-[#D9B780]/15 pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadQRPng(tbl)}
                          className="py-1.5 px-2 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/40 text-[0.68rem] uppercase tracking-wider text-[#FFF9F1] flex items-center justify-center gap-1"
                        >
                          <Download className="w-3 h-3 text-[#D9B780]" /> PNG
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(orderUrl);
                            setToastMessage(`Copied order URL for Table ${tbl.number}!`);
                          }}
                          className="py-1.5 px-2 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/40 text-[0.68rem] uppercase tracking-wider text-[#FFF9F1]"
                        >
                          Copy Link
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1 text-[0.68rem]">
                        <button
                          type="button"
                          onClick={() => handleRegenerateToken(tbl)}
                          className="text-amber-400 hover:underline"
                        >
                          Regenerate Token
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTable(tbl);
                            setTableNumber(tbl.number);
                            setTableLabel(tbl.label || "");
                            setTableSeats(tbl.seats);
                            setTableSection(tbl.section);
                            setTableModalOpen(true);
                          }}
                          className="text-[#D9B780] hover:underline"
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: MENU MANAGER ===================== */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-[#D9B780]/20 pb-3">
              <div>
                <h2 className="font-display text-xl text-[#D9B780]">Menu & Catalog Manager</h2>
                <p className="text-xs text-[#F7F2E9]/70">
                  Update dish details, prices, images, and toggle sold-out availability instantly.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryName("");
                    setCategorySlug("");
                    setCategoryModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#12352B] hover:bg-[#12352B]/80 border border-[#D9B780]/50 text-xs uppercase tracking-wider text-[#D9B780]"
                >
                  + Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    setItemName("");
                    setItemDesc("");
                    setItemPrice("18.99");
                    setItemCategoryId(categories[0]?.id || "");
                    setItemIsVeg(false);
                    setItemSpiceLevel(0);
                    setItemImageUrl("");
                    setItemImageKey("");
                    setItemModalOpen(true);
                  }}
                  className="px-3 py-2 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-semibold flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4 text-[#D9B780]" /> Add Menu Item
                </button>
              </div>
            </div>

            {/* Menu Items Table / List */}
            <div className="space-y-6">
              {categories.map((cat) => {
                const catItems = menuItems.filter((i) => i.category_id === cat.id);

                return (
                  <div key={cat.id} className="bg-[#12352B]/20 border border-[#D9B780]/20 p-4">
                    <div className="flex items-center justify-between border-b border-[#D9B780]/15 pb-2 mb-3">
                      <h3 className="font-display text-lg text-[#D9B780] font-semibold">
                        {cat.name} ({catItems.length})
                      </h3>
                      <span className="text-[0.68rem] text-[#F7F2E9]/60 font-mono">
                        slug: {cat.slug}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catItems.map((item) => (
                        <div
                          key={item.id}
                          className={`bg-[#10110F]/70 border p-3 flex flex-col justify-between transition-colors ${
                            item.is_available ? "border-[#D9B780]/20" : "border-rose-900/60 opacity-60"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={`w-2.5 h-2.5 border flex items-center justify-center ${
                                    item.is_veg ? "border-emerald-500" : "border-rose-500"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      item.is_veg ? "bg-emerald-500" : "bg-rose-500"
                                    }`}
                                  />
                                </span>
                                <h4 className="font-display text-base text-[#FFF9F1] font-medium leading-tight">
                                  {item.name}
                                </h4>
                              </div>
                              <span className="text-[#D9B780] font-semibold text-sm tabular-nums">
                                ${Number(item.price).toFixed(2)}
                              </span>
                            </div>

                            {item.description && (
                              <p className="text-[0.7rem] text-[#F7F2E9]/70 line-clamp-2 leading-relaxed mb-2">
                                {item.description}
                              </p>
                            )}
                          </div>

                          {/* Quick availability toggle and edit */}
                          <div className="flex items-center justify-between border-t border-[#D9B780]/15 pt-2 text-xs">
                            <button
                              type="button"
                              onClick={() => handleToggleItemAvailability(item)}
                              className={`px-2 py-0.5 text-[0.68rem] uppercase font-bold tracking-wider border ${
                                item.is_available
                                  ? "bg-emerald-950 text-emerald-300 border-emerald-600"
                                  : "bg-rose-950 text-rose-300 border-rose-600"
                              }`}
                            >
                              {item.is_available ? "In Stock" : "86'd / Sold Out"}
                            </button>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingItem(item);
                                  setItemName(item.name);
                                  setItemDesc(item.description || "");
                                  setItemPrice(item.price.toString());
                                  setItemCategoryId(item.category_id);
                                  setItemIsVeg(item.is_veg);
                                  setItemSpiceLevel(item.spice_level);
                                  setItemImageUrl(item.image_url || "");
                                  setItemImageKey((item as any).image_key || "");
                                  setItemModalOpen(true);
                                }}
                                className="text-[#D9B780] hover:text-[#FFF9F1] p-1"
                                title="Edit dish"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteMenuItem(item.id, item.name)}
                                className="text-rose-400 hover:text-rose-300 p-1"
                                title="Delete dish"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ===================== TAB 5: REPORTS & ANALYTICS ===================== */}
        {activeTab === "reports" && (
          <div className="space-y-6">
            <div className="border-b border-[#D9B780]/20 pb-3">
              <h2 className="font-display text-xl text-[#D9B780]">Dine-In Sales & Analytics</h2>
              <p className="text-xs text-[#F7F2E9]/70">
                Key performance metrics and revenue from digital QR orders.
              </p>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#12352B]/30 border border-[#D9B780]/30 p-4">
                <span className="text-[0.68rem] uppercase tracking-widest text-[#D9B780] font-semibold">
                  Total QR Sales
                </span>
                <p className="font-display text-3xl text-[#FFF9F1] font-bold mt-1 tabular-nums">
                  ${totalRevenue.toFixed(2)}
                </p>
                <p className="text-[0.68rem] text-[#F7F2E9]/60 mt-1">Across all recorded orders</p>
              </div>

              <div className="bg-[#12352B]/30 border border-[#D9B780]/30 p-4">
                <span className="text-[0.68rem] uppercase tracking-widest text-[#D9B780] font-semibold">
                  Orders Placed
                </span>
                <p className="font-display text-3xl text-[#FFF9F1] font-bold mt-1 tabular-nums">
                  {orders.length}
                </p>
                <p className="text-[0.68rem] text-[#F7F2E9]/60 mt-1">{completedOrdersCount} served or completed</p>
              </div>

              <div className="bg-[#12352B]/30 border border-[#D9B780]/30 p-4">
                <span className="text-[0.68rem] uppercase tracking-widest text-[#D9B780] font-semibold">
                  Average Ticket Size
                </span>
                <p className="font-display text-3xl text-[#FFF9F1] font-bold mt-1 tabular-nums">
                  ${avgOrderValue.toFixed(2)}
                </p>
                <p className="text-[0.68rem] text-[#F7F2E9]/60 mt-1">Per dining table session</p>
              </div>

              <div className="bg-[#12352B]/30 border border-[#D9B780]/30 p-4">
                <span className="text-[0.68rem] uppercase tracking-widest text-[#D9B780] font-semibold">
                  Active Dining Tables
                </span>
                <p className="font-display text-3xl text-[#FFF9F1] font-bold mt-1 tabular-nums">
                  {tables.filter((t) => t.is_active).length} / {tables.length}
                </p>
                <p className="text-[0.68rem] text-[#F7F2E9]/60 mt-1">Available for QR scanning</p>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB 6: SETTINGS ===================== */}
        {activeTab === "settings" && settings && (
          <div className="max-w-2xl bg-[#12352B]/25 border border-[#D9B780]/30 p-6 space-y-5">
            <div className="border-b border-[#D9B780]/20 pb-3">
              <h2 className="font-display text-xl text-[#D9B780]">Dine-In System Settings</h2>
              <p className="text-xs text-[#F7F2E9]/70">
                Configure sales tax, currency, and emergency ordering pause.
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                  Restaurant Display Name
                </label>
                <input
                  type="text"
                  value={settings.restaurant_name}
                  onChange={(e) => setSettings({ ...settings, restaurant_name: e.target.value })}
                  className="w-full bg-[#10110F] border border-[#D9B780]/30 p-2.5 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Sales Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={settings.tax_rate}
                    onChange={(e) => setSettings({ ...settings, tax_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 p-2.5 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                  <span className="text-[0.68rem] text-[#F7F2E9]/50 mt-1 block">
                    (Standard Broward County / FL rate is 7.00%)
                  </span>
                </div>

                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                    Currency Symbol
                  </label>
                  <input
                    type="text"
                    value={settings.currency}
                    onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                    className="w-full bg-[#10110F] border border-[#D9B780]/30 p-2.5 text-xs text-[#FFF9F1] focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
              </div>

              {/* Master Ordering Kill-Switch */}
              <div className="bg-[#10110F] border border-[#D9B780]/30 p-4 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-[#FFF9F1] block">
                    Accepting Dine-In Orders
                  </span>
                  <p className="text-[0.7rem] text-[#F7F2E9]/60 mt-0.5">
                    Toggle off to instantly pause all incoming digital orders (e.g. during kitchen rush or at closing).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, accepting_orders: !settings.accepting_orders })}
                  className={`px-4 py-2 text-xs uppercase font-bold tracking-wider border transition-colors ${
                    settings.accepting_orders
                      ? "bg-emerald-950 text-emerald-300 border-emerald-500"
                      : "bg-rose-950 text-rose-300 border-rose-500"
                  }`}
                >
                  {settings.accepting_orders ? "Orders Active" : "Orders Paused"}
                </button>
              </div>

              <button
                type="submit"
                className="py-2.5 px-6 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-widest text-[#FFF9F1] font-semibold"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

        {/* ===================== TAB: WEBSITE CMS ===================== */}
        {activeTab === "website" && <AdminCmsSection />}

        {/* ===================== TAB: MEDIA LIBRARY ===================== */}
        {activeTab === "media" && <MediaLibrary />}
      </main>

      {/* Printable Sheet View Modal */}
      {printModalOpen && (
        <PrintableQRCards
          tables={tables.filter((t) => t.is_active)}
          baseUrl={siteUrl}
          onClose={() => setPrintModalOpen(false)}
        />
      )}

      {/* Add / Edit Table Modal */}
      {tableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#10110F] border border-[#D9B780] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3 mb-4">
              <h3 className="font-display text-xl text-[#FFF9F1]">
                {editingTable ? `Edit Table ${editingTable.number}` : "Add New Table"}
              </h3>
              <button
                type="button"
                onClick={() => setTableModalOpen(false)}
                className="text-[#F7F2E9]/50 hover:text-[#FFF9F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-4 text-xs">
              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Table Number
                </label>
                <input
                  type="number"
                  required
                  value={tableNumber}
                  onChange={(e) => setTableNumber(parseInt(e.target.value) || 1)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Label (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Window Booth, Patio Terrace"
                  value={tableLabel}
                  onChange={(e) => setTableLabel(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">Seats</label>
                  <input
                    type="number"
                    value={tableSeats}
                    onChange={(e) => setTableSeats(parseInt(e.target.value) || 4)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  />
                </div>
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={tableSection}
                    onChange={(e) => setTableSection(e.target.value)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Main Dining Booths">Main Dining Booths</option>
                    <option value="Patio Terrace">Patio Terrace</option>
                    <option value="Bar & Cocktail Lounge">Bar & Cocktail Lounge</option>
                    <option value="Royal Private Dining">Royal Private Dining</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setTableModalOpen(false)}
                  className="px-4 py-2 border border-[#D9B780]/30 text-[#F7F2E9]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#811C36] border border-[#D9B780] text-[#FFF9F1] font-semibold uppercase tracking-wider"
                >
                  Save Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Create Table Modal */}
      {bulkTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-w-md w-full bg-[#10110F] border border-[#D9B780] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3 mb-4">
              <h3 className="font-display text-xl text-[#FFF9F1]">Bulk Create Dining Tables</h3>
              <button
                type="button"
                onClick={() => setBulkTableModalOpen(false)}
                className="text-[#F7F2E9]/50 hover:text-[#FFF9F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBulkCreateTables} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Start Table #
                  </label>
                  <input
                    type="number"
                    value={bulkStart}
                    onChange={(e) => setBulkStart(parseInt(e.target.value) || 1)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  />
                </div>
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    End Table #
                  </label>
                  <input
                    type="number"
                    value={bulkEnd}
                    onChange={(e) => setBulkEnd(parseInt(e.target.value) || 10)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Seats per Table
                  </label>
                  <input
                    type="number"
                    value={bulkSeats}
                    onChange={(e) => setBulkSeats(parseInt(e.target.value) || 4)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  />
                </div>
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Section
                  </label>
                  <select
                    value={bulkSection}
                    onChange={(e) => setBulkSection(e.target.value)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  >
                    <option value="Main Dining">Main Dining</option>
                    <option value="Main Dining Booths">Main Dining Booths</option>
                    <option value="Patio Terrace">Patio Terrace</option>
                    <option value="Bar & Cocktail Lounge">Bar & Cocktail Lounge</option>
                    <option value="Royal Private Dining">Royal Private Dining</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setBulkTableModalOpen(false)}
                  className="px-4 py-2 border border-[#D9B780]/30 text-[#F7F2E9]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#811C36] border border-[#D9B780] text-[#FFF9F1] font-semibold uppercase tracking-wider"
                >
                  Generate Tables
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Menu Item Modal */}
      {itemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="max-w-lg w-full bg-[#10110F] border border-[#D9B780] p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3 mb-4">
              <h3 className="font-display text-xl text-[#FFF9F1]">
                {editingItem ? `Edit ${editingItem.name}` : "Add Menu Item"}
              </h3>
              <button
                type="button"
                onClick={() => setItemModalOpen(false)}
                className="text-[#F7F2E9]/50 hover:text-[#FFF9F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMenuItem} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  required
                  value={itemCategoryId}
                  onChange={(e) => setItemCategoryId(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Dish Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Hyderabadi Dum Biryani"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation, accompaniments..."
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Price ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  />
                </div>

                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">Diet</label>
                  <select
                    value={itemIsVeg ? "veg" : "non-veg"}
                    onChange={(e) => setItemIsVeg(e.target.value === "veg")}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  >
                    <option value="non-veg">Non-Veg 🔴</option>
                    <option value="veg">Vegetarian 🟢</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                    Spice (0-3)
                  </label>
                  <select
                    value={itemSpiceLevel}
                    onChange={(e) => setItemSpiceLevel(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                  >
                    <option value={0}>0 (Mild)</option>
                    <option value={1}>1 (Medium)</option>
                    <option value={2}>2 (Hot 🌶️)</option>
                    <option value={3}>3 (Extra Hot 🌶️🌶️)</option>
                  </select>
                </div>
              </div>

              {/* Image Input via ImageUploader (Cloudflare R2 + WebP) */}
              <div>
                <ImageUploader
                  label="Dish Image"
                  recommendedSize="1200x900 (Compressed WebP stored on Cloudflare R2)"
                  folder="menu"
                  value={itemImageUrl}
                  imageKey={itemImageKey}
                  onChange={(url, key) => {
                    setItemImageUrl(url);
                    setItemImageKey(key || "");
                  }}
                  onRemove={() => {
                    setItemImageUrl("");
                    setItemImageKey("");
                  }}
                />
              </div>

              <div className="pt-3 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setItemModalOpen(false)}
                  className="px-4 py-2 border border-[#D9B780]/30 text-[#F7F2E9]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#811C36] border border-[#D9B780] text-[#FFF9F1] font-semibold uppercase tracking-wider"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {categoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="max-w-sm w-full bg-[#10110F] border border-[#D9B780] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3 mb-4">
              <h3 className="font-display text-xl text-[#FFF9F1]">New Category</h3>
              <button
                type="button"
                onClick={() => setCategoryModalOpen(false)}
                className="text-[#F7F2E9]/50 hover:text-[#FFF9F1]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!categoryName) return;
                const slug =
                  categorySlug.trim() || categoryName.toLowerCase().replace(/[^a-z0-9]/g, "-");
                try {
                  const { error } = await supabase.from("menu_categories").insert({
                    name: categoryName.trim(),
                    slug,
                    sort_order: categories.length + 1,
                    is_active: true,
                  });
                  if (error) throw error;
                  setCategoryModalOpen(false);
                  setToastMessage(`Category "${categoryName}" added.`);
                  fetchAllData();
                } catch (err: unknown) {
                  alert(`Error: ${err instanceof Error ? err.message : err}`);
                }
              }}
              className="space-y-3.5 text-xs"
            >
              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Seafood Delicacies"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div>
                <label className="block text-[#D9B780] uppercase tracking-wider mb-1">
                  Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. seafood-delicacies"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 p-2.5 text-[#FFF9F1]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCategoryModalOpen(false)}
                  className="px-4 py-2 border border-[#D9B780]/30 text-[#F7F2E9]/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#811C36] border border-[#D9B780] text-[#FFF9F1] font-semibold uppercase tracking-wider"
                >
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
