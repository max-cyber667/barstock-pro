"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClipboardList, Plus, CheckCircle, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type Session = {
  id: string;
  date: string;
  location: string;
  status: string;
  notes: string | null;
  created_at: string;
  profiles: { display_name: string | null; email: string } | null;
  line_count?: number;
  counted_count?: number;
  diff_count?: number;
};

export default function InventairePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [isManager, setIsManager] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), location: "bar", notes: "" });

  async function load() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user!.id).single();
    setIsManager(profile?.role === "manager" || profile?.role === "admin");

    const { data } = await supabase
      .from("inventory_sessions")
      .select("*, profiles(display_name, email)")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    // Pour chaque session, récupérer les comptages
    const enriched: Session[] = [];
    for (const s of data ?? []) {
      const { data: lines } = await supabase
        .from("inventory_lines")
        .select("counted_qty, system_qty")
        .eq("session_id", s.id);

      const line_count = lines?.length ?? 0;
      const counted_count = lines?.filter((l) => l.counted_qty !== null).length ?? 0;
      const diff_count = lines?.filter(
        (l) => l.counted_qty !== null && l.counted_qty !== l.system_qty
      ).length ?? 0;
      enriched.push({ ...s, line_count, counted_count, diff_count });
    }
    setSessions(enriched);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!form.date) return;
    setCreating(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Créer la session
    const { data: session, error } = await supabase
      .from("inventory_sessions")
      .insert({ date: form.date, location: form.location, notes: form.notes || null, created_by: user!.id })
      .select()
      .single();

    if (error || !session) { setCreating(false); return; }

    // Charger le stock actuel pour pré-remplir system_qty
    const locations = form.location === "les deux" ? ["bar", "reserve"] : [form.location];
    const lines: { session_id: string; item_id: string; location: string; system_qty: number }[] = [];

    for (const loc of locations) {
      const { data: stocks } = await supabase
        .from("stock")
        .select("item_id, quantity")
        .eq("location", loc);

      for (const s of stocks ?? []) {
        lines.push({ session_id: session.id, item_id: s.item_id, location: loc, system_qty: s.quantity });
      }
    }

    await supabase.from("inventory_lines").insert(lines);
    setCreating(false);
    router.push(`/inventaire/${session.id}`);
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-teal-100 rounded-lg">
            <ClipboardList size={20} className="text-teal-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventaires</h1>
            <p className="text-gray-500 text-sm">Comptages mensuels du stock</p>
          </div>
        </div>
        {isManager && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded-lg font-medium transition-colors"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvel inventaire</span>
          </button>
        )}
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Nouvel inventaire</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Emplacement</label>
              <select
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="bar">Bar uniquement</option>
                <option value="reserve">Réserve uniquement</option>
                <option value="les deux">Bar + Réserve</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optionnel)</label>
              <input
                type="text"
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Inventaire mensuel avril…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">
              Annuler
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !form.date}
              className="px-4 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium disabled:opacity-50"
            >
              {creating ? "Création…" : "Démarrer l'inventaire"}
            </button>
          </div>
        </div>
      )}

      {/* Liste des sessions */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <ClipboardList size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucun inventaire pour l&apos;instant</p>
          {isManager && (
            <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-teal-600 hover:underline">
              Créer le premier inventaire
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const pct = s.line_count ? Math.round((s.counted_count! / s.line_count) * 100) : 0;
            const dateStr = new Date(s.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
            const locLabel = s.location === "bar" ? "Bar" : s.location === "reserve" ? "Réserve" : "Bar + Réserve";
            return (
              <Link
                key={s.id}
                href={`/inventaire/${s.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
              >
                <div className={`p-2 rounded-lg ${s.status === "termine" ? "bg-green-100" : "bg-orange-100"}`}>
                  {s.status === "termine"
                    ? <CheckCircle size={20} className="text-green-600" />
                    : <Clock size={20} className="text-orange-500" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">{dateStr}</span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">{locLabel}</span>
                    {s.status === "en_cours" && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">En cours</span>
                    )}
                    {s.status === "termine" && s.diff_count! > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{s.diff_count} écart{s.diff_count! > 1 ? "s" : ""}</span>
                    )}
                  </div>
                  {s.notes && <p className="text-xs text-gray-500 mt-0.5">{s.notes}</p>}
                  {s.status === "en_cours" && s.line_count! > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div className="bg-teal-500 h-1.5 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{s.counted_count}/{s.line_count}</span>
                    </div>
                  )}
                  {s.status === "termine" && (
                    <p className="text-xs text-gray-400 mt-0.5">{s.line_count} articles comptés</p>
                  )}
                </div>
                <ChevronRight size={16} className="text-gray-400 shrink-0" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
