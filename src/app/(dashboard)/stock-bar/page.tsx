import { createClient } from "@/lib/supabase/server";
import { StockTable } from "@/components/stock/StockTable";
import { StockWithItem } from "@/types";
import { Wine } from "lucide-react";

export default async function StockBarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: stock }, { data: profile }] = await Promise.all([
    supabase
      .from("stock")
      .select("*, items(*, categories(*))")
      .eq("location", "bar")
      .order("items(name)"),
    supabase.from("profiles").select("role").eq("id", user!.id).single(),
  ]);

  const isManager = profile?.role === "manager" || profile?.role === "admin";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-100 rounded-lg">
          <Wine size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stock Bar</h1>
          <p className="text-gray-500 text-sm">Articles disponibles derrière le bar</p>
        </div>
      </div>
      <StockTable
        location="bar"
        initialRows={(stock ?? []) as StockWithItem[]}
        isManager={isManager}
      />
    </div>
  );
}
