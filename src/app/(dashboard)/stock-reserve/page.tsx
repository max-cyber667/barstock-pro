"use client";

import { useEffect, useState, useCallback } from "react";
import { Warehouse, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StockTable } from "@/components/stock/StockTable";
import { ScanLivraisonModal } from "@/components/stock/ScanLivraisonModal";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { StockWithItem } from "@/types";
import type { Item } from "@/types";

export default function StockReservePage() {
  const [stock, setStock] = useState<StockWithItem[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isManager, setIsManager] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanOpen, setScanOpen] = useState(false);

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const [{ data: stockData }, { data: profile }, { data: itemsData }] = await Promise.all([
      supabase.from("stock").select("*, items(*, categories(*))").eq("location", "reserve").order("items(name)"),
      supabase.from("profiles").select("role").eq("id", user!.id).single(),
      supabase.from("items").select("*").order("name"),
    ]);

    setStock((stockData ?? []) as StockWithItem[]);
    setItems((itemsData ?? []) as Item[]);
    setIsManager(profile?.role === "manager" || profile?.role === "admin");
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <Warehouse size={20} className="text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Stock Réserve</h1>
            <p className="text-gray-500 text-sm">Articles disponibles en réserve</p>
          </div>
        </div>
        {isManager && (
          <button
            onClick={() => setScanOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors"
          >
            <ScanLine size={16} />
            <span className="hidden sm:inline">Scanner livraison</span>
          </button>
        )}
      </div>

      <StockTable
        location="reserve"
        initialRows={stock}
        isManager={isManager}
      />

      <ScanLivraisonModal
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onDone={load}
        items={items}
      />
    </div>
  );
}
