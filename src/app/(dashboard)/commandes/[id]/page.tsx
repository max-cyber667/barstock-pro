"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Printer, Download, ArrowLeft, Save } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useToast } from "@/components/ui/Toast";
import { formatEur, formatDate } from "@/lib/utils";
import { PurchaseOrder, PurchaseOrderLine } from "@/types";

const STATUS_OPTIONS = ["brouillon", "envoyé", "reçu"] as const;
const STATUS_LABELS: Record<string, string> = { brouillon: "Brouillon", envoyé: "Envoyé", reçu: "Reçu" };

export default function CommandeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [order, setOrder] = useState<PurchaseOrder | null>(null);
  const [lines, setLines] = useState<PurchaseOrderLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("purchase_orders")
        .select("*, purchase_order_lines(*), profiles(display_name, email)")
        .eq("id", id)
        .single();
      if (data) {
        setOrder(data as PurchaseOrder);
        setLines(data.purchase_order_lines ?? []);
      }
      setLoading(false);
    }
    load();
  }, [id]);

  function setLineQty(lineId: string, qty: number) {
    setLines((prev) => prev.map((l) => l.id === lineId ? { ...l, ordered_qty: Math.max(0, qty) } : l));
  }

  async function handleSave() {
    setSaving(true);
    const supabase = createClient();
    for (const line of lines) {
      await supabase.from("purchase_order_lines").update({ ordered_qty: line.ordered_qty }).eq("id", line.id);
    }
    if (order) {
      await supabase.from("purchase_orders").update({ status: order.status }).eq("id", id);
    }
    success("Commande enregistrée");
    setSaving(false);
  }

  function exportCSV() {
    const rows = [
      ["Article", "Quantité suggérée", "Quantité commandée", "Coût unitaire", "Total ligne"],
      ...lines.map((l) => [
        l.item_name,
        l.suggested_qty,
        l.ordered_qty,
        l.unit_cost,
        (l.ordered_qty * l.unit_cost).toFixed(2),
      ]),
    ];
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `commande-${id.slice(0, 8)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (!order) return <p className="text-center mt-20 text-gray-400">Commande introuvable</p>;

  const total = lines.reduce((s, l) => s + l.ordered_qty * l.unit_cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-100">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">Bon de commande</h1>
          <p className="text-xs text-gray-400">{formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status}
            onChange={(e) => setOrder({ ...order, status: e.target.value as PurchaseOrder["status"] })}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Article</th>
                <th className="px-4 py-3 text-center font-medium">Suggéré</th>
                <th className="px-4 py-3 text-center font-medium">À commander</th>
                <th className="px-4 py-3 text-right font-medium">Coût/u</th>
                <th className="px-4 py-3 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.map((line) => (
                <tr key={line.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{line.item_name}</td>
                  <td className="px-4 py-3 text-center text-gray-500">{line.suggested_qty}</td>
                  <td className="px-4 py-3 text-center">
                    <input
                      type="number"
                      value={line.ordered_qty}
                      onChange={(e) => setLineQty(line.id, parseFloat(e.target.value) || 0)}
                      className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                      min="0"
                      step="0.5"
                    />
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatEur(line.unit_cost)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatEur(line.ordered_qty * line.unit_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-4 py-3 text-right font-semibold text-gray-700">Total commande</td>
                <td className="px-4 py-3 text-right font-bold text-gray-900">{formatEur(total)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 justify-end">
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
        >
          <Download size={16} />
          Exporter CSV
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 font-medium"
        >
          <Printer size={16} />
          Imprimer
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Enregistrement..." : "Enregistrer"}
        </button>
      </div>
    </div>
  );
}
