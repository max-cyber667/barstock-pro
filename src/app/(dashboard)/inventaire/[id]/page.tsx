"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowLeft, CheckCircle, AlertTriangle, Search, Filter } from "lucide-react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type Line = {
  id: string;
  item_id: string;
  location: string;
  system_qty: number;
  counted_qty: number | null;
  item_name: string;
  item_unit: string;
  item_category: string;
  item_supplier: string | null;
};

type Session = {
  id: string;
  date: string;
  location: string;
  status: string;
  notes: string | null;
};

type FilterStatus = "tous" | "non_compte" | "ok" | "ecart";

export default function InventaireSessionPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<Set<string>>(new Set());
  const [validating, setValidating] = useState(false);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("tous");
  const [filterCat, setFilterCat] = useState("Toutes");
  const [isManager, setIsManager] = useState(false);
  const debounceRefs = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
    setIsManager(profile?.role === "manager" || profile?.role === "admin");

    const [{ data: sess }, { data: linesData }] = await Promise.all([
      supabase.from("inventory_sessions").select("*").eq("id", id).single(),
      supabase
        .from("inventory_lines")
        .select("*, items(name, unit, supplier, categories(name))")
        .eq("session_id", id)
        .order("items(name)"),
    ]);

    setSession(sess);
    setLines(
      (linesData ?? []).map((l) => {
        const item = l.items as unknown as { name: string; unit: string; supplier: string | null; categories: { name: string } | null };
        return {
          id: l.id,
          item_id: l.item_id,
          location: l.location,
          system_qty: l.system_qty,
          counted_qty: l.counted_qty,
          item_name: item?.name ?? "?",
          item_unit: item?.unit ?? "",
          item_category: item?.categories?.name ?? "Autre",
          item_supplier: item?.supplier ?? null,
        };
      })
    );
    setLoading(false);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  function updateCountedQty(lineId: string, value: string) {
    const num = value === "" ? null : parseFloat(value);
    setLines((prev) => prev.map((l) => l.id === lineId ? { ...l, counted_qty: num } : l));

    // Debounce save to DB
    if (debounceRefs.current[lineId]) clearTimeout(debounceRefs.current[lineId]);
    debounceRefs.current[lineId] = setTimeout(async () => {
      setSaving((s) => new Set(s).add(lineId));
      const supabase = createClient();
      await supabase.from("inventory_lines").update({ counted_qty: num }).eq("id", lineId);
      setSaving((s) => { const next = new Set(s); next.delete(lineId); return next; });
    }, 600);
  }

  async function handleValider() {
    const uncounted = lines.filter((l) => l.counted_qty === null).length;
    if (uncounted > 0) {
      const ok = confirm(`${uncounted} article(s) non comptés. Valider quand même ?`);
      if (!ok) return;
    }
    setValidating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const diffs = lines.filter((l) => l.counted_qty !== null && l.counted_qty !== l.system_qty);

    for (const l of diffs) {
      const diff = Math.abs(l.counted_qty! - l.system_qty);
      const direction = l.counted_qty! > l.system_qty ? "in" : "out";

      // Créer mouvement d'ajustement
      await supabase.from("stock_movements").insert({
        item_id: l.item_id,
        user_id: user!.id,
        type: "ajustement",
        from_location: l.location,
        to_location: l.location,
        quantity: diff,
        direction,
        notes: `Inventaire du ${session?.date} — Stock système : ${l.system_qty}, Compté : ${l.counted_qty}`,
      });

      // Mettre à jour le stock
      await supabase.from("stock")
        .update({ quantity: l.counted_qty! })
        .eq("item_id", l.item_id)
        .eq("location", l.location);
    }

    // Clôturer la session
    await supabase.from("inventory_sessions").update({ status: "termine" }).eq("id", id);
    setValidating(false);
    router.push("/inventaire");
  }

  // ── Filtres & stats ──
  const categories = ["Toutes", ...Array.from(new Set(lines.map((l) => l.item_category))).sort()];

  const filtered = lines.filter((l) => {
    if (search && !l.item_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterCat !== "Toutes" && l.item_category !== filterCat) return false;
    if (filterStatus === "non_compte" && l.counted_qty !== null) return false;
    if (filterStatus === "ok" && (l.counted_qty === null || l.counted_qty !== l.system_qty)) return false;
    if (filterStatus === "ecart" && (l.counted_qty === null || l.counted_qty === l.system_qty)) return false;
    return true;
  });

  const totalLines   = lines.length;
  const counted      = lines.filter((l) => l.counted_qty !== null).length;
  const ecarts       = lines.filter((l) => l.counted_qty !== null && l.counted_qty !== l.system_qty).length;
  const pct          = totalLines ? Math.round((counted / totalLines) * 100) : 0;

  const isTermine = session?.status === "termine";

  function diffLabel(l: Line) {
    if (l.counted_qty === null) return null;
    const d = l.counted_qty - l.system_qty;
    if (d === 0) return null;
    return { val: d, positive: d > 0 };
  }

  if (loading) return <LoadingSpinner className="mt-20" />;
  if (!session) return <p className="text-center text-gray-500 mt-20">Session introuvable</p>;

  const dateStr = new Date(session.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  const locLabel = session.location === "bar" ? "Bar" : session.location === "reserve" ? "Réserve" : "Bar + Réserve";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link href="/inventaire" className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 mt-0.5">
          <ArrowLeft size={16} />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-gray-900">Inventaire — {dateStr}</h1>
          <p className="text-gray-500 text-sm">{locLabel}{session.notes ? ` · ${session.notes}` : ""}</p>
        </div>
        {!isTermine && isManager && (
          <button
            onClick={handleValider}
            disabled={validating || counted === 0}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 shrink-0"
          >
            <CheckCircle size={16} />
            <span className="hidden sm:inline">{validating ? "Validation…" : "Valider"}</span>
          </button>
        )}
      </div>

      {/* Progression */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progression</span>
          <span className="font-semibold text-gray-900">{counted} / {totalLines} articles</span>
        </div>
        <div className="bg-gray-100 rounded-full h-2">
          <div className="bg-teal-500 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gray-900">{pct}%</p>
            <p className="text-xs text-gray-500">Complété</p>
          </div>
          <div>
            <p className="text-xl font-bold text-orange-500">{totalLines - counted}</p>
            <p className="text-xs text-gray-500">Non comptés</p>
          </div>
          <div>
            <p className={`text-xl font-bold ${ecarts > 0 ? "text-red-600" : "text-green-600"}`}>{ecarts}</p>
            <p className="text-xs text-gray-500">Écarts</p>
          </div>
        </div>
      </div>

      {isTermine && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl p-3 text-sm text-green-700">
          <CheckCircle size={16} />
          Inventaire clôturé — les corrections ont été appliquées au stock.
        </div>
      )}

      {/* Filtres */}
      <div className="space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher un article…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {(["tous", "non_compte", "ecart", "ok"] as FilterStatus[]).map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterStatus === s
                  ? s === "ecart" ? "bg-red-600 text-white" : s === "ok" ? "bg-green-600 text-white" : "bg-slate-900 text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {s === "tous" ? "Tous" : s === "non_compte" ? `Non comptés (${totalLines - counted})` : s === "ecart" ? `Écarts (${ecarts})` : "OK"}
            </button>
          ))}
          <div className="flex items-center gap-1 ml-auto">
            <Filter size={12} className="text-gray-400" />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
            >
              {categories.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Tableau */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 uppercase">
              <tr>
                <th className="text-left px-4 py-3">Article</th>
                <th className="text-left px-4 py-3 hidden sm:table-cell">Catégorie</th>
                {session.location === "les deux" && (
                  <th className="text-left px-4 py-3">Lieu</th>
                )}
                <th className="text-right px-4 py-3">Système</th>
                <th className="text-right px-4 py-3">Compté</th>
                <th className="text-right px-4 py-3">Écart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((l) => {
                const diff = diffLabel(l);
                const isSaving = saving.has(l.id);
                return (
                  <tr
                    key={l.id}
                    className={`${diff ? "bg-red-50/40" : l.counted_qty !== null ? "bg-green-50/30" : ""}`}
                  >
                    <td className="px-4 py-2.5">
                      <span className="font-medium text-gray-900">{l.item_name}</span>
                    </td>
                    <td className="px-4 py-2.5 hidden sm:table-cell text-xs text-gray-500">{l.item_category}</td>
                    {session.location === "les deux" && (
                      <td className="px-4 py-2.5">
                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                          {l.location === "bar" ? "Bar" : "Réserve"}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-2.5 text-right text-gray-600">
                      {l.system_qty} <span className="text-xs text-gray-400">{l.item_unit}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isTermine ? (
                        <span className={l.counted_qty !== null ? "font-medium text-gray-900" : "text-gray-300"}>
                          {l.counted_qty ?? "—"}
                        </span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          {isSaving && <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />}
                          <input
                            type="number"
                            min={0}
                            step={0.5}
                            value={l.counted_qty ?? ""}
                            onChange={(e) => updateCountedQty(l.id, e.target.value)}
                            placeholder="—"
                            className="w-20 text-right border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {diff ? (
                        <span className={`flex items-center justify-end gap-1 font-medium text-xs ${diff.positive ? "text-green-600" : "text-red-600"}`}>
                          <AlertTriangle size={12} />
                          {diff.positive ? "+" : ""}{diff.val} {l.item_unit}
                        </span>
                      ) : l.counted_qty !== null ? (
                        <span className="text-green-500 text-xs">✓</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 py-8 text-sm">Aucun article</p>
          )}
        </div>
      </div>
    </div>
  );
}
