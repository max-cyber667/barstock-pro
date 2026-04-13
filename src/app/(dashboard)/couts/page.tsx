"use client";

import { useEffect, useState } from "react";
import { TrendingUp, Euro } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatEur, formatDate, movementTypeColor } from "@/lib/utils";

interface CategoryValue {
  name: string;
  value: number;
  color: string;
}

interface LossRow {
  date: string;
  item: string;
  unit: string;
  quantity: number;
  cost: number;
}

export default function CoutsPage() {
  const [loading, setLoading] = useState(true);
  const [barTotal, setBarTotal] = useState(0);
  const [reserveTotal, setReserveTotal] = useState(0);
  const [categoryValues, setCategoryValues] = useState<CategoryValue[]>([]);
  const [losses, setLosses] = useState<LossRow[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      const supabase = createClient();

      const [{ data: barStock }, { data: reserveStock }, { data: lossMovements }] = await Promise.all([
        supabase.from("stock").select("quantity, items(cost_per_unit, categories(name, color))").eq("location", "bar"),
        supabase.from("stock").select("quantity, items(cost_per_unit, categories(name, color))").eq("location", "reserve"),
        supabase.from("stock_movements")
          .select("quantity, cost_at_time, created_at, items(name, unit)")
          .in("type", ["perte", "ajustement"])
          .eq("direction", "out")
          .gte("created_at", dateFrom)
          .order("created_at", { ascending: false }),
      ]);

      type StockRow = { quantity: number; items: { cost_per_unit: number; categories: { name: string; color: string } | null } | null };

      const calcTotal = (rows: StockRow[]) =>
        rows.reduce((s, r) => s + r.quantity * (r.items?.cost_per_unit ?? 0), 0);

      const calcCategories = (rows: StockRow[]): CategoryValue[] => {
        const map = new Map<string, { value: number; color: string }>();
        for (const r of rows) {
          const catName = r.items?.categories?.name ?? "Sans catégorie";
          const catColor = r.items?.categories?.color ?? "#6b7280";
          const val = r.quantity * (r.items?.cost_per_unit ?? 0);
          const existing = map.get(catName);
          if (existing) existing.value += val;
          else map.set(catName, { value: val, color: catColor });
        }
        return Array.from(map.entries())
          .map(([name, { value, color }]) => ({ name, value, color }))
          .sort((a, b) => b.value - a.value);
      };

      const allStock = [...(barStock ?? []), ...(reserveStock ?? [])] as unknown as StockRow[];

      setBarTotal(calcTotal((barStock ?? []) as unknown as StockRow[]));
      setReserveTotal(calcTotal((reserveStock ?? []) as unknown as StockRow[]));
      setCategoryValues(calcCategories(allStock));

      type LossMvt = { quantity: number; cost_at_time: number | null; created_at: string; items: { name: string; unit: string } | null };
      setLosses(
        ((lossMovements ?? []) as unknown as LossMvt[]).map((m) => ({
          date: m.created_at,
          item: m.items?.name ?? "—",
          unit: m.items?.unit ?? "",
          quantity: m.quantity,
          cost: m.quantity * (m.cost_at_time ?? 0),
        }))
      );

      setLoading(false);
    }

    load();
  }, [dateFrom]);

  const totalValue = barTotal + reserveTotal;
  const maxCatValue = Math.max(...categoryValues.map((c) => c.value), 1);
  const totalLosses = losses.reduce((s, l) => s + l.cost, 0);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-emerald-100 rounded-lg">
          <TrendingUp size={20} className="text-emerald-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analyse des coûts</h1>
          <p className="text-gray-500 text-sm">Valeur du stock et suivi des pertes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Valeur stock bar", value: barTotal, color: "bg-amber-500" },
          { label: "Valeur stock réserve", value: reserveTotal, color: "bg-indigo-500" },
          { label: "Valeur totale", value: totalValue, color: "bg-emerald-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className={`inline-flex p-2 rounded-lg ${s.color} mb-3`}>
              <Euro size={18} className="text-white" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatEur(s.value)}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="font-semibold text-gray-900 mb-4">Valeur par catégorie</h2>
        <div className="space-y-3">
          {categoryValues.map((c) => (
            <div key={c.name}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{c.name}</span>
                <span className="font-medium text-gray-900">{formatEur(c.value)}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(c.value / maxCatValue) * 100}%`,
                    backgroundColor: c.color || "#6366f1",
                  }}
                />
              </div>
            </div>
          ))}
          {categoryValues.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">Aucune donnée</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Analyse des pertes</h2>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Depuis</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {losses.length > 0 ? (
          <>
            <div className="mb-3 px-3 py-2 bg-red-50 rounded-lg flex justify-between text-sm">
              <span className="text-red-700 font-medium">Total des pertes sur la période</span>
              <span className="text-red-700 font-bold">{formatEur(totalLosses)}</span>
            </div>
            <div className="space-y-2">
              {losses.map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{l.item}</span>
                    <span className="text-gray-400 ml-2">{l.quantity} {l.unit}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-red-600 font-medium">{formatEur(l.cost)}</span>
                    <p className="text-xs text-gray-400">{formatDate(l.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-400 text-center py-6">Aucune perte enregistrée sur cette période</p>
        )}
      </div>
    </div>
  );
}
