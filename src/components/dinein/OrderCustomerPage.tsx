import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChefHat,
  Clock,
  Droplet,
  Flame,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  Sparkles,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import {
  isSupabaseConfigured,
  supabase,
  type MenuCategory,
  type MenuItem,
  type Order,
  type RestaurantSettings,
  type RestaurantTable,
  type ServiceRequest,
} from "../../lib/supabase";
import { playChime } from "./audio";
import { useNoIndex } from "./useNoIndex";

interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  notes: string;
}

export function OrderCustomerPage() {
  useNoIndex();

  // URL token parsing
  const urlParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const token = urlParams.get("t")?.trim() || "";

  // State
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [settings, setSettings] = useState<RestaurantSettings | null>(null);

  // Cart & Order state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderNotes, setOrderNotes] = useState("");
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"menu" | "orders">("menu");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");

  // Orders & Service Requests
  const [tableOrders, setTableOrders] = useState<Order[]>([]);
  const [serviceRequests, setServiceRequests] = useState<ServiceRequest[]>([]);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [pendingServiceType, setPendingServiceType] = useState<"call_waiter" | "request_bill" | "water" | null>(null);
  const [isCallingService, setIsCallingService] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Toast auto-clear
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 4500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Load Table & Menu
  const loadInitialData = useCallback(async () => {
    if (!token) {
      setErrorMsg("No table token provided. Please scan the QR code located on your dining table.");
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setErrorMsg("Supabase configuration is required. Please set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setErrorMsg(null);

      // 1. Validate Table Token via RPC
      const { data: tableData, error: tableError } = await supabase.rpc("get_table_by_token", {
        p_token: token,
      });

      if (tableError || !tableData) {
        setErrorMsg("This table QR code is invalid, inactive, or has expired. Please ask your server for assistance.");
        setLoading(false);
        return;
      }

      setTable(tableData as RestaurantTable);

      // 2. Fetch Active Menu Categories
      const { data: catData } = await supabase
        .from("menu_categories")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      setCategories(catData || []);

      // 3. Fetch Menu Items
      const { data: itemData } = await supabase
        .from("menu_items")
        .select("*")
        .order("sort_order", { ascending: true });

      setMenuItems((itemData as MenuItem[]) || []);

      // 4. Fetch Settings
      const { data: settingsData } = await supabase
        .from("settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (settingsData) {
        setSettings(settingsData as RestaurantSettings);
      }

      // 5. Fetch Existing Table Orders
      const { data: ordersData } = await supabase.rpc("get_table_orders", {
        p_table_token: token,
      });
      setTableOrders((ordersData as Order[]) || []);

      // 6. Fetch Existing Service Requests
      const { data: serviceData } = await supabase.rpc("get_table_service_requests", {
        p_table_token: token,
      });
      setServiceRequests((serviceData as ServiceRequest[]) || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load table session.";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Periodic polling fallback (every 5 seconds) to ensure real-time status updates
  useEffect(() => {
    if (!token || !table) return;

    const interval = setInterval(async () => {
      try {
        const { data: ordersData } = await supabase.rpc("get_table_orders", {
          p_table_token: token,
        });
        if (ordersData) {
          setTableOrders((prev) => {
            // Check if status changed to trigger audio notification
            const newOrders = ordersData as Order[];
            if (prev.length > 0 && newOrders.length > 0) {
              const latestPrev = prev[0];
              const latestNew = newOrders.find((o) => o.id === latestPrev.id);
              if (latestNew && latestNew.status !== latestPrev.status) {
                playChime("status");
                setToastMessage(`Order #${latestNew.order_number} status updated to: ${latestNew.status.toUpperCase()}`);
              }
            }
            return newOrders;
          });
        }

        const { data: srvData } = await supabase.rpc("get_table_service_requests", {
          p_table_token: token,
        });
        if (srvData) {
          setServiceRequests(srvData as ServiceRequest[]);
        }
      } catch {
        // Silent poll error
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [token, table]);

  // Supabase Realtime Subscription for Orders & Service Requests
  useEffect(() => {
    if (!table || !isSupabaseConfigured) return;

    const channel = supabase
      .channel(`table-${table.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `table_id=eq.${table.id}`,
        },
        async () => {
          const { data } = await supabase.rpc("get_table_orders", {
            p_table_token: token,
          });
          if (data) {
            setTableOrders(data as Order[]);
            playChime("status");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `table_id=eq.${table.id}`,
        },
        async () => {
          const { data } = await supabase.rpc("get_table_service_requests", {
            p_table_token: token,
          });
          if (data) {
            setServiceRequests(data as ServiceRequest[]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, token]);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    if (!item.is_available) return;

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.menuItem.id === item.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { menuItem: item, quantity: 1, notes: "" }];
    });
    playChime("success");
    setToastMessage(`Added "${item.name}" to your bag.`);
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((entry) =>
          entry.menuItem.id === itemId
            ? { ...entry, quantity: entry.quantity + delta }
            : entry
        )
        .filter((entry) => entry.quantity > 0)
    );
  };

  const handleUpdateItemNote = (itemId: string, note: string) => {
    setCart((prev) =>
      prev.map((entry) =>
        entry.menuItem.id === itemId ? { ...entry, notes: note } : entry
      )
    );
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((entry) => entry.menuItem.id !== itemId));
  };

  // Calculations
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.menuItem.price * item.quantity, 0);
  const taxRate = settings?.tax_rate ?? 7.0;
  const tax = Number((subtotal * (taxRate / 100)).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (selectedCategory !== "all" && item.category_id !== selectedCategory) {
        return false;
      }
      if (dietFilter === "veg" && !item.is_veg) return false;
      if (dietFilter === "non-veg" && item.is_veg) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [menuItems, selectedCategory, dietFilter, searchQuery]);

  // Place Order RPC
  const handlePlaceOrder = async () => {
    if (cart.length === 0 || !token) return;

    if (settings && !settings.accepting_orders) {
      alert("The kitchen is currently not accepting new orders. Please ask your server.");
      return;
    }

    try {
      setIsPlacingOrder(true);
      const itemsPayload = cart.map((c) => ({
        item_id: c.menuItem.id,
        quantity: c.quantity,
        notes: c.notes?.trim() || null,
      }));

      const { data, error } = await supabase.rpc("place_order", {
        p_table_token: token,
        p_items: itemsPayload,
        p_customer_note: orderNotes?.trim() || null,
      });

      if (error) {
        throw new Error(error.message);
      }

      // Success
      setCart([]);
      setOrderNotes("");
      setCartDrawerOpen(false);
      setActiveTab("orders");
      playChime("order");
      setToastMessage(`Order placed successfully! Kitchen received #${data?.order_number || "Order"}.`);

      // Refresh orders
      const { data: updatedOrders } = await supabase.rpc("get_table_orders", {
        p_table_token: token,
      });
      if (updatedOrders) {
        setTableOrders(updatedOrders as Order[]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to place order.";
      alert(`Error: ${msg}`);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Service Request RPC (Call Waiter / Request Bill / Water)
  const handleRequestService = async (type: "call_waiter" | "request_bill" | "water") => {
    if (!token) return;
    try {
      setIsCallingService(true);
      const { error } = await supabase.rpc("create_service_request", {
        p_table_token: token,
        p_type: type,
      });

      if (error) throw new Error(error.message);

      playChime("service");
      const label =
        type === "call_waiter"
          ? "Server notified"
          : type === "request_bill"
          ? "Bill requested"
          : "Water refill requested";
      setToastMessage(`${label}. A staff member is on their way to Table ${table?.number}!`);
      setServiceModalOpen(false);

      // Refresh service list
      const { data: srvData } = await supabase.rpc("get_table_service_requests", {
        p_table_token: token,
      });
      if (srvData) setServiceRequests(srvData as ServiceRequest[]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not complete request.";
      alert(`Error: ${msg}`);
    } finally {
      setIsCallingService(false);
    }
  };

  // Helper for Spice Icons
  const renderSpice = (level: number) => {
    if (level <= 0) return null;
    return (
      <span className="inline-flex items-center gap-0.5 text-[#E5C378] text-[0.7rem] ml-1.5" title={`Spice Level: ${level}/3`}>
        {Array.from({ length: level }).map((_, i) => (
          <Flame key={i} className="w-3 h-3 text-[#D9B780] fill-[#D9B780]" />
        ))}
      </span>
    );
  };

  // Status Badge Formatter
  const renderStatusBadge = (status: Order["status"]) => {
    const config = {
      placed: { text: "Order Placed", bg: "bg-amber-950/60 text-amber-300 border-amber-700/50" },
      accepted: { text: "Accepted", bg: "bg-blue-950/60 text-blue-300 border-blue-700/50" },
      preparing: { text: "Chef Preparing", bg: "bg-orange-950/60 text-orange-300 border-orange-700/50" },
      ready: { text: "Ready to Serve", bg: "bg-emerald-950/60 text-emerald-300 border-emerald-700/50" },
      served: { text: "Served", bg: "bg-teal-950/60 text-teal-300 border-teal-700/50" },
      completed: { text: "Completed", bg: "bg-stone-800 text-stone-300 border-stone-600/50" },
      cancelled: { text: "Cancelled", bg: "bg-rose-950/60 text-rose-300 border-rose-700/50" },
    }[status] || { text: status, bg: "bg-stone-800 text-stone-300 border-stone-700" };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 text-[0.72rem] tracking-wider uppercase font-medium border ${config.bg}`}>
        {config.text}
      </span>
    );
  };

  // Progress Stepper for Live Order
  const getProgressStep = (status: Order["status"]) => {
    switch (status) {
      case "placed":
        return 1;
      case "accepted":
        return 2;
      case "preparing":
        return 3;
      case "ready":
        return 4;
      case "served":
      case "completed":
        return 5;
      default:
        return 0;
    }
  };

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 rounded-full border border-[#D9B780]/30 border-t-[#D9B780] animate-spin" />
          <Utensils className="w-6 h-6 text-[#D9B780] absolute inset-0 m-auto" />
        </div>
        <h2 className="font-display text-2xl text-[#D9B780] mb-2">Connecting to Table</h2>
        <p className="text-[#F7F2E9]/70 text-sm max-w-xs">
          Loading your dining menu and table session...
        </p>
      </div>
    );
  }

  // 2. Error / Invalid Token State
  if (errorMsg || !table) {
    return (
      <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#12352B]/40 border border-[#D9B780]/30 p-8 text-center relative shadow-2xl backdrop-blur-sm">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#811C36]/30 border border-[#811C36] flex items-center justify-center text-[#D9B780]">
            <AlertCircle className="w-7 h-7 text-[#D9B780]" />
          </div>
          <p className="text-[0.7rem] uppercase tracking-[0.2em] text-[#D9B780] mb-1 font-semibold">
            Deccan Spice Pompano
          </p>
          <h1 className="font-display text-2xl md:text-3xl text-[#FFF9F1] mb-3">
            Table Code Required
          </h1>
          <p className="text-[#F7F2E9]/80 text-sm leading-relaxed mb-6">
            {errorMsg || "We could not locate an active table for this link. Please scan the QR code placed on your dining table."}
          </p>
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/60 text-[#FFF9F1] text-xs uppercase tracking-[0.15em] font-medium transition-colors"
            >
              Retry Connection
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center gap-2 w-full py-2.5 text-[#D9B780] hover:text-[#FFF9F1] text-xs uppercase tracking-[0.12em] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Return to Website
            </a>
          </div>
        </div>
      </div>
    );
  }

  // 3. Active Customer Ordering Interface
  return (
    <div className="min-h-screen bg-[#10110F] text-[#FFF9F1] flex flex-col pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] bg-[#12352B] text-[#FFF9F1] border border-[#D9B780] px-4 py-3 shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
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

      {/* Top Dining Header */}
      <header className="sticky top-0 z-40 bg-[#10110F]/95 backdrop-blur-md border-b border-[#D9B780]/20 px-4 py-3">
        <div className="luxury-container flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#12352B] border border-[#D9B780]/60 flex items-center justify-center text-[#D9B780] font-serif font-bold text-sm">
              DS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-lg text-[#FFF9F1] leading-none">
                  Table {table.number}
                </span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[0.62rem] font-medium bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1 animate-pulse" />
                  Dine-In
                </span>
              </div>
              <p className="text-[0.68rem] text-[#D9B780] tracking-wide">
                {table.section} {table.label ? `• ${table.label}` : ""}
              </p>
            </div>
          </div>

          {/* Quick Service Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setPendingServiceType("call_waiter");
                setServiceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#12352B]/80 hover:bg-[#12352B] border border-[#D9B780]/40 text-[#D9B780] text-[0.7rem] uppercase tracking-wider font-medium transition-colors"
              title="Call your waiter"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Call Waiter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPendingServiceType("request_bill");
                setServiceModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-[#811C36]/80 hover:bg-[#811C36] border border-[#D9B780]/40 text-[#FFF9F1] text-[0.7rem] uppercase tracking-wider font-medium transition-colors"
              title="Request your check"
            >
              <Receipt className="w-3.5 h-3.5 text-[#D9B780]" />
              <span className="hidden sm:inline">Bill</span>
            </button>
          </div>
        </div>

        {/* Tab switch between Menu and Live Orders */}
        <div className="luxury-container mt-2 flex border-b border-[#D9B780]/15">
          <button
            type="button"
            onClick={() => setActiveTab("menu")}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.12em] font-medium transition-colors border-b-2 ${
              activeTab === "menu"
                ? "border-[#D9B780] text-[#D9B780]"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            Digital Menu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-2 text-xs uppercase tracking-[0.12em] font-medium transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === "orders"
                ? "border-[#D9B780] text-[#D9B780]"
                : "border-transparent text-[#F7F2E9]/60 hover:text-[#F7F2E9]"
            }`}
          >
            <span>Your Table Orders</span>
            {tableOrders.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[0.62rem] bg-[#811C36] text-[#FFF9F1]">
                {tableOrders.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="luxury-container flex-1 pt-4">
        {/* ===================== TAB 1: DIGITAL MENU ===================== */}
        {activeTab === "menu" && (
          <div className="space-y-4">
            {/* Search & Diet Toggle */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#D9B780]/70 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search biryanis, tandoor, curries, naan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/30 pl-10 pr-9 py-2.5 text-xs text-[#FFF9F1] placeholder-[#F7F2E9]/40 focus:outline-none focus:border-[#D9B780] transition-colors"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#F7F2E9]/50 hover:text-[#FFF9F1]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Diet Chips */}
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                <button
                  type="button"
                  onClick={() => setDietFilter("all")}
                  className={`px-3 py-1 text-[0.72rem] uppercase tracking-wider font-medium border transition-colors shrink-0 ${
                    dietFilter === "all"
                      ? "bg-[#D9B780] text-[#10110F] border-[#D9B780]"
                      : "bg-[#12352B]/40 text-[#F7F2E9]/75 border-[#D9B780]/25 hover:border-[#D9B780]/60"
                  }`}
                >
                  All Items
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter("veg")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.72rem] uppercase tracking-wider font-medium border transition-colors shrink-0 ${
                    dietFilter === "veg"
                      ? "bg-emerald-900 text-emerald-100 border-emerald-400"
                      : "bg-[#12352B]/40 text-[#F7F2E9]/75 border-[#D9B780]/25 hover:border-[#D9B780]/60"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  Vegetarian
                </button>
                <button
                  type="button"
                  onClick={() => setDietFilter("non-veg")}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 text-[0.72rem] uppercase tracking-wider font-medium border transition-colors shrink-0 ${
                    dietFilter === "non-veg"
                      ? "bg-rose-950 text-rose-100 border-rose-500"
                      : "bg-[#12352B]/40 text-[#F7F2E9]/75 border-[#D9B780]/25 hover:border-[#D9B780]/60"
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  Non-Veg
                </button>
              </div>

              {/* Horizontal Category Pill Tabs */}
              {categories.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory("all")}
                    className={`px-3 py-1.5 text-xs tracking-wider uppercase font-medium border transition-colors shrink-0 ${
                      selectedCategory === "all"
                        ? "bg-[#12352B] text-[#D9B780] border-[#D9B780]"
                        : "bg-transparent text-[#F7F2E9]/60 border-[#D9B780]/20 hover:border-[#D9B780]/50"
                    }`}
                  >
                    All Categories
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3 py-1.5 text-xs tracking-wider uppercase font-medium border transition-colors shrink-0 ${
                        selectedCategory === cat.id
                          ? "bg-[#12352B] text-[#D9B780] border-[#D9B780]"
                          : "bg-transparent text-[#F7F2E9]/60 border-[#D9B780]/20 hover:border-[#D9B780]/50"
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Kitchen Status Alert if not accepting orders */}
            {settings && !settings.accepting_orders && (
              <div className="bg-[#811C36]/30 border border-[#811C36] p-3 text-center text-xs text-[#FFF9F1] flex items-center justify-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#D9B780]" />
                <span>The kitchen is currently pausing new orders. You can still browse the menu or call your waiter.</span>
              </div>
            )}

            {/* Menu Items List */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-[#12352B]/20 border border-[#D9B780]/15 p-8">
                <Utensils className="w-8 h-8 text-[#D9B780]/50 mx-auto mb-3" />
                <p className="text-sm text-[#F7F2E9]/70">No dishes found matching your selection.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setDietFilter("all");
                    setSelectedCategory("all");
                  }}
                  className="mt-3 text-xs text-[#D9B780] underline underline-offset-4"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredItems.map((item) => {
                  const cartEntry = cart.find((c) => c.menuItem.id === item.id);
                  const isSoldOut = !item.is_available;

                  return (
                    <div
                      key={item.id}
                      className={`bg-[#12352B]/25 border border-[#D9B780]/20 p-3.5 flex gap-3 transition-colors hover:border-[#D9B780]/45 ${
                        isSoldOut ? "opacity-60 grayscale-[40%]" : ""
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div className="w-24 h-24 sm:w-28 sm:h-28 shrink-0 bg-[#10110F] border border-[#D9B780]/25 overflow-hidden relative">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#D9B780]/40">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                        {isSoldOut && (
                          <div className="absolute inset-0 bg-black/75 flex items-center justify-center text-[0.68rem] tracking-wider uppercase font-semibold text-rose-300">
                            Sold Out
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`w-2.5 h-2.5 border flex items-center justify-center ${
                                  item.is_veg
                                    ? "border-emerald-500"
                                    : "border-rose-500"
                                }`}
                                title={item.is_veg ? "Vegetarian" : "Non-Vegetarian"}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.is_veg ? "bg-emerald-500" : "bg-rose-500"
                                  }`}
                                />
                              </span>
                              <h3 className="font-display text-base text-[#FFF9F1] font-medium leading-tight">
                                {item.name}
                              </h3>
                              {renderSpice(item.spice_level)}
                            </div>
                            <span className="text-[#D9B780] font-medium text-sm tabular-nums shrink-0 ml-1">
                              ${Number(item.price).toFixed(2)}
                            </span>
                          </div>

                          {item.description && (
                            <p className="text-[0.72rem] text-[#F7F2E9]/70 line-clamp-2 leading-relaxed mb-2">
                              {item.description}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {cartEntry ? (
                            <div className="inline-flex items-center border border-[#D9B780] bg-[#12352B]">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="w-7 h-7 flex items-center justify-center text-[#D9B780] hover:bg-[#811C36] transition-colors"
                                aria-label="Decrease quantity"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-7 text-center text-xs font-semibold tabular-nums text-[#FFF9F1]">
                                {cartEntry.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="w-7 h-7 flex items-center justify-center text-[#D9B780] hover:bg-[#811C36] transition-colors"
                                aria-label="Increase quantity"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isSoldOut}
                              onClick={() => handleAddToCart(item)}
                              className={`px-3 py-1.5 text-[0.72rem] font-medium uppercase tracking-wider border transition-colors ${
                                isSoldOut
                                  ? "border-stone-700 text-stone-500 cursor-not-allowed"
                                  : "bg-[#12352B] hover:bg-[#811C36] text-[#D9B780] hover:text-[#FFF9F1] border-[#D9B780]/50"
                              }`}
                            >
                              Add +
                            </button>
                          )}

                          {cartEntry && (
                            <button
                              type="button"
                              onClick={() => setCartDrawerOpen(true)}
                              className="text-[0.68rem] text-[#D9B780] hover:underline"
                            >
                              Add Note
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ===================== TAB 2: LIVE ORDERS ===================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#D9B780]/20 pb-3">
              <div>
                <h2 className="font-display text-xl text-[#D9B780]">Table {table.number} Order History</h2>
                <p className="text-[0.72rem] text-[#F7F2E9]/70">
                  Live kitchen updates for orders placed during your visit.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab("menu")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs uppercase tracking-wider bg-[#12352B] hover:bg-[#811C36] border border-[#D9B780]/50 text-[#FFF9F1]"
              >
                <Plus className="w-3.5 h-3.5 text-[#D9B780]" /> Order More
              </button>
            </div>

            {tableOrders.length === 0 ? (
              <div className="text-center py-16 bg-[#12352B]/20 border border-[#D9B780]/15 p-8">
                <ChefHat className="w-10 h-10 text-[#D9B780]/40 mx-auto mb-3" />
                <h3 className="font-display text-lg text-[#FFF9F1] mb-1">No Orders Placed Yet</h3>
                <p className="text-xs text-[#F7F2E9]/70 max-w-xs mx-auto mb-4">
                  Browse our digital menu and tap "Add +" to place your first dishes for Table {table.number}.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab("menu")}
                  className="px-4 py-2 bg-[#811C36] border border-[#D9B780]/60 text-xs uppercase tracking-widest text-[#FFF9F1]"
                >
                  Browse Menu
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {tableOrders.map((order) => {
                  const currentStep = getProgressStep(order.status);

                  return (
                    <div
                      key={order.id}
                      className="bg-[#12352B]/30 border border-[#D9B780]/30 p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-[#D9B780]/15 pb-2.5">
                        <div>
                          <span className="font-display text-lg text-[#D9B780]">
                            Order #{order.order_number}
                          </span>
                          <span className="text-[0.68rem] text-[#F7F2E9]/50 ml-2">
                            {new Date(order.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                        {renderStatusBadge(order.status)}
                      </div>

                      {/* Visual Progress Stepper */}
                      {order.status !== "cancelled" && (
                        <div className="py-2">
                          <div className="flex items-center justify-between text-[0.68rem] text-[#F7F2E9]/70 mb-1.5 font-medium">
                            <span className={currentStep >= 1 ? "text-[#D9B780]" : ""}>Placed</span>
                            <span className={currentStep >= 2 ? "text-[#D9B780]" : ""}>Accepted</span>
                            <span className={currentStep >= 3 ? "text-[#D9B780]" : ""}>Preparing</span>
                            <span className={currentStep >= 4 ? "text-[#D9B780]" : ""}>Ready</span>
                            <span className={currentStep >= 5 ? "text-emerald-400" : ""}>Served</span>
                          </div>
                          <div className="w-full bg-[#10110F] h-1.5 rounded-full overflow-hidden flex">
                            <div
                              className={`h-full transition-all duration-500 ${
                                currentStep === 5 ? "bg-emerald-400" : "bg-[#D9B780]"
                              }`}
                              style={{ width: `${(Math.min(currentStep, 5) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Item list */}
                      <div className="space-y-1.5 pt-1 text-xs">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[#F7F2E9]/90">
                            <div className="flex items-center gap-2">
                              <span className="text-[#D9B780] font-semibold">
                                {item.quantity}×
                              </span>
                              <span>{item.name}</span>
                              {item.notes && (
                                <span className="text-[0.68rem] text-[#D9B780]/70 italic">
                                  ({item.notes})
                                </span>
                              )}
                            </div>
                            <span className="tabular-nums text-[#F7F2E9]/80">
                              ${Number(item.line_total).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.customer_note && (
                        <p className="text-[0.72rem] bg-[#10110F]/70 border-l-2 border-[#D9B780] p-2 text-[#F7F2E9]/80 italic">
                          Note: "{order.customer_note}"
                        </p>
                      )}

                      {/* Cost breakdown */}
                      <div className="border-t border-[#D9B780]/15 pt-2 flex items-center justify-between text-xs font-medium">
                        <span className="text-[#F7F2E9]/60">
                          Subtotal: ${Number(order.subtotal).toFixed(2)} • Tax: ${Number(order.tax).toFixed(2)}
                        </span>
                        <span className="text-[#D9B780] text-sm tabular-nums">
                          Total: ${Number(order.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Bottom Cart Bar */}
      {cartCount > 0 && !cartDrawerOpen && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-[#12352B]/95 backdrop-blur-md border-t border-[#D9B780]/60 p-3 shadow-2xl">
          <div className="luxury-container flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-[#811C36] text-[#FFF9F1] text-xs font-bold flex items-center justify-center">
                  {cartCount}
                </span>
                <span className="text-xs uppercase tracking-wider font-semibold text-[#FFF9F1]">
                  Items in Bag
                </span>
              </div>
              <p className="text-[#D9B780] text-sm font-semibold tabular-nums">
                Est. Total: ${total.toFixed(2)}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCartDrawerOpen(true)}
              className="px-5 py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-[0.12em] font-medium shadow-lg transition-colors flex items-center gap-2"
            >
              <ShoppingBag className="w-4 h-4 text-[#D9B780]" />
              <span>Review & Place</span>
            </button>
          </div>
        </div>
      )}

      {/* Cart Bottom Sheet / Drawer */}
      {cartDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="w-full sm:max-w-lg bg-[#10110F] border border-[#D9B780]/40 max-h-[92vh] flex flex-col shadow-2xl">
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-[#D9B780]/20 flex items-center justify-between bg-[#12352B]/40">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#D9B780]" />
                <h3 className="font-display text-lg text-[#FFF9F1]">
                  Table {table.number} • Dining Bag
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCartDrawerOpen(false)}
                className="text-[#F7F2E9]/60 hover:text-[#FFF9F1] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 divide-y divide-[#D9B780]/15">
              {cart.map((item) => (
                <div key={item.menuItem.id} className="pt-3 first:pt-0 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display text-base text-[#FFF9F1] font-medium">
                        {item.menuItem.name}
                      </h4>
                      <p className="text-xs text-[#D9B780] tabular-nums">
                        ${Number(item.menuItem.price).toFixed(2)} each
                      </p>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center border border-[#D9B780]/60 bg-[#12352B]">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItem.id, -1)}
                          className="w-7 h-7 flex items-center justify-center text-[#D9B780] hover:bg-[#811C36]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center text-xs font-semibold tabular-nums text-[#FFF9F1]">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItem.id, 1)}
                          className="w-7 h-7 flex items-center justify-center text-[#D9B780] hover:bg-[#811C36]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveFromCart(item.menuItem.id)}
                        className="text-[#F7F2E9]/40 hover:text-rose-400 p-1"
                        title="Remove dish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Special instructions per dish */}
                  <input
                    type="text"
                    placeholder="Preparation notes (e.g., extra spicy, no cilantro)..."
                    value={item.notes}
                    onChange={(e) => handleUpdateItemNote(item.menuItem.id, e.target.value)}
                    className="w-full bg-[#12352B]/30 border border-[#D9B780]/20 px-2.5 py-1.5 text-[0.72rem] text-[#FFF9F1] placeholder-[#F7F2E9]/40 focus:outline-none focus:border-[#D9B780]"
                  />
                </div>
              ))}

              {/* General Order Note */}
              <div className="pt-3">
                <label className="block text-[0.72rem] uppercase tracking-wider text-[#D9B780] mb-1 font-medium">
                  Table Order Instructions (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="E.g., Please bring appetizers first, extra water glasses, allergy notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full bg-[#12352B]/30 border border-[#D9B780]/20 p-2 text-xs text-[#FFF9F1] placeholder-[#F7F2E9]/40 focus:outline-none focus:border-[#D9B780]"
                />
              </div>

              {/* Financial Breakdown */}
              <div className="pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#F7F2E9]/75">
                  <span>Subtotal</span>
                  <span className="tabular-nums">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-[#F7F2E9]/75">
                  <span>FL Sales Tax ({taxRate}%)</span>
                  <span className="tabular-nums">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold text-[#D9B780] border-t border-[#D9B780]/20 pt-1.5">
                  <span>Estimated Total</span>
                  <span className="tabular-nums">${total.toFixed(2)}</span>
                </div>
                <p className="text-[0.68rem] text-[#F7F2E9]/55 italic pt-1">
                  * Prices are validated server-side. Payment is handled at your table with your server.
                </p>
              </div>
            </div>

            {/* Footer Place Order Button */}
            <div className="p-4 border-t border-[#D9B780]/20 bg-[#12352B]/30">
              <button
                type="button"
                disabled={isPlacingOrder || cart.length === 0}
                onClick={handlePlaceOrder}
                className="w-full py-3 bg-[#811C36] hover:bg-[#67142A] disabled:opacity-50 border border-[#D9B780] text-[#FFF9F1] text-xs uppercase tracking-[0.15em] font-medium transition-colors flex items-center justify-center gap-2"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Transmitting Order to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#D9B780]" />
                    <span>Place Dine-In Order (${total.toFixed(2)})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Service Request Confirmation Modal */}
      {serviceModalOpen && pendingServiceType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="max-w-sm w-full bg-[#10110F] border border-[#D9B780] p-6 text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 mx-auto rounded-full bg-[#12352B] border border-[#D9B780] flex items-center justify-center text-[#D9B780]">
              {pendingServiceType === "call_waiter" && <Bell className="w-6 h-6" />}
              {pendingServiceType === "request_bill" && <Receipt className="w-6 h-6" />}
              {pendingServiceType === "water" && <Droplet className="w-6 h-6" />}
            </div>

            <div>
              <h3 className="font-display text-xl text-[#FFF9F1] mb-1">
                {pendingServiceType === "call_waiter" && "Notify Your Server"}
                {pendingServiceType === "request_bill" && "Request Table Bill"}
                {pendingServiceType === "water" && "Request Water Refill"}
              </h3>
              <p className="text-xs text-[#F7F2E9]/75">
                Table {table.number} • {table.section}
              </p>
            </div>

            <p className="text-xs text-[#F7F2E9]/80 leading-relaxed">
              {pendingServiceType === "call_waiter" &&
                "Your server will be alerted at their station to come directly to your table."}
              {pendingServiceType === "request_bill" &&
                "Your server will prepare your itemized check and bring it to your table."}
              {pendingServiceType === "water" &&
                "A dining runner will bring fresh ice water to Table " + table.number + "."}
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setServiceModalOpen(false)}
                className="py-2.5 border border-[#D9B780]/30 text-xs uppercase tracking-wider text-[#F7F2E9]/80 hover:bg-[#12352B]/40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCallingService}
                onClick={() => handleRequestService(pendingServiceType)}
                className="py-2.5 bg-[#811C36] hover:bg-[#67142A] border border-[#D9B780] text-xs uppercase tracking-wider text-[#FFF9F1] font-medium flex items-center justify-center gap-1.5"
              >
                {isCallingService ? "Notifying..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
