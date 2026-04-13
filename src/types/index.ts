export type Role = "admin" | "manager" | "staff";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  role: Role;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Item {
  id: string;
  category_id: string | null;
  name: string;
  unit: string;
  unit_size: number;
  cost_per_unit: number;
  supplier: string | null;
  min_stock_bar: number;
  min_stock_reserve: number;
  created_at: string;
  categories?: Category;
}

export interface Stock {
  id: string;
  item_id: string;
  location: "bar" | "reserve";
  quantity: number;
  updated_at: string;
  items?: Item;
}

export type MovementType = "livraison" | "reassort" | "ajustement" | "perte";

export interface StockMovement {
  id: string;
  item_id: string;
  user_id: string | null;
  type: MovementType;
  from_location: string | null;
  to_location: string | null;
  quantity: number;
  direction: "in" | "out" | "transfer";
  cost_at_time: number | null;
  notes: string | null;
  created_at: string;
  items?: Item;
  profiles?: Profile;
}

export interface PurchaseOrder {
  id: string;
  status: "brouillon" | "envoyé" | "reçu";
  notes: string | null;
  created_by: string | null;
  created_at: string;
  purchase_order_lines?: PurchaseOrderLine[];
  profiles?: Profile;
}

export interface PurchaseOrderLine {
  id: string;
  order_id: string;
  item_id: string | null;
  item_name: string;
  suggested_qty: number;
  ordered_qty: number;
  unit_cost: number;
  items?: Item;
}

export interface StockWithItem extends Stock {
  items: Item & { categories: Category | null };
}

export interface AlertItem {
  item: Item;
  location: "bar" | "reserve";
  current: number;
  threshold: number;
}
