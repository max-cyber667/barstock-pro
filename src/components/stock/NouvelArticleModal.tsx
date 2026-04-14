"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import { Category } from "@/types";

const UNITS = ["CL", "L", "unité", "kg", "g", "bouteille", "fût", "pack", "carton"];

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
  unit: "bouteille",
  unit_size: "1",
  cost_per_unit: "",
  supplier: "",
  min_stock_bar: "0",
  min_stock_reserve: "0",
};

interface Props {
  open: boolean;
  onClose: () => void;
  onDone: () => void;
}

export function NouvelArticleModal({ open, onClose, onDone }: Props) {
  const [form, setForm] = useState<ItemForm>(emptyForm);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (!open) return;
    createClient().from("categories").select("*").order("name").then(({ data }) => {
      setCategories(data ?? []);
    });
  }, [open]);

  function handleClose() {
    setForm(emptyForm);
    onClose();
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

    const { data: newItem, error } = await supabase.from("items").insert(payload).select().single();
    if (error) {
      showError("Erreur lors de la création");
      setSaving(false);
      return;
    }

    await supabase.from("stock").insert([
      { item_id: newItem.id, location: "bar", quantity: 0 },
      { item_id: newItem.id, location: "reserve", quantity: 0 },
    ]);

    success(`"${newItem.name}" ajouté au catalogue`);
    setSaving(false);
    handleClose();
    onDone();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nouvel article" size="lg">
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
              autoFocus
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
          <button onClick={handleClose} className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50">
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
          >
            {saving ? "Enregistrement..." : "Créer l'article"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
