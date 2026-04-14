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
import { useState } from "react";

type Cocktail = {
  nom: string;
  categorie: string;
  cout: number;
  prixHH: number;
  prixPlein: number;
};

const COCKTAILS: Cocktail[] = [
  // Havana Club
  { nom: "Cuba Libre", categorie: "Havana Club", cout: 1.28, prixHH: 6.9, prixPlein: 10 },
  { nom: "Mojito Classic", categorie: "Havana Club", cout: 1.45, prixHH: 6.9, prixPlein: 10 },
  { nom: "Mojito Fruits Rouges", categorie: "Havana Club", cout: 1.72, prixHH: 6.9, prixPlein: 10 },
  { nom: "Dark & Stormy", categorie: "Havana Club", cout: 1.63, prixHH: 6.9, prixPlein: 10 },
  { nom: "Ti Punch", categorie: "Havana Club", cout: 1.18, prixHH: 6.9, prixPlein: 10 },

  // Spritz
  { nom: "Aperol Spritz", categorie: "Spritz", cout: 1.42, prixHH: 6.9, prixPlein: 10 },
  { nom: "Hugo Spritz", categorie: "Spritz", cout: 1.35, prixHH: 6.9, prixPlein: 10 },
  { nom: "Limoncello Spritz", categorie: "Spritz", cout: 1.55, prixHH: 6.9, prixPlein: 10 },

  // Classic Indiana
  { nom: "Gin Tonic", categorie: "Classic Indiana", cout: 1.78, prixHH: 6.9, prixPlein: 10 },
  { nom: "Moscow Mule", categorie: "Classic Indiana", cout: 1.82, prixHH: 6.9, prixPlein: 10 },
  { nom: "Cosmopolitan", categorie: "Classic Indiana", cout: 1.65, prixHH: 6.9, prixPlein: 10 },
  { nom: "Sex on the Beach", categorie: "Classic Indiana", cout: 1.55, prixHH: 6.9, prixPlein: 10 },
  { nom: "Tequila Sunrise", categorie: "Classic Indiana", cout: 1.38, prixHH: 6.9, prixPlein: 10 },

  // Absolut
  { nom: "Absolut Cranberry", categorie: "Absolut", cout: 1.42, prixHH: 6.9, prixPlein: 10 },
  { nom: "Absolut Citron", categorie: "Absolut", cout: 1.38, prixHH: 6.9, prixPlein: 10 },
  { nom: "Blue Lagoon", categorie: "Absolut", cout: 1.48, prixHH: 6.9, prixPlein: 10 },

  // Frozen
  { nom: "Frozen Mojito", categorie: "Frozen", cout: 1.62, prixHH: 7.5, prixPlein: 10 },
  { nom: "Frozen Margarita", categorie: "Frozen", cout: 1.58, prixHH: 7.5, prixPlein: 10 },
  { nom: "Frozen Colada", categorie: "Frozen", cout: 1.75, prixHH: 7.5, prixPlein: 10 },

  // Indiana Mix
  { nom: "Indiana Soleil", categorie: "Indiana Mix", cout: 1.02, prixHH: 6.9, prixPlein: 10 },
  { nom: "Long Island", categorie: "Indiana Mix", cout: 2.15, prixHH: 6.9, prixPlein: 10 },
  { nom: "Indiana Tropicale", categorie: "Indiana Mix", cout: 1.35, prixHH: 6.9, prixPlein: 10 },

  // XXL
  { nom: "XL Cuba Libre", categorie: "XXL", cout: 2.02, prixHH: 10, prixPlein: 10 },
  { nom: "XL Mojito", categorie: "XXL", cout: 2.18, prixHH: 10, prixPlein: 10 },
  { nom: "XL Gin Tonic", categorie: "XXL", cout: 2.65, prixHH: 10, prixPlein: 10 },

  // Mocktails
  { nom: "Virgin Mojito", categorie: "Mocktails", cout: 0.72, prixHH: 6.9, prixPlein: 6.9 },
  { nom: "Sunrise Tropical", categorie: "Mocktails", cout: 0.85, prixHH: 6.9, prixPlein: 6.9 },
  { nom: "Limonade Maison", categorie: "Mocktails", cout: 0.65, prixHH: 6.9, prixPlein: 6.9 },

  // Smoothies
  { nom: "Smoothie Fraise", categorie: "Smoothies", cout: 1.45, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Smoothie Mangue", categorie: "Smoothies", cout: 1.52, prixHH: 7.5, prixPlein: 7.5 },
  { nom: "Milkshake Vanille", categorie: "Smoothies", cout: 1.38, prixHH: 7.5, prixPlein: 7.5 },

  // Hot
  { nom: "Café Irlandais", categorie: "Hot", cout: 1.85, prixHH: 7.5, prixPlein: 9 },
  { nom: "Thé Rhum", categorie: "Hot", cout: 1.42, prixHH: 7.5, prixPlein: 9 },
];

const CATEGORIE_COLORS: Record<string, string> = {
  "Havana Club": "#f59e0b",
  "Spritz": "#f97316",
  "Classic Indiana": "#6366f1",
  "Absolut": "#3b82f6",
  "Frozen": "#06b6d4",
  "Indiana Mix": "#8b5cf6",
  "XXL": "#dc2626",
  "Mocktails": "#10b981",
  "Smoothies": "#ec4899",
  "Hot": "#78716c",
};

const TOUTES_CATEGORIES = ["Toutes", ...Object.keys(CATEGORIE_COLORS)];

function formatEur(v: number) {
  return v.toFixed(2).replace(".", ",") + " €";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Cocktail;
  const margePlein = ((d.prixPlein - d.cout) / d.prixPlein) * 100;
  const margeHH = ((d.prixHH - d.cout) / d.prixHH) * 100;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{d.nom}</p>
      <p className="text-gray-500 text-xs mb-2">{d.categorie}</p>
      <div className="space-y-1">
        <p><span className="text-gray-600">Coût :</span> <span className="font-medium text-red-600">{formatEur(d.cout)}</span></p>
        <p><span className="text-gray-600">Prix HH :</span> <span className="font-medium">{formatEur(d.prixHH)}</span> <span className="text-green-600">({margeHH.toFixed(0)}% marge)</span></p>
        <p><span className="text-gray-600">Prix plein :</span> <span className="font-medium">{formatEur(d.prixPlein)}</span> <span className="text-green-600">({margePlein.toFixed(0)}% marge)</span></p>
      </div>
    </div>
  );
}

