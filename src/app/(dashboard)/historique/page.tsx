"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, movementTypeLabel, movementTypeColor } from "@/lib/utils";
import { StockMovement } from "@/types";

const PAGE_SIZE = 25;
const MOVE_TYPES = ["tous", "livraison", "reassort", "ajustement", "perte"];

export default function HistoriquePage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("tous");
  const [filterItem, setFilterItem] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase
      .from("stock_movements")
      .select("*, items(name, unit), profiles(display_name, email)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (filterType !== "tous") query = query.eq("type", filterType);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    const { data, count } = await query;

    let filtered = data ?? [];
    if (filterItem) {
      filtered = filtered.filter((m: StockMovement) =>
        m.items?.name.toLowerCase().includes(filterItem.toLowerCase())
      );
    }

    setMovements(filtered as StockMovement[]);
    setTotal(count ?? 0);
    setLoading(false);
  }, [page, filterType, filterItem, dateFrom, dateTo]);

  useEffect(() => { load(); }, [load]);

  async function exportCSV() {
    const supabase = createClient();
    const { data } = await supabase
      .from("stock_movements")
      .select("*, items(name, unit), profiles(display_name, email)")
      .order("created_at", { ascending: false });

    if (!data) return;

    const rows = [
      ["Date", "Type", "Article", "Quantité", "Unité", "Direction", "De", "Vers", "Utilisateur", "Notes"],
      ...(data as StockMovement[]).map((m) => [
        formatDate(m.created_at),
        movementTypeLabel(m.type),
        m.items?.name ?? "",
        m.quantity,
        m.items?.unit ?? "",
        m.direction,
        m.from_location ?? "",
        m.to_location ?? "",
        m.profiles?.display_name ?? m.profiles?.email ?? "",
        m.notes ?? "",
      ]),
    ];

    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <History size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Historique</h1>
            <p className="text-gray-500 text-sm">Tous les mouvements de stock</p>
          </div>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
        >
          <Download size={16} />
          <span className="hidden sm:inline">Exporter CSV</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {MOVE_TYPES.map((t) => (
              <option key={t} value={t}>{t === "tous" ? "Tous les types" : movementTypeLabel(t)}</option>
            ))}
          </select>
          <input
            type="text"
            value={filterItem}
            onChange={(e) => { setFilterItem(e.target.value); setPage(0); }}
            placeholder="Filtrer par article..."
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500 flex-1 min-w-0"
          />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-10" />
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Article</th>
                  <th className="px-4 py-3 text-center font-medium">Quantité</th>
                  <th className="px-4 py-3 text-left font-medium">Mouvement</th>
                  <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movementTypeColor(m.type)}`}>
                        {movementTypeLabel(m.type)}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900">{m.items?.name}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={m.direction === "out" ? "text-red-600 font-medium" : "text-green-600 font-medium"}>
                        {m.direction === "out" ? "-" : "+"}{m.quantity} {m.items?.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {m.from_location && m.to_location && m.from_location !== m.to_location
                        ? `${m.from_location} → ${m.to_location}`
                        : m.from_location ?? m.to_location ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{m.profiles?.display_name ?? m.profiles?.email ?? "—"}</td>
                  </tr>
                ))}
                {movements.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-400">Aucun mouvement trouvé</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-gray-100">
            {movements.map((m) => (
              <div key={m.id} className="p-4">
                <div className="flex items-start justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movementTypeColor(m.type)}`}>
                    {movementTypeLabel(m.type)}
                  </span>
                  <span className={`text-sm font-medium ${m.direction === "out" ? "text-red-600" : "text-green-600"}`}>
                    {m.direction === "out" ? "-" : "+"}{m.quantity} {m.items?.unit}
                  </span>
                </div>
                <p className="font-medium text-gray-900 text-sm">{m.items?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatDate(m.created_at)}</p>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="p-8 text-center text-gray-400 text-sm">Aucun mouvement trouvé</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">
                Page {page + 1} / {totalPages} ({total} résultats)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
