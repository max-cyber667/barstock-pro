"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, Minus, Plus, Search, ChevronDown, ChevronRight, ScanLine } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { COCKTAILS, RECIPES, CATEGORIE_COLORS } from "../../../(dashboard)/cocktails/data";
import { ScanTicketVentesModal } from "@/components/stock/ScanTicketVentesModal";

type Session = { id: string; date: string; service: string; status: string; notes: string | null };
type SalesMap = Record<string, number>;

const SERVICE_LABELS: Record<string, string> = { midi: "Midi", soir: "Soir", journee: "Journée" };
const CATEGORIES = [...new Set(COCKTAILS.map((c) => c.categorie))];

// ── Calcul consommation totale ────────────────────────────────────────────────
function computeConsumption(sales: SalesMap): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const [nom, qty] of Object.entries(sales)) {
    if (!qty) continue;
    const recipe = RECIPES[nom];
    if (!recipe) continue;
    for (const ing of recipe) {
      totals[ing.item] = (totals[ing.item] ?? 0) + ing.qty * qty;
    }
  }
  return totals;
}

export default function VentesSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession]       = useState<Session | null>(null);
  const [sales, setSales]           = useState<SalesMap>({});
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [search, setSearch]         = useState("");
  const [openCats, setOpenCats]     = useState<Set<string>>(new Set(CATEGORIES));
  const [showResume, setShowResume] = useState(false);
  const [showScan, setShowScan]     = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: sess }, { data: lines }] = await Promise.all([
      supabase.from("sales_sessions").select("*").eq("id", id).single(),
      supabase.from("sales_lines").select("cocktail_nom, quantity").eq("session_id", id),
    ]);
    setSession(sess);
    const map: SalesMap = {};
    for (const l of lines ?? []) map[l.cocktail_nom] = l.quantity;
    setSales(map);
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function updateQty(nom: string, delta: number) {
    const prev = sales[nom] ?? 0;
    const next = Math.max(0, prev + delta);
    setSales((s) => ({ ...s, [nom]: next }));

    setSaving(true);
    const supabase = createClient();
    await supabase.from("sales_lines").upsert(
      { session_id: id, cocktail_nom: nom, quantity: next },
      { onConflict: "session_id,cocktail_nom" }
    );
    setSaving(false);
  }

  async function handleConfirm() {
    const totalCocktails = Object.values(sales).reduce((s, q) => s + q, 0);
    if (totalCocktails === 0) return;
    const ok = confirm(`Appliquer les ventes au stock bar ?\n${totalCocktails} cocktails → les ingrédients seront déduits du stock.`);
    if (!ok) return;

    setConfirming(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const consumption = computeConsumption(sales);

    // Récupérer les stocks actuels
    const itemNames = Object.keys(consumption);
    const { data: stockData } = await supabase
      .from("stock")
      .select("id, item_id, quantity, items(name)")
      .eq("location", "bar")
      .in("items.name", itemNames);

    // Créer les mouvements et mettre à jour le stock
    for (const [itemName, qtyConsumed] of Object.entries(consumption)) {
      if (!qtyConsumed) continue;

      const stockRow = (stockData ?? []).find((r) => {
        const it = r.items as unknown as { name: string } | null;
        return it?.name === itemName;
      });

      if (!stockRow) continue;

      const newQty = Math.max(0, (stockRow.quantity ?? 0) - qtyConsumed);

      await Promise.all([
        supabase.from("stock").update({ quantity: newQty }).eq("id", stockRow.id),
        supabase.from("stock_movements").insert({
          item_id: stockRow.item_id,
          user_id: user!.id,
          type: "vente",
          from_location: "bar",
          to_location: "bar",
          quantity: qtyConsumed,
          direction: "out",
          notes: `Ventes ${SERVICE_LABELS[session?.service ?? "soir"]} du ${session?.date} — ${
            Object.entries(sales)
              .filter(([n, q]) => q > 0 && RECIPES[n]?.some((i) => i.item === itemName))
              .map(([n, q]) => `${q}× ${n}`)
              .join(", ")
          }`,
        }),
      ]);
    }

    // Clôturer la session
    await supabase.from("sales_sessions").update({ status: "confirme" }).eq("id", id);
    setConfirming(false);
    router.push("/ventes");
  }

  async function handleScanImport(scanned: Record<string, number>) {
    const supabase = createClient();
    const updates: Record<string, number> = {};
    for (const [nom, qty] of Object.entries(scanned)) {
      updates[nom] = Math.max(0, (sales[nom] ?? 0) + qty);
    }
    setSales((s) => ({ ...s, ...updates }));
    setSaving(true);
    await Promise.all(
      Object.entries(updates).map(([nom, quantity]) =>
        supabase.from("sales_lines").upsert(
          { session_id: id, cocktail_nom: nom, quantity },
          { onConflict: "session_id,cocktail_nom" }
        )
      )
    );
    setSaving(false);
  }

  function toggleCat(cat: string) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  }

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (!session) return <p className="text-center text-gray-500 mt-20">Session introuvable</p>;

  const isConfirme  = session.status === "confirme";
  const totalCocktails = Object.values(sales).reduce((s, q) => s + q, 0);
  const consumption    = computeConsumption(sales);
  const dateStr = new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });

  const filteredCocktails = COCKTAILS.filter((c) =>
    !search || c.nom.toLowerCase().includes(search.toLowerCase())
  );
  const groups = CATEGORIES.map((cat) => ({
    cat,
    items: filteredCocktails.filter((c) => c.categorie === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/ventes" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 mt-0.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900 capitalize">{dateStr}</h1>
          <p className="text-gray-500 text-sm">
            Service {SERVICE_LABELS[session.service]}
            {session.notes && ` · ${session.notes}`}
            {isConfirme && " · ✅ Appliqué au stock"}
          </p>
        </div>
        {!isConfirme && (
          <button onClick={() => setShowScan(true)}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm rounded-lg font-medium shrink-0">
            <ScanLine size={16} />
            <span className="hidden sm:inline">Scanner ticket</span>
          </button>
        )}
        {!isConfirme && totalCocktails > 0 && (
          <button onClick={handleConfirm} disabled={confirming}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 shrink-0">
            <CheckCircle size={16} />
            <span className="hidden sm:inline">{confirming ? "Application…" : "Appliquer au stock"}</span>
          </button>
        )}
      </div>

      {/* Barre récap */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between">
        <div>
          <span className="font-bold text-blue-800 text-lg">{totalCocktails}</span>
          <span className="text-blue-700 text-sm ml-1">cocktail{totalCocktails > 1 ? "s" : ""} saisi{totalCocktails > 1 ? "s" : ""}</span>
          {saving && <span className="ml-2 text-xs text-blue-500">Sauvegarde…</span>}
        </div>
        <button onClick={() => setShowResume(!showResume)}
          className="flex items-center gap-1 text-sm text-blue-600 font-medium">
          Récapitulatif
          {showResume ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>
      </div>

      {/* Récapitulatif consommation */}
      {showResume && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900 text-sm">Déduction stock estimée</h3>
            <p className="text-xs text-gray-400">Sera déduit du stock bar à la confirmation</p>
          </div>

          {/* Cocktails vendus */}
          {totalCocktails > 0 && (
            <div className="px-4 py-3 border-b border-gray-50">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Cocktails vendus</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(sales).filter(([, q]) => q > 0).map(([nom, q]) => (
                  <span key={nom} className="px-2 py-1 bg-gray-100 rounded-lg text-sm">
                    <span className="font-bold text-blue-700">{q}×</span> {nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Ingrédients consommés */}
          <div className="divide-y divide-gray-50">
            {Object.entries(consumption).length === 0 ? (
              <p className="text-center text-gray-400 py-4 text-sm">Aucun cocktail saisi</p>
            ) : (
              Object.entries(consumption)
                .sort((a, b) => b[1] - a[1])
                .map(([item, qty]) => (
                  <div key={item} className="flex items-center justify-between px-4 py-2 text-sm">
                    <span className="text-gray-700">{item}</span>
                    <span className="font-medium text-red-600 tabular-nums">
                      -{qty.toFixed(3).replace(/\.?0+$/, "")} unité{qty !== 1 ? "s" : ""}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Recherche */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Rechercher un cocktail…" value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      {/* Liste cocktails par catégorie */}
      <div className="space-y-2">
        {groups.map(({ cat, items }) => (
          <div key={cat} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header catégorie */}
            <button onClick={() => toggleCat(cat)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CATEGORIE_COLORS[cat] }} />
                <span className="font-semibold text-gray-900 text-sm">{cat}</span>
                {items.some((c) => (sales[c.nom] ?? 0) > 0) && (
                  <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {items.reduce((s, c) => s + (sales[c.nom] ?? 0), 0)}
                  </span>
                )}
              </div>
              {openCats.has(cat) ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
            </button>

            {/* Lignes cocktails */}
            {openCats.has(cat) && (
              <div className="divide-y divide-gray-50">
                {items.map((c) => {
                  const qty = sales[c.nom] ?? 0;
                  return (
                    <div key={c.nom} className={`flex items-center gap-3 px-4 py-3 ${qty > 0 ? "bg-blue-50/40" : ""}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm">{c.nom}</p>
                        <p className="text-xs text-gray-400">{c.cout.toFixed(2).replace(".", ",")} € coût</p>
                      </div>
                      {isConfirme ? (
                        <span className="text-gray-700 font-medium text-sm w-8 text-center">{qty || "—"}</span>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button onClick={() => updateQty(c.nom, -1)} disabled={qty === 0}
                            className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 transition-colors">
                            <Minus size={14} />
                          </button>
                          <span className={`w-8 text-center font-bold text-sm tabular-nums ${qty > 0 ? "text-blue-700" : "text-gray-300"}`}>
                            {qty || "0"}
                          </span>
                          <button onClick={() => updateQty(c.nom, +1)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors">
                            <Plus size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <ScanTicketVentesModal
        open={showScan}
        onClose={() => setShowScan(false)}
        onImport={handleScanImport}
      />

      {/* Bouton confirmer en bas (mobile) */}
      {!isConfirme && totalCocktails > 0 && (
        <div className="sticky bottom-20 lg:bottom-4 flex justify-center pt-2">
          <button onClick={handleConfirm} disabled={confirming}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 transition-colors">
            <CheckCircle size={18} />
            {confirming ? "Application en cours…" : `Appliquer ${totalCocktails} cocktail${totalCocktails > 1 ? "s" : ""} au stock`}
          </button>
        </div>
      )}
    </div>
  );
}
