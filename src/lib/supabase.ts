import { createClient } from "@supabase/supabase-js";

// Read credentials strictly from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || "";
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabasePublishableKey && 
  !supabaseUrl.includes("MY_SUPABASE_URL")
);

// Fallback placeholder client to avoid throwing on initial render before setup
export const supabase = createClient(
  isSupabaseConfigured ? supabaseUrl : "https://placeholder-domain.supabase.co",
  isSupabaseConfigured ? supabasePublishableKey : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
);

// Database Types
export interface RestaurantTable {
  id: string;
  number: number;
  label: string | null;
  seats: number;
  section: string;
  token: string;
  is_active: boolean;
  created_at: string;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  spice_level: number;
  is_available: boolean;
  sort_order: number;
  created_at: string;
}

export interface OrderItemSnapshot {
  item_id: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  line_total: number;
  is_veg?: boolean;
}

export type OrderStatus =
  | "placed"
  | "accepted"
  | "preparing"
  | "ready"
  | "served"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  order_number: string;
  table_id: string;
  table_number: number;
  items: OrderItemSnapshot[];
  subtotal: number;
  tax: number;
  total: number;
  status: OrderStatus;
  customer_note: string | null;
  created_at: string;
  updated_at: string;
}

export type ServiceRequestType = "call_waiter" | "request_bill" | "water" | "other";
export type ServiceRequestStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface ServiceRequest {
  id: string;
  table_id: string;
  table_number: number;
  type: ServiceRequestType;
  status: ServiceRequestStatus;
  created_at: string;
}

export interface RestaurantSettings {
  id: string;
  restaurant_name: string;
  tax_rate: number;
  currency: string;
  accepting_orders: boolean;
  updated_at: string;
}
