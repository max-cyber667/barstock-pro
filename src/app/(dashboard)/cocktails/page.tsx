"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from "recharts";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { FlaskConical, RefreshCw } from "lucide-react";

type Cocktail = {
  nom: string;
  categorie: string;
  cout: number;
  prixHH: number;
  prixPlein: number;
};

type Ingredient = {
  item: string;   // nom exact dans la DB
  qty: number;    // quantité nécessaire dans l'unité DB (ex: 0.04 = 4cl sur une bouteille 100cl)
};

// ── Données cocktails ────────────────────────────────────────────────────────
const COCKTAILS: Cocktail[] = [
  { nom: "Cuba Libre",           categorie: "Havana Club",     cout: 1.28, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Mojito Classic",       categorie: "Havana Club",     cout: 1.45, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Mojito Fruits Rouges", categorie: "Havana Club",     cout: 1.72, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Dark & Stormy",        categorie: "Havana Club",     cout: 1.63, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Ti Punch",             categorie: "Havana Club",     cout: 1.18, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Aperol Spritz",        categorie: "Spritz",          cout: 1.42, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Hugo Spritz",          categorie: "Spritz",          cout: 1.35, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Limoncello Spritz",    categorie: "Spritz",          cout: 1.55, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Gin Tonic",            categorie: "Classic Indiana", cout: 1.78, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Moscow Mule",          categorie: "Classic Indiana", cout: 1.82, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Cosmopolitan",         categorie: "Classic Indiana", cout: 1.65, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Sex on the Beach",     categorie: "Classic Indiana", cout: 1.55, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Tequila Sunrise",      categorie: "Classic Indiana", cout: 1.38, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Absolut Cranberry",    categorie: "Absolut",         cout: 1.42, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Absolut Citron",       categorie: "Absolut",         cout: 1.38, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Blue Lagoon",          categorie: "Absolut",         cout: 1.48, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Frozen Mojito",        categorie: "Frozen",          cout: 1.62, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Frozen Margarita",     categorie: "Frozen",          cout: 1.58, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Frozen Colada",        categorie: "Frozen",          cout: 1.75, prixHH: 7.5,  prixPlein: 10 },
  { nom: "Indiana Soleil",       categorie: "Indiana Mix",     cout: 1.02, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Long Island",          categorie: "Indiana Mix",     cout: 2.15, prixHH: 6.9,  prixPlein: 10 },
  { nom: "Indiana Tropicale",    categorie: "Indiana Mix",     cout: 1.35, prixHH: 6.9,  prixPlein: 10 },
  { nom: "XL Cuba Libre",        categorie: "XXL",             cout: 2.02, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Mojito",            categorie: "XXL",             cout: 2.18, prixHH: 10,   prixPlein: 10 },
  { nom: "XL Gin Tonic",         categorie: "XXL",             cout: 2.65, prixHH: 10,   prixPlein: 10 },
  { nom: "Virgin Mojito",        categorie: "Mocktails",       cout: 0.72, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Sunrise Tropical",     categorie: "Mocktails",       cout: 0.85, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Limonade Maison",      categorie: "Mocktails",       cout: 0.65, prixHH: 6.9,  prixPlein: 6.9 },
  { nom: "Smoothie Fraise",      categorie: "Smoothies",       cout: 1.45, prixHH: 7.5,  prixPlein: 7.5 },
  { nom: "Smoothie Mangue",      categorie: "Smoothies",       cout: 1.52, prixHH: 7.5,  prixPlein: 7.5 },
  { nom: "Milkshake Vanille",    categorie: "Smoothies",       cout: 1.38, prixHH: 7.5,  prixPlein: 7.5 },
  { nom: "Café Irlandais",       categorie: "Hot",             cout: 1.85, prixHH: 7.5,  prixPlein: 9 },
  { nom: "Thé Rhum",             categorie: "Hot",             cout: 1.42, prixHH: 7.5,  prixPlein: 9 },
];

// ── Recettes (qty = fraction de l'unité DB) ──────────────────────────────────
// Bouteille 100cl → 4cl = 0.04 | Bouteille 70cl → 4cl = 4/70 | BIB (L) → 20cl = 0.20
const RECIPES: Record<string, Ingredient[]> = {
  "Cuba Libre": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "BIB Coca-Cola 19L",       qty: 0.20 },
  ],
  "Mojito Classic": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "Purée Mojito",            qty: 0.06 },
    { item: "Sirop Sucre de Canne",    qty: 0.015 },
  ],
  "Mojito Fruits Rouges": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "Purée Mojito",            qty: 0.04 },
    { item: "Purée Summer Berries",    qty: 0.03 },
    { item: "Sirop Sucre de Canne",    qty: 0.015 },
  ],
  "Dark & Stormy": [
    { item: "Rhum Ambré Havana Añejo", qty: 0.04 },
    { item: "Ginger Beer",             qty: 1 },
    { item: "Sirop Citron",            qty: 0.015 },
  ],
  "Ti Punch": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.05 },
    { item: "Sirop Sucre de Canne",    qty: 0.01 },
  ],
  "Aperol Spritz": [
    { item: "Aperol",                  qty: 0.06 },
    { item: "Prosecco DOC Riccadonna", qty: 9 / 75 },
  ],
  "Hugo Spritz": [
    { item: "Prosecco DOC Riccadonna", qty: 9 / 75 },
    { item: "Liqueur Fleur de Sureau", qty: 2 / 70 },
  ],
  "Limoncello Spritz": [
    { item: "Prosecco DOC Riccadonna",   qty: 9 / 75 },
    { item: "Limoncello Rama d'Oro 70CL", qty: 4 / 70 },
  ],
  "Gin Tonic": [
    { item: "Gin Beefeater",        qty: 0.04 },
    { item: "BIB Finley Tonic 5L",  qty: 0.15 },
  ],
  "Moscow Mule": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Ginger Beer",         qty: 1 },
  ],
  "Cosmopolitan": [
    { item: "Vodka Absolut Bleue",  qty: 0.04 },
    { item: "Curaçao Triple Sec",   qty: 2 / 70 },
    { item: "Nectar Cranberry",     qty: 0.04 },
    { item: "Nectar Citron Vert",   qty: 0.015 },
  ],
  "Sex on the Beach": [
    { item: "Vodka Absolut Bleue",    qty: 0.04 },
    { item: "Mix Sex on the Beach",   qty: 0.12 },
    { item: "Jus d'Ananas",           qty: 0.04 },
  ],
  "Tequila Sunrise": [
    { item: "Tequila Jose Cuervo", qty: 4 / 70 },
    { item: "Jus d'Orange",        qty: 0.10 },
    { item: "Sirop Grenadine",     qty: 0.01 },
  ],
  "Absolut Cranberry": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Nectar Cranberry",    qty: 0.12 },
  ],
  "Absolut Citron": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Sirop Citron",        qty: 0.02 },
    { item: "BIB Sprite 5L",       qty: 0.10 },
  ],
  "Blue Lagoon": [
    { item: "Vodka Absolut Bleue", qty: 0.04 },
    { item: "Curaçao Bleu",        qty: 2 / 70 },
    { item: "BIB Sprite 5L",       qty: 0.10 },
  ],
  "Frozen Mojito": [
    { item: "Rhum Blanc Havana 3 Ans",    qty: 0.04 },
    { item: "Purée Mojito",               qty: 0.10 },
    { item: "Island Oasis Ice Cream Base", qty: 0.05 },
  ],
  "Frozen Margarita": [
    { item: "Tequila Jose Cuervo",        qty: 4 / 70 },
    { item: "Purée Margarita",            qty: 0.10 },
    { item: "Island Oasis Ice Cream Base", qty: 0.05 },
  ],
  "Frozen Colada": [
    { item: "Rhum Blanc Havana 3 Ans",    qty: 0.04 },
    { item: "Smoothie Piña Colada",       qty: 0.15 },
    { item: "Island Oasis Ice Cream Base", qty: 0.05 },
  ],
  "Indiana Soleil": [
    { item: "Rhum Blanc Havana 3 Ans",   qty: 0.04 },
    { item: "Jus d'Ananas",              qty: 0.06 },
    { item: "Sirop Grenadine",           qty: 0.01 },
    { item: "Soda Pamplemousse La French", qty: 0.05 },
  ],
  "Long Island": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.015 },
    { item: "Vodka Absolut Bleue",     qty: 0.015 },
    { item: "Gin Beefeater",           qty: 0.015 },
    { item: "Tequila Jose Cuervo",     qty: 1.5 / 70 },
    { item: "Curaçao Triple Sec",      qty: 1.5 / 70 },
    { item: "BIB Coca-Cola 19L",       qty: 0.05 },
  ],
  "Indiana Tropicale": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.04 },
    { item: "Purée Fruits Exotiques",  qty: 0.06 },
    { item: "Jus d'Ananas",            qty: 0.04 },
    { item: "Sirop Grenadine",         qty: 0.01 },
  ],
  "XL Cuba Libre": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.06 },
    { item: "BIB Coca-Cola 19L",       qty: 0.30 },
  ],
  "XL Mojito": [
    { item: "Rhum Blanc Havana 3 Ans", qty: 0.06 },
    { item: "Purée Mojito",            qty: 0.09 },
    { item: "Sirop Sucre de Canne",    qty: 0.02 },
  ],
  "XL Gin Tonic": [
    { item: "Gin Beefeater",       qty: 0.06 },
    { item: "BIB Finley Tonic 5L", qty: 0.25 },
  ],
  "Virgin Mojito": [
    { item: "Purée Mojito",         qty: 0.06 },
    { item: "Sirop Sucre de Canne", qty: 0.015 },
  ],
  "Sunrise Tropical": [
    { item: "Jus d'Ananas",     qty: 0.08 },
    { item: "Purée de Passion", qty: 0.04 },
    { item: "Sirop Grenadine",  qty: 0.01 },
  ],
  "Limonade Maison": [
    { item: "Sirop Citron",  qty: 0.03 },
    { item: "BIB Sprite 5L", qty: 0.20 },
  ],
  "Smoothie Fraise": [
    { item: "Ravifruit Fraise",           qty: 0.10 },
    { item: "Island Oasis Ice Cream Base", qty: 0.05 },
  ],
  "Smoothie Mangue": [
    { item: "Purée Fruits Exotiques",     qty: 0.10 },
    { item: "Island Oasis Ice Cream Base", qty: 0.05 },
  ],
  "Milkshake Vanille": [
    { item: "Island Oasis Ice Cream Base", qty: 0.15 },
  ],
  "Café Irlandais": [
    { item: "Whisky Bushmill Original", qty: 4 / 70 },
  ],
  "Thé Rhum": [
    { item: "Rhum Ambré Havana Añejo", qty: 0.04 },
  ],
};