export default function CocktailsPage() {
  const [categorie, setCategorie] = useState("Toutes");
  const [tri, setTri] = useState<"nom" | "cout" | "marge">("cout");

  const filtered = COCKTAILS.filter(
    (c) => categorie === "Toutes" || c.categorie === categorie
  );

  const sorted = [...filtered].sort((a, b) => {
    if (tri === "cout") return a.cout - b.cout;
    if (tri === "marge") return (b.prixPlein - b.cout) / b.prixPlein - (a.prixPlein - a.cout) / a.prixPlein;
    return a.nom.localeCompare(b.nom);
  });

  const avgCout = filtered.reduce((s, c) => s + c.cout, 0) / filtered.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coûts cocktails</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          Analyse basée sur les fiches techniques Indiana Café 2026
        </p>
      </div>

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
            style={
              categorie === cat && cat !== "Toutes"
                ? { backgroundColor: CATEGORIE_COLORS[cat] }
                : {}
            }
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          {(["cout", "marge", "nom"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTri(t)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                tri === t ? "bg-indigo-600 text-white" : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {t === "cout" ? "↑ Coût" : t === "marge" ? "↓ Marge" : "A-Z"}
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
            <BarChart
              data={sorted}
              layout="vertical"
              margin={{ top: 0, right: 60, left: 120, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                tickFormatter={(v) => `${v.toFixed(2)}€`}
                domain={[0, 3]}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                dataKey="nom"
                type="category"
                tick={{ fontSize: 12 }}
                width={115}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                x={avgCout}
                stroke="#94a3b8"
                strokeDasharray="4 4"
                label={{ value: "Moy.", position: "top", fontSize: 10, fill: "#94a3b8" }}
              />
              <Bar dataKey="cout" radius={[0, 4, 4, 0]}>
                {sorted.map((entry) => (
                  <Cell
                    key={entry.nom}
                    fill={CATEGORIE_COLORS[entry.categorie] ?? "#6366f1"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tableau récapitulatif */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Détail des marges</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Cocktail</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Catégorie</th>
                <th className="text-right px-4 py-3">Coût</th>
                <th className="text-right px-4 py-3">Prix HH</th>
                <th className="text-right px-4 py-3">Marge HH</th>
                <th className="text-right px-4 py-3">Prix plein</th>
                <th className="text-right px-4 py-3">Marge plein</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {sorted.map((c) => {
                const margeHH = ((c.prixHH - c.cout) / c.prixHH) * 100;
                const margePlein = ((c.prixPlein - c.cout) / c.prixPlein) * 100;
                return (
                  <tr key={c.nom} className="hover:bg-gray-50">
                    <td className="px-4 py-2.5 font-medium text-gray-900">{c.nom}</td>
                    <td className="px-4 py-2.5 hidden sm:table-cell">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs text-white font-medium"
                        style={{ backgroundColor: CATEGORIE_COLORS[c.categorie] ?? "#6366f1" }}
                      >
                        {c.categorie}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-medium text-red-600">{formatEur(c.cout)}</td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{formatEur(c.prixHH)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${margeHH >= 80 ? "text-green-600" : margeHH >= 70 ? "text-yellow-600" : "text-red-600"}`}>
                        {margeHH.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-700">{formatEur(c.prixPlein)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={`font-medium ${margePlein >= 85 ? "text-green-600" : margePlein >= 75 ? "text-yellow-600" : "text-red-600"}`}>
                        {margePlein.toFixed(1)}%
                      </span>
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
