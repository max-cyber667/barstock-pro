"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from "recharts";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FlaskConical, RefreshCw, AlertTriangle } from "lucide-react";
import { COCKTAILS, RECIPES, CATEGORIE_COLORS, type Cocktail } from "./data";

const TOUTES_CATEGORIES = ["Toutes", ...Object.keys(CATEGORIE_COLORS)];

function formatEur(v: number) { return v.toFixed(2).replace(".", ",") + " €"; }

function realisableColor(n: number) {
  if (n === 0) return "text-red-600 bg-red-50";
  if (n < 5)   return "text-orange-600 bg-orange-50";
  if (n < 15)  return "text-yellow-600 bg-yellow-50";
  return "text-green-700 bg-green-50";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Cocktail & { realisable?: number };
  const margePlein = ((d.prixPlein - d.cout) / d.prixPlein) * 100;
  const margeHH    = ((d.prixHH   - d.cout) / d.prixHH)    * 100;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm min-w-[180px]">
      <p className="font-semibold text-gray-900 mb-1">{d.nom}</p>
      <p className="text-gray-500 text-xs mb-2">{d.categorie}</p>
      <div className="space-y-1 text-xs">
        <p><span className="text-gray-600">Coût :</span> <span className="font-medium text-red-600">{formatEur(d.cout)}</span></p>
        <p><span className="text-gray-600">Prix HH :</span> <span className="font-medium">{formatEur(d.prixHH)}</span> <span className="text-green-600">({margeHH.toFixed(0)}%)</span></p>
        <p><span className="text-gray-600">Prix plein :</span> <span className="font-medium">{formatEur(d.prixPlein)}</span> <span className="text-green-600">({margePlein.toFixed(0)}%)</span></p>
        {d.realisable !== undefined && (
          <p className="pt-1 border-t border-gray-100">
            <span className="text-gray-600">Réalisables : </span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${realisableColor(d.realisable)}`}>{d.realisable}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function CocktailsPage() {
  const [categorie, setCategorie]     = useState("Toutes");
  const [tri, setTri]                 = useState<"cout" | "marge" | "realisable" | "nom">("cout");
  const [stockMap, setStockMap]       = useState<Map<string, number>>(new Map());
  const [loading, setLoading]         = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchStock() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.from("stock").select("quantity, items(name)").eq("location", "bar");
    const map = new Map<string, number>();
    for (const row of data ?? []) {
      const item = row.items as unknown as { name: string } | null;
      if (item?.name) map.set(item.name, (map.get(item.name) ?? 0) + (row.quantity ?? 0));
    }
    setStockMap(map);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => { fetchStock(); }, []);

  function getRealisable(nom: string): number {
    const recipe = RECIPES[nom];
    if (!recipe?.length) return -1;
    let min = Infinity;
    for (const ing of recipe) {
      const stock = stockMap.get(ing.item) ?? 0;
      const possible = Math.floor(stock / ing.qty);
      if (possible < min) min = possible;
    }
    return min === Infinity ? 0 : min;
  }

  const filtered = COCKTAILS
    .filter((c) => categorie === "Toutes" || c.categorie === categorie)
    .map((c) => ({ ...c, realisable: loading ? undefined : getRealisable(c.nom) }));

  const sorted = [...filtered].sort((a, b) => {
    if (tri === "cout")       return a.cout - b.cout;
    if (tri === "marge")      return (b.prixPlein - b.cout) / b.prixPlein - (a.prixPlein - a.cout) / a.prixPlein;
    if (tri === "realisable") return (b.realisable ?? 0) - (a.realisable ?? 0);
    return a.nom.localeCompare(b.nom);
  });

  const avgCout      = filtered.reduce((s, c) => s + c.cout, 0) / (filtered.length || 1);
  const disponibles  = filtered.filter((c) => (c.realisable ?? 0) > 0).length;
  const enRupture    = filtered.filter((c) => c.realisable === 0).length;

  // cocktails avec marge HH < 75% (à surveiller)
  const alertes = filtered.filter((c) => ((c.prixHH - c.cout) / c.prixHH) * 100 < 75);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cocktails</h1>
          <p className="text-gray-500 text-sm mt-0.5">Fiches techniques Indiana Café 2026 — {COCKTAILS.length} recettes</p>
        </div>
        <button onClick={fetchStock} disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* Alertes marge */}
      {alertes.length > 0 && (
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-3 flex items-start gap-2 text-sm">
          <AlertTriangle size={16} className="text-orange-500 mt-0.5 shrink-0" />
          <div>
            <span className="font-medium text-orange-800">{alertes.length} cocktail{alertes.length > 1 ? "s" : ""} avec marge HH &lt; 75% :</span>
            <span className="text-orange-700 ml-1">{alertes.map(c => c.nom).join(", ")}</span>
          </div>
        </div>
      )}

      {/* KPIs stock */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{disponibles}</p>
            <p className="text-xs text-green-600 mt-0.5">Disponibles</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{enRupture}</p>
            <p className="text-xs text-red-500 mt-0.5">Rupture stock</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{formatEur(avgCout)}</p>
            <p className="text-xs text-gray-500 mt-0.5">Coût moyen</p>
          </div>
        </div>
      )}

      {/* Filtres catégorie */}
      <div className="flex flex-wrap gap-2">
        {TOUTES_CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategorie(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categorie === cat ? "text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={categorie === cat ? { backgroundColor: cat === "Toutes" ? "#1e293b" : CATEGORIE_COLORS[cat] } : {}}>
            {cat}
          </button>
        ))}
        <div className="ml-auto flex gap-2 flex-wrap">
          {(["realisable", "cout", "marge", "nom"] as const).map((t) => (
            <button key={t} onClick={() => setTri(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${tri === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"}`}>
              {t === "cout" ? "↑ Coût" : t === "marge" ? "↓ Marge" : t === "realisable" ? "↓ Stock" : "A-Z"}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Coût de revient</h2>
          <span className="text-sm text-gray-500">Moy. <span className="font-medium text-gray-800">{formatEur(avgCout)}</span></span>
        </div>
        <div style={{ height: Math.max(300, sorted.length * 26) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 55, left: 140, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v.toFixed(2)}€`} domain={[0, "auto"]} tick={{ fontSize: 10 }} />
              <YAxis dataKey="nom" type="category" tick={{ fontSize: 11 }} width={135} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={avgCout} stroke="#94a3b8" strokeDasharray="4 4" />
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.nom} fill={CATEGORIE_COLORS[entry.categorie] ?? "#6366f1"} opacity={entry.realisable === 0 ? 0.25 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!loading && <p className="text-xs text-gray-400 mt-1 text-center">Barres transparentes = rupture de stock bar</p>}
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Marges & disponibilités</h2>
          {lastRefresh && <span className="text-xs text-gray-400">Stock à {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Cocktail</th>
                <th className="text-left px-4 py-3 hidden md:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3">Coût</th>
                <th className="text-right px-4 py-3 hidden sm:table-cell">Marge HH</th>
                <th className="text-right px-4 py-3">Marge plein</th>
                <th className="text-right px-4 py-3">
                  <span className="flex items-center justify-end gap-1"><FlaskConical size={11} />Réalisables</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((c) => {
                const margeHH    = ((c.prixHH    - c.cout) / c.prixHH)    * 100;
                const margePlein = ((c.prixPlein - c.cout) / c.prixPlein) * 100;
                const low = margeHH < 75;
                return (
                  <tr key={c.nom} className={`hover:bg-gray-50 ${c.realisable === 0 ? "opacity-40" : ""}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">
                      {c.nom}
                      {low && <span className="ml-1 text-xs text-orange-500">⚠</span>}
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs text-white font-medium" style={{ backgroundColor: CATEGORIE_COLORS[c.categorie] ?? "#6366f1" }}>
                        {c.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">{formatEur(c.cout)}</td>
                    <td className="px-4 py-2.5 text-right hidden sm:table-cell">
                      <span className={`font-medium ${margeHH >= 80 ? "text-green-600" : margeHH >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {margeHH.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${margePlein >= 85 ? "text-green-600" : margePlein >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {margePlein.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {loading ? (
                        <span className="inline-block w-8 h-4 bg-gray-100 rounded animate-pulse" />
                      ) : c.realisable === undefined || c.realisable < 0 ? (
                        <span className="text-gray-300 text-xs">—</span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${realisableColor(c.realisable)}`}>
                          {c.realisable}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