// ── Couleurs catégories ──────────────────────────────────────────────────────
const CATEGORIE_COLORS: Record<string, string> = {
  "Havana Club":     "#f59e0b",
  "Spritz":          "#f97316",
  "Classic Indiana": "#6366f1",
  "Absolut":         "#3b82f6",
  "Frozen":          "#06b6d4",
  "Indiana Mix":     "#8b5cf6",
  "XXL":             "#dc2626",
  "Mocktails":       "#10b981",
  "Smoothies":       "#ec4899",
  "Hot":             "#78716c",
};

const TOUTES_CATEGORIES = ["Toutes", ...Object.keys(CATEGORIE_COLORS)];

function formatEur(v: number) {
  return v.toFixed(2).replace(".", ",") + " €";
}

function realisableColor(n: number) {
  if (n === 0) return "text-red-600 bg-red-50";
  if (n < 5)  return "text-orange-600 bg-orange-50";
  if (n < 15) return "text-yellow-600 bg-yellow-50";
  return "text-green-700 bg-green-50";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Cocktail & { realisable?: number };
  const margePlein = ((d.prixPlein - d.cout) / d.prixPlein) * 100;
  const margeHH    = ((d.prixHH   - d.cout) / d.prixHH)    * 100;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{d.nom}</p>
      <p className="text-gray-500 text-xs mb-2">{d.categorie}</p>
      <div className="space-y-1">
        <p><span className="text-gray-600">Coût :</span> <span className="font-medium text-red-600">{formatEur(d.cout)}</span></p>
        <p><span className="text-gray-600">Prix HH :</span> <span className="font-medium">{formatEur(d.prixHH)}</span> <span className="text-green-600">({margeHH.toFixed(0)}%)</span></p>
        <p><span className="text-gray-600">Prix plein :</span> <span className="font-medium">{formatEur(d.prixPlein)}</span> <span className="text-green-600">({margePlein.toFixed(0)}%)</span></p>
        {d.realisable !== undefined && (
          <p className="pt-1 border-t border-gray-100">
            <span className="text-gray-600">Réalisables : </span>
            <span className={`font-bold px-1.5 py-0.5 rounded text-xs ${realisableColor(d.realisable)}`}>
              {d.realisable}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

export default function CocktailsPage() {
  const [categorie, setCategorie]   = useState("Toutes");
  const [tri, setTri]               = useState<"nom" | "cout" | "marge" | "realisable">("cout");
  const [stockMap, setStockMap]     = useState<Map<string, number>>(new Map());
  const [loading, setLoading]       = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  async function fetchStock() {
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("stock")
      .select("quantity, items(name)")
      .eq("location", "bar");

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
    if (!recipe || recipe.length === 0) return -1; // pas de recette
    let min = Infinity;
    for (const ing of recipe) {
      const stock = stockMap.get(ing.item) ?? 0;
      const possible = Math.floor(stock / ing.qty);
      if (possible < min) min = possible;
    }
    return min === Infinity ? 0 : min;
  }

  const filtered = COCKTAILS.filter(
    (c) => categorie === "Toutes" || c.categorie === categorie
  ).map((c) => ({ ...c, realisable: loading ? undefined : getRealisable(c.nom) }));

  const sorted = [...filtered].sort((a, b) => {
    if (tri === "cout")       return a.cout - b.cout;
    if (tri === "marge")      return (b.prixPlein - b.cout) / b.prixPlein - (a.prixPlein - a.cout) / a.prixPlein;
    if (tri === "realisable") return (b.realisable ?? 0) - (a.realisable ?? 0);
    return a.nom.localeCompare(b.nom);
  });

  const avgCout = filtered.reduce((s, c) => s + c.cout, 0) / filtered.length;

  // stats rapides
  const disponibles  = filtered.filter((c) => (c.realisable ?? 0) > 0).length;
  const enRupture    = filtered.filter((c) => c.realisable === 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Coûts cocktails</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Analyse basée sur les fiches techniques Indiana Café 2026
          </p>
        </div>
        <button
          onClick={fetchStock}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser
        </button>
      </div>

      {/* KPIs réalisables */}
      {!loading && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-green-700">{disponibles}</p>
            <p className="text-xs text-green-600 mt-0.5">Cocktails disponibles</p>
          </div>
          <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-red-600">{enRupture}</p>
            <p className="text-xs text-red-500 mt-0.5">En rupture de stock</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-gray-900">{filtered.length}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total cocktails</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {TOUTES_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategorie(cat)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              categorie === cat
                ? "bg-slate-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
            style={categorie === cat && cat !== "Toutes" ? { backgroundColor: CATEGORIE_COLORS[cat] } : {}}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto flex gap-2 flex-wrap">
          {(["realisable", "cout", "marge", "nom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTri(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                tri === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {t === "cout" ? "↑ Coût" : t === "marge" ? "↓ Marge" : t === "realisable" ? "↓ Réalisables" : "A-Z"}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Coût de revient par cocktail</h2>
          <span className="text-sm text-gray-500">Moy. : <span className="font-medium text-gray-800">{formatEur(avgCout)}</span></span>
        </div>
        <div style={{ height: Math.max(300, sorted.length * 28) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 60, left: 120, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tickFormatter={(v) => `${v.toFixed(2)}€`} domain={[0, 3]} tick={{ fontSize: 11 }} />
              <YAxis dataKey="nom" type="category" tick={{ fontSize: 12 }} width={115} />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine x={avgCout} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: "Moy.", position: "top", fontSize: 10, fill: "#94a3b8" }} />
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {sorted.map((entry) => (
                  <Cell key={entry.nom} fill={CATEGORIE_COLORS[entry.categorie] ?? "#6366f1"} opacity={entry.realisable === 0 ? 0.3 : 1} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {!loading && <p className="text-xs text-gray-400 mt-2 text-center">Barres transparentes = rupture de stock bar</p>}
      </div>

      {/* Tableau récapitulatif */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Détail des marges & stock</h2>
          {lastRefresh && (
            <span className="text-xs text-gray-400">
              Mis à jour à {lastRefresh.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Cocktail</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3">Coût</th>
                <th className="text-right px-4 py-3">Marge HH</th>
                <th className="text-right px-4 py-3">Marge plein</th>
                <th className="text-right px-4 py-3">
                  <span className="flex items-center justify-end gap-1">
                    <FlaskConical size={12} />
                    Réalisables
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((c) => {
                const margeHH    = ((c.prixHH    - c.cout) / c.prixHH)    * 100;
                const margePlein = ((c.prixPlein - c.cout) / c.prixPlein) * 100;
                return (
                  <tr key={c.nom} className={`hover:bg-gray-50 ${c.realisable === 0 ? "opacity-50" : ""}`}>
                    <td className="px-4 py-2.5 font-medium text-gray-900">{c.nom}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span className="px-2 py-0.5 rounded-full text-xs text-white font-medium" style={{ backgroundColor: CATEGORIE_COLORS[c.categorie] ?? "#6366f1" }}>
                        {c.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">{formatEur(c.cout)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${margeHH >= 80 ? "text-green-600" : margeHH >= 70 ? "text-yellow-600" : "text-red-600"}`}>
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
                        <span className="text-gray-300">—</span>
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
