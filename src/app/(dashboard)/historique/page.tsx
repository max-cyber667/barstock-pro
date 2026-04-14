"use client";

import { useEffect, useState, useCallback } from "react";
import { History, Download, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatDate, formatEur, movementTypeLabel, movementTypeColor } from "@/lib/utils";
import { StockMovement } from "@/types";

const PAGE_SIZE = 25;
const MOVE_TYPES = ["tous", "livraison", "reassort", "ajustement", "perte"];

function matchesService(iso: string, service: string): boolean {
  if (service === "tous") return true;
  const hour = new Date(iso).getHours();
  if (service === "midi") return hour < 16;
  if (service === "soir") return hour >= 16;
  return true;
}

function getService(iso: string) {
  return new Date(iso).getHours() < 16 ? "Midi" : "Soir";
}

interface ReassortSession {
  key: string; // created_at exact
  created_at: string;
  service: string;
  items: StockMovement[];
  totalCost: number;
  user: string;
}

function groupReassorts(movements: StockMovement[]): ReassortSession[] {
  const map = new Map<string, StockMovement[]>();
  for (const m of movements) {
    const key = m.created_at;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m);
  }
  return Array.from(map.entries())
    .map(([key, items]) => ({
      key,
      created_at: key,
      service: getService(key),
      items,
      totalCost: items.reduce((s, m) => s + (m.cost_at_time ?? 0) * m.quantity, 0),
      user: items[0].profiles?.display_name ?? items[0].profiles?.email ?? "—",
    }))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function HistoriquePage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("tous");
  const [filterItem, setFilterItem] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [service, setService] = useState("tous");
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const isReassortView = filterType === "reassort";

  const load = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    const useClientFilter = service !== "tous" || isReassortView;
    const limit = useClientFilter ? 1000 : PAGE_SIZE;

    let query = supabase
      .from("stock_movements")
      .select("*, items(name, unit, cost_per_unit), profiles(display_name, email)", { count: "exact" })
      .order("created_at", { ascending: false });

    if (filterType !== "tous") query = query.eq("type", filterType);
    if (dateFrom) query = query.gte("created_at", dateFrom);
    if (dateTo) query = query.lte("created_at", dateTo + "T23:59:59");

    if (!useClientFilter) {
      query = query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    } else {
      query = query.limit(limit);
    }

    const { data, count } = await query;
    let filtered = (data ?? []) as StockMovement[];

    if (filterItem) {
      filtered = filtered.filter((m) =>
        m.items?.name.toLowerCase().includes(filterItem.toLowerCase())
      );
    }
    if (service !== "tous") {
      filtered = filtered.filter((m) => matchesService(m.created_at, service));
    }

    if (!useClientFilter) {
      setTotal(count ?? 0);
    } else if (!isReassortView) {
      setTotal(filtered.length);
      filtered = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    } else {
      setTotal(filtered.length);
    }

    setMovements(filtered);
    setLoading(false);
  }, [page, filterType, filterItem, dateFrom, dateTo, service, isReassortView]);

  useEffect(() => { load(); }, [load]);

  function toggleSession(key: string) {
    setExpandedSessions((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  async function exportCSV() {
    const supabase = createClient();
    const { data } = await supabase
      .from("stock_movements")
      .select("*, items(name, unit, cost_per_unit), profiles(display_name, email)")
      .order("created_at", { ascending: false });

    if (!data) return;

    let rows = (data as StockMovement[]);
    if (filterType !== "tous") rows = rows.filter((m) => m.type === filterType);
    if (service !== "tous") rows = rows.filter((m) => matchesService(m.created_at, service));

    const csvRows = [
      ["Date", "Service", "Type", "Article", "Quantité", "Unité", "Coût unitaire", "Coût total", "Utilisateur"],
      ...rows.map((m) => {
        const cout = m.cost_at_time ?? 0;
        return [
          formatDate(m.created_at),
          getService(m.created_at),
          movementTypeLabel(m.type),
          m.items?.name ?? "",
          m.quantity,
          m.items?.unit ?? "",
          cout.toFixed(2),
          (cout * m.quantity).toFixed(2),
          m.profiles?.display_name ?? m.profiles?.email ?? "",
        ];
      }),
    ];

    const csv = csvRows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `historique-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const reassortSessions = isReassortView ? groupReassorts(movements) : [];

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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex gap-3">
          <select
            value={filterType}
            onChange={(e) => { setFilterType(e.target.value); setPage(0); }}
            className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {MOVE_TYPES.map((t) => (
              <option key={t} value={t}>{t === "tous" ? "Tous les types" : movementTypeLabel(t)}</option>
            ))}
          </select>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["tous", "midi", "soir"] as const).map((s) => (
              <button
                key={s}
                onClick={() => { setService(s); setPage(0); }}
                className={`px-4 py-2.5 transition-colors ${
                  service === s ? "bg-amber-500 text-white" : "bg-white text-gray-600 active:bg-gray-100"
                }`}
              >
                {s === "tous" ? "Tout" : s === "midi" ? "Midi" : "Soir"}
              </button>
            ))}
          </div>
          {(filterType !== "tous" || service !== "tous" || dateFrom || dateTo || filterItem) && (
            <button
              onClick={() => { setFilterType("tous"); setService("tous"); setDateFrom(""); setDateTo(""); setFilterItem(""); setPage(0); }}
              className="text-xs px-3 py-2 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 whitespace-nowrap"
            >
              Réinitialiser
            </button>
          )}
        </div>
        <input
          type="text"
          value={filterItem}
          onChange={(e) => { setFilterItem(e.target.value); setPage(0); }}
          placeholder="Filtrer par article..."
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Du</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">Au</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner className="mt-10" />
      ) : isReassortView ? (
        /* ── Vue groupée par réassort ── */
        <div className="space-y-3">
          {reassortSessions.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-400 text-sm">
              Aucun réassort trouvé
            </div>
          )}
          {reassortSessions.map((session) => {
            const open = expandedSessions.has(session.key);
            const dateStr = new Date(session.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
            return (
              <div key={session.key} className="bg-white rounded-xl shadow-sm border border-purple-100 overflow-hidden">
                <button
                  onClick={() => toggleSession(session.key)}
                  className="w-full p-4 flex items-center justify-between gap-3 text-left"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                      session.service === "Midi" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"
                    }`}>
                      {session.service}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 capitalize">{dateStr}</p>
                      <p className="text-xs text-gray-500">
                        {session.items.length} article{session.items.length > 1 ? "s" : ""} · {session.user}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-semibold text-purple-700">{formatEur(session.totalCost)}</span>
                    {open ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                  </div>
                </button>
                {open && (
                  <div className="border-t border-purple-50 divide-y divide-gray-50">
                    {session.items.map((m) => (
                      <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{m.items?.name}</p>
                          <p className="text-xs text-gray-400">réserve → bar</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">+{m.quantity} {m.items?.unit}</p>
                          {(m.cost_at_time ?? 0) > 0 && (
                            <p className="text-xs text-gray-500">{formatEur((m.cost_at_time ?? 0) * m.quantity)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* ── Vue tableau classique ── */
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Date & heure</th>
                  <th className="px-4 py-3 text-left font-medium">Service</th>
                  <th className="px-4 py-3 text-left font-medium">Type</th>
                  <th className="px-4 py-3 text-left font-medium">Article</th>
                  <th className="px-4 py-3 text-center font-medium">Quantité</th>
                  <th className="px-4 py-3 text-right font-medium">Coût</th>
                  <th className="px-4 py-3 text-left font-medium">Utilisateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {movements.map((m) => {
                  const svc = getService(m.created_at);
                  const cout = (m.cost_at_time ?? 0) * m.quantity;
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{formatDate(m.created_at)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          svc === "Midi" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"
                        }`}>{svc}</span>
                      </td>
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
                      <td className="px-4 py-3 text-right text-gray-600">{cout > 0 ? formatEur(cout) : "—"}</td>
                      <td className="px-4 py-3 text-gray-500">{m.profiles?.display_name ?? m.profiles?.email ?? "—"}</td>
                    </tr>
                  );
                })}
                {movements.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucun mouvement trouvé</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden divide-y divide-gray-100">
            {movements.map((m) => {
              const svc = getService(m.created_at);
              const cout = (m.cost_at_time ?? 0) * m.quantity;
              return (
                <div key={m.id} className="p-4">
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${movementTypeColor(m.type)}`}>
                        {movementTypeLabel(m.type)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        svc === "Midi" ? "bg-orange-100 text-orange-700" : "bg-indigo-100 text-indigo-700"
                      }`}>{svc}</span>
                    </div>
                    <span className={`text-sm font-medium ${m.direction === "out" ? "text-red-600" : "text-green-600"}`}>
                      {m.direction === "out" ? "-" : "+"}{m.quantity} {m.items?.unit}
                    </span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">{m.items?.name}</p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
                    {cout > 0 && <p className="text-xs text-gray-500 font-medium">{formatEur(cout)}</p>}
                  </div>
                </div>
              );
            })}
            {movements.length === 0 && (
              <p className="p-8 text-center text-gray-400 text-sm">Aucun mouvement trouvé</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-4 py-3 border-t flex items-center justify-between text-sm">
              <span className="text-gray-500">Page {page + 1} / {totalPages} ({total} résultats)</span>
              <div className="flex gap-2">
                <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
                <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
                  className="p-1.5 rounded-lg border hover:bg-gray-50 disabled:opacity-40"><ChevronRight size={16} /></button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
