"use client";

import { useEffect, useState, useCallback } from "react";
import { ShoppingCart, Plus, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { formatDate, formatEur } from "@/lib/utils";
import { PurchaseOrder } from "@/types";
import Link from "next/link";

const STATUS_LABELS: Record<string, string> = { brouillon: "Brouillon", envoyé: "Envoyé", reçu: "Reçu" };
const STATUS_COLORS: Record<string, string> = {
  brouillon: "bg-yellow-100 text-yellow-800",
  envoyé: "bg-blue-100 text-blue-800",
  reçu: "bg-green-100 text-green-800",
};

export default function CommandesPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { success, error: showError } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("purchase_orders")
      .select("*, purchase_order_lines(*), profiles(display_name, email)")
      .order("created_at", { ascending: false });
    setOrders((data ?? []) as PurchaseOrder[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createSmartOrder() {
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: reserve }, { data: items }] = await Promise.all([
      supabase.from("stock").select("item_id, quantity").eq("location", "reserve"),
      supabase.from("items").select("id, name, min_stock_reserve, cost_per_unit, unit"),
    ]);

    const reserveMap = new Map((reserve ?? []).map((r: { item_id: string; quantity: number }) => [r.item_id, r.quantity]));

    const lines = (items ?? [])
      .filter((i: { id: string; min_stock_reserve: number }) => i.min_stock_reserve > 0)
      .map((i: { id: string; name: string; min_stock_reserve: number; cost_per_unit: number; unit: string }) => ({
        item_id: i.id,
        item_name: i.name,
        suggested_qty: Math.max(0, i.min_stock_reserve - (reserveMap.get(i.id) ?? 0)),
        ordered_qty: Math.max(0, i.min_stock_reserve - (reserveMap.get(i.id) ?? 0)),
        unit_cost: i.cost_per_unit,
      }))
      .filter((l: { suggested_qty: number }) => l.suggested_qty > 0);

    if (lines.length === 0) {
      showError("Aucun article en dessous du seuil minimum en réserve");
      setCreating(false);
      return;
    }

    const { data: order, error } = await supabase
      .from("purchase_orders")
      .insert({ status: "brouillon", created_by: user?.id })
      .select()
      .single();

    if (error || !order) { showError("Erreur lors de la création"); setCreating(false); return; }

    await supabase.from("purchase_order_lines").insert(lines.map((l: { item_id: string; item_name: string; suggested_qty: number; ordered_qty: number; unit_cost: number }) => ({ ...l, order_id: order.id })));

    success(`Bon de commande créé avec ${lines.length} article${lines.length > 1 ? "s" : ""}`);
    setCreating(false);
    load();
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cyan-100 rounded-lg">
            <ShoppingCart size={20} className="text-cyan-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Commandes</h1>
            <p className="text-gray-500 text-sm">Bons de commande et réassort fournisseur</p>
          </div>
        </div>
        <button
          onClick={createSmartOrder}
          disabled={creating}
          className="flex items-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">{creating ? "Génération..." : "Nouvelle commande"}</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {orders.map((order) => {
          const lines = order.purchase_order_lines ?? [];
          const total = lines.reduce((s, l) => s + l.ordered_qty * l.unit_cost, 0);
          return (
            <div key={order.id} className="p-4 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                </div>
                <p className="text-sm text-gray-700">
                  {lines.length} article{lines.length > 1 ? "s" : ""} · {formatEur(total)}
                </p>
                {order.notes && <p className="text-xs text-gray-400 mt-0.5">{order.notes}</p>}
              </div>
              <Link
                href={`/commandes/${order.id}`}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium shrink-0"
              >
                <Eye size={14} />
                Voir
              </Link>
            </div>
          );
        })}
        {orders.length === 0 && (
          <p className="p-8 text-center text-gray-400 text-sm">
            Aucune commande. Cliquez sur &quot;Nouvelle commande&quot; pour générer une commande intelligente.
          </p>
        )}
      </div>
    </div>
  );
}
