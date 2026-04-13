"use client";

import { useState, useCallback } from "react";
import { Search, Filter, Minus, Plus, Check, X } from "lucide-react";
import { StockWithItem } from "@/types";
import { StockStatusBadge } from "@/components/ui/Badge";
import { AlertBanner } from "./AlertBanner";
import { useRealtimeStock } from "@/hooks/useRealtimeStock";
import { useStockAlerts } from "@/hooks/useStockAlerts";
import { formatEur } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";

interface Props {
  location: "bar" | "reserve";
  initialRows: StockWithItem[];
  isManager: boolean;
}

type FilterStatus = "all" | "low" | "empty";

export function StockTable({ location, initialRows, isManager }: Props) {
  const [rows, setRows] = useState<StockWithItem[]>(initialRows);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [editing, setEditing] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const onUpdate = useCallback((updated: StockWithItem[]) => {
    setRows(updated);
  }, []);

  useRealtimeStock(location, rows, onUpdate);
  const alerts = useStockAlerts(rows);

  const categories = Array.from(
    new Set(rows.map((r) => r.items?.categories?.name).filter(Boolean))
  ) as string[];

  const filtered = rows.filter((r) => {
    if (search && !r.items?.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCategory !== "all" && r.items?.categories?.name !== filterCategory) return false;
    if (filterStatus === "low") {
      const threshold = location === "bar" ? r.items?.min_stock_bar : r.items?.min_stock_reserve;
      return threshold > 0 && r.quantity <= threshold && r.quantity > 0;
    }
    if (filterStatus === "empty") return r.quantity <= 0;
    return true;
  });

  async function saveEdit(id: string, rawValue: string) {
    const qty = parseFloat(rawValue.replace(",", "."));
    if (isNaN(qty) || qty < 0) {
      showError("Quantité invalide");
      setEditing(null);
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const row = rows.find((r) => r.id === id);
    if (!row) { setSaving(false); return; }

    const diff = qty - row.quantity;
    const { error: err } = await supabase.from("stock").update({ quantity: qty }).eq("id", id);

    if (err) {
      showError("Erreur lors de la sauvegarde");
    } else {
      setRows((prev) => prev.map((r) => r.id === id ? { ...r, quantity: qty } : r));
      if (diff !== 0) {
        await supabase.from("stock_movements").insert({
          item_id: row.item_id,
          user_id: user?.id ?? null,
          type: "ajustement",
          from_location: location,
          to_location: location,
          quantity: Math.abs(diff),
          direction: diff > 0 ? "in" : "out",
          cost_at_time: row.items?.cost_per_unit ?? null,
        });
      }
      success("Stock mis à jour");
    }
    setSaving(false);
    setEditing(null);
  }

  return (
    <div>
      <AlertBanner alerts={alerts} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un article..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Toutes catégories</option>
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Tous statuts</option>
              <option value="low">Faible</option>
              <option value="empty">Rupture</option>
            </select>
          </div>
        </div>

        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Article</th>
                <th className="px-4 py-3 text-left font-medium">Catégorie</th>
                <th className="px-4 py-3 text-center font-medium">Quantité</th>
                <th className="px-4 py-3 text-center font-medium">Statut</th>
                {isManager && <th className="px-4 py-3 text-right font-medium">Valeur</th>}
                {isManager && <th className="px-4 py-3 text-center font-medium">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((row) => {
                const threshold = location === "bar" ? row.items?.min_stock_bar : row.items?.min_stock_reserve;
                const isEditing = editing?.id === row.id;
                return (
                  <tr key={row.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.items?.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.items?.categories?.name ?? "—"}</td>
                    <td className="px-4 py-3 text-center">
                      {isEditing ? (
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setEditing({ id: row.id, value: String(Math.max(0, parseFloat(editing.value || "0") - 1) ) })} className="p-1 rounded border hover:bg-gray-100">
                            <Minus size={14} />
                          </button>
                          <input
                            type="number"
                            value={editing.value}
                            onChange={(e) => setEditing({ id: row.id, value: e.target.value })}
                            className="w-20 text-center border rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                            min="0"
                            step="0.5"
                            autoFocus
                          />
                          <button onClick={() => setEditing({ id: row.id, value: String(parseFloat(editing.value || "0") + 1) })} className="p-1 rounded border hover:bg-gray-100">
                            <Plus size={14} />
                          </button>
                        </div>
                      ) : (
                        <span className="font-mono">{row.quantity} {row.items?.unit}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StockStatusBadge qty={row.quantity} threshold={threshold ?? 0} />
                    </td>
                    {isManager && (
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatEur(row.quantity * (row.items?.cost_per_unit ?? 0))}
                      </td>
                    )}
                    {isManager && (
                      <td className="px-4 py-3 text-center">
                        {isEditing ? (
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => saveEdit(row.id, editing.value)} disabled={saving} className="p-1.5 rounded-lg bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
                              <Check size={14} />
                            </button>
                            <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg bg-gray-200 text-gray-600 hover:bg-gray-300">
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditing({ id: row.id, value: String(row.quantity) })}
                            className="text-xs px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                          >
                            Ajuster
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                    Aucun article trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-gray-100">
          {filtered.map((row) => {
            const threshold = location === "bar" ? row.items?.min_stock_bar : row.items?.min_stock_reserve;
            const isEditing = editing?.id === row.id;
            return (
              <div key={row.id} className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">{row.items?.name}</p>
                    <p className="text-xs text-gray-500">{row.items?.categories?.name ?? "—"}</p>
                  </div>
                  <StockStatusBadge qty={row.quantity} threshold={threshold ?? 0} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-lg font-semibold text-gray-900">
                    {row.quantity} <span className="text-sm font-normal text-gray-500">{row.items?.unit}</span>
                  </span>
                  {isManager && !isEditing && (
                    <button
                      onClick={() => setEditing({ id: row.id, value: String(row.quantity) })}
                      className="text-xs px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-medium"
                    >
                      Ajuster
                    </button>
                  )}
                  {isManager && isEditing && (
                    <div className="flex items-center gap-1">
                      <button onClick={() => setEditing({ id: row.id, value: String(Math.max(0, parseFloat(editing.value || "0") - 1)) })} className="p-1.5 rounded-lg border">
                        <Minus size={14} />
                      </button>
                      <input
                        type="number"
                        value={editing.value}
                        onChange={(e) => setEditing({ id: row.id, value: e.target.value })}
                        className="w-16 text-center border rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                        autoFocus
                      />
                      <button onClick={() => setEditing({ id: row.id, value: String(parseFloat(editing.value || "0") + 1) })} className="p-1.5 rounded-lg border">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => saveEdit(row.id, editing.value)} disabled={saving} className="p-1.5 rounded-lg bg-green-500 text-white">
                        <Check size={14} />
                      </button>
                      <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg bg-gray-200">
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="p-8 text-center text-gray-400 text-sm">Aucun article trouvé</p>
          )}
        </div>

        <div className="px-4 py-3 border-t bg-gray-50/50 text-xs text-gray-500 flex justify-between">
          <span>{filtered.length} article{filtered.length > 1 ? "s" : ""}</span>
          {isManager && (
            <span className="font-medium">
              Valeur totale : {formatEur(filtered.reduce((s, r) => s + r.quantity * (r.items?.cost_per_unit ?? 0), 0))}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
