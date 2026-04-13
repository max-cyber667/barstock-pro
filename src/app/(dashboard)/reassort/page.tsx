"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight, Lightbulb, Check, Minus, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatQty } from "@/lib/utils";

interface ReassortItem {
  stockReserveId: string;
  itemId: string;
  itemName: string;
  unit: string;
  reserveQty: number;
  barQty: number;
  minStockBar: number;
  suggested: number;
  selected: number;
}

export default function ReassortPage() {
  const [items, setItems] = useState<ReassortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();

    const [{ data: reserve }, { data: bar }] = await Promise.all([
      supabase.from("stock").select("id, item_id, quantity, items(name, unit, min_stock_bar, min_stock_reserve)").eq("location", "reserve"),
      supabase.from("stock").select("item_id, quantity").eq("location", "bar"),
    ]);

    const barMap = new Map((bar ?? []).map((b: { item_id: string; quantity: number }) => [b.item_id, b.quantity]));

    type ReserveRow = { id: string; item_id: string; quantity: number; items: { name: string; unit: string; min_stock_bar: number; min_stock_reserve: number } };
    const rows: ReassortItem[] = ((reserve ?? []) as unknown as ReserveRow[])
      .filter((r) => r.quantity > 0)
      .map((r) => {
        const barQty = barMap.get(r.item_id) ?? 0;
        const minBar = r.items?.min_stock_bar ?? 0;
        const suggested = minBar > 0 ? Math.max(0, minBar - barQty) : 0;
        return {
          stockReserveId: r.id,
          itemId: r.item_id,
          itemName: r.items?.name ?? "",
          unit: r.items?.unit ?? "",
          reserveQty: r.quantity,
          barQty,
          minStockBar: minBar,
          suggested: Math.min(suggested, r.quantity),
          selected: 0,
        };
      })
      .sort((a, b) => b.suggested - a.suggested);

    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const suggestions = items.filter((i) => i.suggested > 0);

  function acceptAll() {
    setItems((prev) =>
      prev.map((i) => ({ ...i, selected: i.suggested }))
    );
  }

  function setQty(itemId: string, value: number) {
    setItems((prev) =>
      prev.map((i) =>
        i.itemId === itemId
          ? { ...i, selected: Math.min(Math.max(0, value), i.reserveQty) }
          : i
      )
    );
  }

  const toTransfer = items.filter((i) => i.selected > 0);

  async function handleTransfer() {
    if (!toTransfer.length) return;
    setSaving(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    for (const item of toTransfer) {
      // Update reserve
      await supabase
        .from("stock")
        .update({ quantity: item.reserveQty - item.selected })
        .eq("id", item.stockReserveId);

      // Update bar
      const { data: barStock } = await supabase
        .from("stock")
        .select("id, quantity")
        .eq("item_id", item.itemId)
        .eq("location", "bar")
        .single();

      if (barStock) {
        await supabase
          .from("stock")
          .update({ quantity: barStock.quantity + item.selected })
          .eq("id", barStock.id);
      }

      // Log movement
      await supabase.from("stock_movements").insert({
        item_id: item.itemId,
        user_id: user?.id ?? null,
        type: "reassort",
        from_location: "reserve",
        to_location: "bar",
        quantity: item.selected,
        direction: "transfer",
      });
    }

    success(`${toTransfer.length} article${toTransfer.length > 1 ? "s" : ""} transféré${toTransfer.length > 1 ? "s" : ""} vers le bar`);
    setSaving(false);
    load();
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-purple-100 rounded-lg">
          <ArrowLeftRight size={20} className="text-purple-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Réassort</h1>
          <p className="text-gray-500 text-sm">Transférer des articles de la réserve vers le bar</p>
        </div>
      </div>

      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-600" />
              <h2 className="font-semibold text-amber-900">
                {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""} de réassort
              </h2>
            </div>
            <button
              onClick={acceptAll}
              className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium"
            >
              Tout accepter
            </button>
          </div>
          <p className="text-xs text-amber-700">
            Ces articles sont en dessous du seuil minimum au bar. Quantités suggérées pour atteindre le seuil.
          </p>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <p className="text-sm text-gray-500">Sélectionnez les quantités à transférer vers le bar</p>
        </div>
        <div className="divide-y divide-gray-50">
          {items.map((item) => (
            <div key={item.itemId} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900">{item.itemName}</p>
                  {item.suggested > 0 && (
                    <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                      Suggéré : {item.suggested} {item.unit}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Réserve : {formatQty(item.reserveQty, item.unit)} · Bar : {formatQty(item.barQty, item.unit)}
                  {item.minStockBar > 0 && ` · Seuil bar : ${formatQty(item.minStockBar, item.unit)}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQty(item.itemId, item.selected - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                >
                  <Minus size={14} />
                </button>
                <input
                  type="number"
                  value={item.selected}
                  onChange={(e) => setQty(item.itemId, parseFloat(e.target.value) || 0)}
                  className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                  min="0"
                  max={item.reserveQty}
                  step="0.5"
                />
                <span className="text-sm text-gray-500 w-8">{item.unit}</span>
                <button
                  onClick={() => setQty(item.itemId, item.selected + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="p-8 text-center text-gray-400 text-sm">Réserve vide</p>
          )}
        </div>
      </div>

      {toTransfer.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <button
            onClick={handleTransfer}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} />
            {saving ? "Transfert en cours..." : `Transférer ${toTransfer.length} article${toTransfer.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
    </div>
  );
}
