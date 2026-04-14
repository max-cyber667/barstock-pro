"use client";

import { useEffect, useState, useCallback } from "react";
import { ArrowLeftRight, Lightbulb, Check, Minus, Plus, Trash2, Save, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { formatQty } from "@/lib/utils";

interface ReassortItem {
  stockReserveId: string;
  itemId: string;
  itemName: string;
  unit: string;
  supplier: string;
  costPerUnit: number;
  reserveQty: number;
  barQty: number;
  minStockBar: number;
  suggested: number;
  selected: number;
  draftId: string | null;
}

export default function ReassortPage() {
  const [items, setItems] = useState<ReassortItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [draftOpen, setDraftOpen] = useState(false);
  const [filterSupplier, setFilterSupplier] = useState("Maison Richard");
  const [serviceDate, setServiceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [servicePeriod, setServicePeriod] = useState<"midi" | "soir" | null>(null);
  const { success, error: showError } = useToast();

  const suppliers = ["Maison Richard", "France Boissons", "Café Richard"];

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    const [{ data: reserve }, { data: bar }, { data: draft }] = await Promise.all([
      supabase.from("stock").select("id, item_id, quantity, items(name, unit, supplier, cost_per_unit, min_stock_bar, min_stock_reserve)").eq("location", "reserve"),
      supabase.from("stock").select("item_id, quantity").eq("location", "bar"),
      supabase.from("reassort_drafts").select("id, item_id, quantity").eq("user_id", user?.id ?? ""),
    ]);

    const barMap = new Map((bar ?? []).map((b: { item_id: string; quantity: number }) => [b.item_id, b.quantity]));
    const draftMap = new Map((draft ?? []).map((d: { id: string; item_id: string; quantity: number }) => [d.item_id, { id: d.id, quantity: d.quantity }]));

    type ReserveRow = { id: string; item_id: string; quantity: number; items: { name: string; unit: string; supplier: string; cost_per_unit: number; min_stock_bar: number; min_stock_reserve: number } };
    const rows: ReassortItem[] = ((reserve ?? []) as unknown as ReserveRow[])
      .map((r) => {
        const barQty = barMap.get(r.item_id) ?? 0;
        const minBar = r.items?.min_stock_bar ?? 0;
        const suggested = minBar > 0 ? Math.max(0, minBar - barQty) : 0;
        const draftEntry = draftMap.get(r.item_id);
        return {
          stockReserveId: r.id,
          itemId: r.item_id,
          itemName: r.items?.name ?? "",
          unit: r.items?.unit ?? "",
          supplier: r.items?.supplier ?? "",
          costPerUnit: r.items?.cost_per_unit ?? 0,
          reserveQty: r.quantity,
          barQty,
          minStockBar: minBar,
          suggested: Math.min(suggested, r.quantity),
          selected: draftEntry ? Math.min(draftEntry.quantity, r.quantity) : 0,
          draftId: draftEntry?.id ?? null,
        };
      })
      .sort((a, b) => b.suggested - a.suggested);

    setItems(rows);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredItems = items.filter((i) => i.supplier === filterSupplier);
  const suggestions = filteredItems.filter((i) => i.suggested > 0);
  const draftItems = items.filter((i) => i.selected > 0);

  async function setQty(itemId: string, value: number) {
    if (!userId) return;
    const item = items.find((i) => i.itemId === itemId);
    if (!item) return;
    const clamped = Math.min(Math.max(0, value), item.reserveQty);

    setItems((prev) =>
      prev.map((i) => i.itemId === itemId ? { ...i, selected: clamped } : i)
    );

    const supabase = createClient();
    if (clamped > 0) {
      await supabase.from("reassort_drafts").upsert(
        { user_id: userId, item_id: itemId, quantity: clamped, updated_at: new Date().toISOString() },
        { onConflict: "user_id,item_id" }
      );
    } else {
      await supabase.from("reassort_drafts").delete()
        .eq("user_id", userId).eq("item_id", itemId);
      setItems((prev) => prev.map((i) => i.itemId === itemId ? { ...i, draftId: null } : i));
    }
  }

  async function acceptAll() {
    if (!userId) return;
    const supabase = createClient();
    for (const item of suggestions) {
      if (item.suggested > 0) {
        await supabase.from("reassort_drafts").upsert(
          { user_id: userId, item_id: item.itemId, quantity: item.suggested, updated_at: new Date().toISOString() },
          { onConflict: "user_id,item_id" }
        );
      }
    }
    setItems((prev) => prev.map((i) => i.suggested > 0 ? { ...i, selected: i.suggested } : i));
    success("Suggestions ajoutées au brouillon");
  }

  async function handleConfirm() {
    if (!draftItems.length || !userId) return;
    if (!servicePeriod) { showError("Sélectionnez Midi ou Soir avant de confirmer"); return; }
    setSaving(true);
    const supabase = createClient();

    // Construire le timestamp : Midi = 12:00, Soir = 20:00
    const hour = servicePeriod === "midi" ? "12:00:00" : "20:00:00";
    const movementTime = `${serviceDate}T${hour}`;

    for (const item of draftItems) {
      await supabase.from("stock").update({ quantity: item.reserveQty - item.selected }).eq("id", item.stockReserveId);

      const { data: barStock } = await supabase.from("stock").select("id, quantity").eq("item_id", item.itemId).eq("location", "bar").single();
      if (barStock) {
        await supabase.from("stock").update({ quantity: barStock.quantity + item.selected }).eq("id", barStock.id);
      }

      await supabase.from("stock_movements").insert({
        item_id: item.itemId,
        user_id: userId,
        type: "reassort",
        from_location: "reserve",
        to_location: "bar",
        quantity: item.selected,
        direction: "transfer",
        cost_at_time: item.costPerUnit,
        created_at: movementTime,
      });
    }

    // Vider le brouillon
    await supabase.from("reassort_drafts").delete().eq("user_id", userId);

    success(`${draftItems.length} article${draftItems.length > 1 ? "s" : ""} transféré${draftItems.length > 1 ? "s" : ""} vers le bar`);
    setSaving(false);
    load();
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ArrowLeftRight size={20} className="text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Réassort</h1>
            <p className="text-gray-500 text-sm">Préparez votre réassort et confirmez le transfert</p>
          </div>
        </div>
        <select
          value={filterSupplier}
          onChange={(e) => setFilterSupplier(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {suppliers.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Date & service */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1 font-medium">Date du service</label>
          <input
            type="date"
            value={serviceDate}
            onChange={(e) => setServiceDate(e.target.value)}
            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        <div className="flex-1">
          <label className="block text-xs text-gray-500 mb-1 font-medium">Service <span className="text-red-500">*</span></label>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-sm font-medium">
            {(["midi", "soir"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setServicePeriod(s)}
                className={`flex-1 py-2.5 transition-colors capitalize ${
                  servicePeriod === s
                    ? s === "midi" ? "bg-orange-500 text-white" : "bg-indigo-600 text-white"
                    : "bg-white text-gray-600 active:bg-gray-100"
                }`}
              >
                {s === "midi" ? "Midi" : "Soir"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-600" />
              <h2 className="font-semibold text-amber-900">
                {suggestions.length} suggestion{suggestions.length > 1 ? "s" : ""}
              </h2>
            </div>
            <button onClick={acceptAll} className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium">
              Tout accepter
            </button>
          </div>
          <p className="text-xs text-amber-700">Articles en dessous du seuil minimum au bar.</p>
        </div>
      )}

      {/* Brouillon en cours */}
      {draftItems.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-indigo-200">
          <button
            onClick={() => setDraftOpen((o) => !o)}
            className="w-full p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Save size={16} className="text-indigo-600" />
              <h2 className="font-semibold text-gray-900">Brouillon en cours</h2>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{draftItems.length} article{draftItems.length > 1 ? "s" : ""}</span>
            </div>
            {draftOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
          </button>
          {draftOpen && (
            <div className="divide-y divide-gray-50 border-t border-indigo-100">
              {draftItems.map((item) => (
                <div key={item.itemId} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    <p className="text-xs text-gray-500">
                      Réserve : {formatQty(item.reserveQty, item.unit)} · Bar : {formatQty(item.barQty, item.unit)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQty(item.itemId, item.selected - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                      <Minus size={14} />
                    </button>
                    <input
                      type="number"
                      value={item.selected}
                      onChange={(e) => setQty(item.itemId, parseFloat(e.target.value) || 0)}
                      className="w-16 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      min="0"
                      max={item.reserveQty}
                      step="0.5"
                    />
                    <button onClick={() => setQty(item.itemId, item.selected + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100">
                      <Plus size={14} />
                    </button>
                    <button onClick={() => setQty(item.itemId, 0)} className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tous les articles de la réserve */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b">
          <p className="text-sm font-medium text-gray-700">Ajouter des articles au brouillon</p>
          <p className="text-xs text-gray-500 mt-0.5">Sélectionnez les quantités à transférer vers le bar</p>
        </div>
        <div className="divide-y divide-gray-50">
          {filteredItems.map((item) => {
            const emptyReserve = item.reserveQty <= 0;
            return (
              <div key={item.itemId} className={`p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${emptyReserve ? "opacity-50" : ""}`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center flex-wrap gap-1.5">
                    <p className="font-medium text-gray-900">{item.itemName}</p>
                    {item.suggested > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded font-medium">
                        Suggéré : {item.suggested} {item.unit}
                      </span>
                    )}
                    {item.selected > 0 && (
                      <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded font-medium">
                        Dans le brouillon
                      </span>
                    )}
                    {emptyReserve && (
                      <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-medium">
                        Réserve vide
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Réserve : {formatQty(item.reserveQty, item.unit)} · Bar : {formatQty(item.barQty, item.unit)}
                    {item.minStockBar > 0 && ` · Seuil : ${formatQty(item.minStockBar, item.unit)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button disabled={emptyReserve} onClick={() => setQty(item.itemId, item.selected - 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:cursor-not-allowed">
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={item.selected}
                    onChange={(e) => setQty(item.itemId, parseFloat(e.target.value) || 0)}
                    className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:bg-gray-50"
                    min="0"
                    max={item.reserveQty}
                    step="0.5"
                    disabled={emptyReserve}
                  />
                  <button disabled={emptyReserve} onClick={() => setQty(item.itemId, item.selected + 1)} className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 disabled:cursor-not-allowed">
                    <Plus size={14} />
                  </button>
                </div>
              </div>
            );
          })}
          {filteredItems.length === 0 && (
            <p className="p-8 text-center text-gray-400 text-sm">Aucun article pour ce fournisseur</p>
          )}
        </div>
      </div>

      {/* Bouton confirmer fixe */}
      {draftItems.length > 0 && (
        <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 w-full max-w-sm px-4">
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Check size={18} />
            {saving ? "Transfert en cours..." : `Confirmer le réassort (${draftItems.length} article${draftItems.length > 1 ? "s" : ""})`}
          </button>
        </div>
      )}
    </div>
  );
}
