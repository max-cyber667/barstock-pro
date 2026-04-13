import { AlertItem, StockWithItem } from "@/types";

export function formatQty(qty: number, unit: string): string {
  return `${qty % 1 === 0 ? qty : qty.toFixed(1)} ${unit}`;
}

export function formatEur(value: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function stockStatus(
  qty: number,
  threshold: number
): "ok" | "low" | "empty" {
  if (qty <= 0) return "empty";
  if (threshold > 0 && qty <= threshold) return "low";
  return "ok";
}

export function computeAlerts(rows: StockWithItem[]): AlertItem[] {
  const alerts: AlertItem[] = [];
  for (const row of rows) {
    const threshold =
      row.location === "bar"
        ? row.items.min_stock_bar
        : row.items.min_stock_reserve;
    if (threshold > 0 && row.quantity <= threshold) {
      alerts.push({
        item: row.items,
        location: row.location,
        current: row.quantity,
        threshold,
      });
    }
  }
  return alerts;
}

export function computeStockValue(rows: StockWithItem[]): number {
  return rows.reduce(
    (sum, row) => sum + row.quantity * row.items.cost_per_unit,
    0
  );
}

export function movementTypeLabel(type: string): string {
  switch (type) {
    case "livraison":
      return "Livraison";
    case "reassort":
      return "Réassort";
    case "ajustement":
      return "Ajustement";
    case "perte":
      return "Perte";
    default:
      return type;
  }
}

export function movementTypeColor(type: string): string {
  switch (type) {
    case "livraison":
      return "bg-blue-100 text-blue-800";
    case "reassort":
      return "bg-purple-100 text-purple-800";
    case "ajustement":
      return "bg-yellow-100 text-yellow-800";
    case "perte":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
