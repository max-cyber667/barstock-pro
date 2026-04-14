"use client";

import { useEffect, useState, useCallback } from "react";
import { Package, Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatEur } from "@/lib/utils";
import { Item, Category } from "@/types";

const UNITS = ["CL", "L", "unité", "kg", "g", "bouteille", "fût", "pack"];

interface ItemForm {
  name: string;
  category_id: string;
  unit: string;
  unit_size: string;
  cost_per_unit: string;
  supplier: string;
  min_stock_bar: string;
  min_stock_reserve: string;
}

const emptyForm: ItemForm = {
  name: "",
  category_id: "",
  unit: "CL",
  unit_size: "1",
  cost_per_unit: "",
  supplier: "",
  min_stock_bar: "0",
  min_stock_reserve: "0",
};

export default function ArticlesPage() {
  const { isManager, isAdmin } = useCurrentUser();
  const [items, setItems] = useState<(Item & { categories: Category | null })[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const [{ data: itemsData }, { data: catsData }] = await Promise.all([
      supabase.from("items").select("*, categories(*)").order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setItems((itemsData ?? []) as (Item & { categories: Category | null })[]);
    setCategories(catsData ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditingItem(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function openEdit(item: Item) {
    setEditingItem(item);
    setForm({
      name: item.name,
      category_id: item.category_id ?? "",
      unit: item.unit,
      unit_size: String(item.unit_size),
      cost_per_unit: String(item.cost_per_unit),
      supplier: item.supplier ?? "",
      min_stock_bar: String(item.min_stock_bar),
      min_stock_reserve: String(item.min_stock_reserve),
    });
    setModalOpen(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { showError("Nom requis"); return; }
    setSaving(true);
    const supabase = createClient();

    const payload = {
      name: form.name.trim(),
      category_id: form.category_id || null,
      unit: form.unit,
      unit_size: parseFloat(form.unit_size) || 1,
      cost_per_unit: parseFloat(form.cost_per_unit) || 0,
      supplier: form.supplier || null,
      min_stock_bar: parseFloat(form.min_stock_bar) || 0,
      min_stock_reserve: parseFloat(form.min_stock_reserve) || 0,
    };

    if (editingItem) {
      const { error } = await supabase.from("items").update(payload).eq("id", editingItem.id);
      if (error) { showError("Erreur lors de la modification"); setSaving(false); return; }
      success("Article modifié");
    } else {
      const { data: newItem, error } = await supabase.from("items").insert(payload).select().single();
      if (error) { showError("Erreur lors de la création"); setSaving(false); return; }
      // Create stock entries
      await supabase.from("stock").insert([
        { item_id: newItem.id, location: "bar", quantity: 0 },
        { item_id: newItem.id, location: "reserve", quantity: 0 },
      ]);
      success("Article créé");
    }

    setSaving(false);
    setModalOpen(false);
    load();
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("items").delete().eq("id", deleteId);
    if (error) showError("Erreur lors de la suppression");
    else success("Article supprimé");
    setDeleting(false);
    setDeleteId(null);
    load();
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <Package size={20} className="text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
          <p className="text-gray-500 text-sm">Catalogue de produits</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Article</th>
                <th className="px-4 py-3 text-left font-medium">Catégorie</th>
                <th className="px-4 py-3 text-center font-medium">Unité</th>
                <th className="px-4 py-3 text-right font-medium">Coût/unité</th>
                <th className="px-4 py-3 text-right font-medium">Seuil bar</th>
                <th className="px-4 py-3 text-right font-medium">Seuil réserve</th>
                {isManager && <th className="px-4 py-3 text-center font-medium">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div>{item.name}</div>
                    {item.supplier && <div className="text-xs text-gray-400">{item.supplier}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{item.categories?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-center text-gray-600">{item.unit_size} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatEur(item.cost_per_unit)}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.min_stock_bar} {item.unit}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{item.min_stock_reserve} {item.unit}</td>
                  {isManager && (
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50">
                          <Pencil size={14} />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteId(item.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-400">Aucun article</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sm:hidden divide-y divide-gray-100">
          {items.map((item) => (
            <div key={item.id} className="p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500">{item.categories?.name ?? "—"} · {item.unit_size} {item.unit} · {formatEur(item.cost_per_unit)}</p>
              </div>
              {isManager && (
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => openEdit(item)} className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50">
                    <Pencil size={16} />
                  </button>
                  {isAdmin && (
                    <button onClick={() => setDeleteId(item.id)} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
          {items.length === 0 && (
            <p className="p-8 text-center text-gray-400 text-sm">Aucun article</p>
          )}
        </div>
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? "Modifier l'article" : "Nouvel article"}
        size="lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Vodka Grey Goose"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="">Sans catégorie</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fournisseur</label>
              <input
                type="text"
                value={form.supplier}
                onChange={(e) => setForm({ ...form, supplier: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Ex: Nicolas"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unité</label>
              <select
                value={form.unit}
                onChange={(e) => setForm({ ...form, unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Taille par unité</label>
              <input
                type="number"
                value={form.unit_size}
                onChange={(e) => setForm({ ...form, unit_size: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0.01"
                step="0.01"
                placeholder="Ex: 75 pour 75CL"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Coût par unité (€)</label>
              <input
                type="number"
                value={form.cost_per_unit}
                onChange={(e) => setForm({ ...form, cost_per_unit: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil alerte bar ({form.unit})</label>
              <input
                type="number"
                value={form.min_stock_bar}
                onChange={(e) => setForm({ ...form, min_stock_bar: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Seuil alerte réserve ({form.unit})</label>
              <input
                type="number"
                value={form.min_stock_reserve}
                onChange={(e) => setForm({ ...form, min_stock_reserve: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                min="0"
                step="0.5"
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'article"
        message="Cette action est irréversible. Le stock et l'historique liés seront également supprimés."
        confirmLabel="Supprimer"
        danger
        loading={deleting}
      />
    </div>
  );
}
