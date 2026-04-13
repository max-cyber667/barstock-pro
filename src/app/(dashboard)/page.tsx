import { createClient } from "@/lib/supabase/server";
import { Wine, Warehouse, TrendingDown, ArrowLeftRight, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { formatEur, formatDate, movementTypeLabel, movementTypeColor, stockStatus } from "@/lib/utils";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [
    { data: stockBar },
    { data: stockReserve },
    { data: movements },
    { data: items },
  ] = await Promise.all([
    supabase.from("stock").select("quantity, items(name, unit, min_stock_bar, cost_per_unit)").eq("location", "bar"),
    supabase.from("stock").select("quantity, items(name, unit, min_stock_reserve, cost_per_unit)").eq("location", "reserve"),
    supabase.from("stock_movements").select("*, items(name, unit), profiles(display_name, email)").order("created_at", { ascending: false }).limit(8),
    supabase.from("items").select("id"),
  ]);

  const barRows = (stockBar ?? []) as unknown as Array<{ quantity: number; items: { name: string; unit: string; min_stock_bar: number; cost_per_unit: number } }>;
  const reserveRows = (stockReserve ?? []) as unknown as Array<{ quantity: number; items: { name: string; unit: string; min_stock_reserve: number; cost_per_unit: number } }>;

  const barValue = barRows.reduce((s, r) => s + r.quantity * r.items.cost_per_unit, 0);
  const reserveValue = reserveRows.reduce((s, r) => s + r.quantity * r.items.cost_per_unit, 0);
  const barLow = barRows.filter((r) => r.items.min_stock_bar > 0 && r.quantity <= r.items.min_stock_bar).length;
  const reserveLow = reserveRows.filter((r) => r.items.min_stock_reserve > 0 && r.quantity <= r.items.min_stock_reserve).length;
  const barEmpty = barRows.filter((r) => r.quantity <= 0).length;

  const stats = [
    { label: "Valeur stock bar", value: formatEur(barValue), icon: Wine, color: "bg-amber-500", sub: `${barLow} article${barLow > 1 ? "s" : ""} en stock faible`, href: "/stock-bar" },
    { label: "Valeur réserve", value: formatEur(reserveValue), icon: Warehouse, color: "bg-indigo-500", sub: `${reserveLow} article${reserveLow > 1 ? "s" : ""} en stock faible`, href: "/stock-reserve" },
    { label: "Ruptures bar", value: String(barEmpty), icon: TrendingDown, color: "bg-red-500", sub: "articles à zéro au bar", href: "/stock-bar" },
    { label: "Articles total", value: String(items?.length ?? 0), icon: ArrowLeftRight, color: "bg-green-500", sub: "produits dans le catalogue", href: "/articles" },
  ];

  const alertRows = [
    ...barRows
      .filter((r) => r.items.min_stock_bar > 0 && r.quantity <= r.items.min_stock_bar)
      .map((r) => ({ name: r.items.name, qty: r.quantity, threshold: r.items.min_stock_bar, unit: r.items.unit, location: "Bar" })),
    ...reserveRows
      .filter((r) => r.items.min_stock_reserve > 0 && r.quantity <= r.items.min_stock_reserve)
      .map((r) => ({ name: r.items.name, qty: r.quantity, threshold: r.items.min_stock_reserve, unit: r.items.unit, location: "Réserve" })),
  ].slice(0, 6);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-500 text-sm mt-0.5">Vue d&apos;ensemble de votre stock</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`inline-flex p-2 rounded-lg ${s.color} mb-3`}>
                <Icon size={18} className="text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
              <p className="text-xs text-gray-400 mt-1">{s.sub}</p>
            </Link>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {alertRows.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle size={18} className="text-yellow-500" />
              <h2 className="font-semibold text-gray-900">Alertes stock faible</h2>
            </div>
            <div className="space-y-2">
              {alertRows.map((a, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium text-gray-800">{a.name}</span>
                    <span className="ml-2 text-xs text-gray-500">{a.location}</span>
                  </div>
                  <span className={`font-medium ${stockStatus(a.qty, a.threshold) === "empty" ? "text-red-600" : "text-yellow-600"}`}>
                    {a.qty} {a.unit}
                  </span>
                </div>
              ))}
            </div>
            <Link href="/reassort" className="mt-3 block text-center text-sm text-indigo-600 hover:underline font-medium">
              Faire un réassort →
            </Link>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h2 className="font-semibold text-gray-900 mb-3">Derniers mouvements</h2>
          <div className="space-y-2">
            {(movements ?? []).map((m: {
              id: string;
              type: string;
              quantity: number;
              direction: string;
              created_at: string;
              items: { name: string; unit: string } | null;
              profiles: { display_name: string | null; email: string } | null;
            }) => (
              <div key={m.id} className="flex items-center justify-between gap-2 text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium shrink-0 ${movementTypeColor(m.type)}`}>
                    {movementTypeLabel(m.type)}
                  </span>
                  <span className="text-gray-700 truncate">{m.items?.name}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-medium ${m.direction === "out" ? "text-red-600" : "text-green-600"}`}>
                    {m.direction === "out" ? "-" : "+"}{m.quantity} {m.items?.unit}
                  </span>
                  <p className="text-xs text-gray-400">{formatDate(m.created_at)}</p>
                </div>
              </div>
            ))}
            {!movements?.length && (
              <p className="text-sm text-gray-400 text-center py-4">Aucun mouvement</p>
            )}
          </div>
          <Link href="/historique" className="mt-3 block text-center text-sm text-indigo-600 hover:underline font-medium">
            Voir tout l&apos;historique →
          </Link>
        </div>
      </div>
    </div>
  );
}
