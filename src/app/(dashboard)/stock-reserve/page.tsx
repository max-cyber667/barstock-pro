import { createClient } from "@/lib/supabase/server";
import { StockTable } from "@/components/stock/StockTable";
import { StockWithItem } from "@/types";
import { Warehouse } from "lucide-react";

export default async function StockReservePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: stock }, { data: profile }] = await Promise.all([
    supabase
      .from("stock")
      .select("*, items(*, categories(*))")
      .eq("location", "reserve")
      .order("items(name)"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
  ]);

  const isManager = profile?.role === "manager" || profile?.role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 rounded-lg">
          <Warehouse size={20} className="text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Réserve</h1>
          <p className="text-gray-500 text-sm">Articles disponibles en réserve</p>
        </div>
      </div>
      <StockTable
        location="reserve"
        initialRows={(stock ?? []) as StockWithItem[]}
        isManager={isManager}
      />
    </div>
  );
}
