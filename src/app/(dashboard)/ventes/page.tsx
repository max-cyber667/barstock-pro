"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ShoppingBag, Plus, CheckCircle, Clock, ChevronRight, TrendingDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

type Session = {
  id: string;
  date: string;
  service: string;
  status: string;
  notes: string | null;
  created_at: string;
  total_cocktails?: number;
  total_types?: number;
};

const SERVICE_LABELS: Record<string, string> = { midi: "Midi", soir: "Soir", journee: "Journée" };

export default function VentesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    service: new Date().getHours() >= 16 ? "soir" : "midi",
    notes: "",
  });

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("sales_sessions")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    const enriched: Session[] = [];
    for (const s of data ?? []) {
      const { data: lines } = await supabase
        .from("sales_lines")
        .select("quantity")
        .eq("session_id", s.id)
        .gt("quantity", 0);
      enriched.push({
        ...s,
        total_cocktails: lines?.reduce((sum, l) => sum + l.quantity, 0) ?? 0,
        total_types: lines?.length ?? 0,
      });
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
    const { data: session, error } = await supabase
      .from("sales_sessions")
      .insert({ date: form.date, service: form.service, notes: form.notes || null, created_by: user!.id })
      .select().single();
    if (error || !session) { setCreating(false); return; }
    setCreating(false);
    router.push(`/ventes/${session.id}`);
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <ShoppingBag size={20} className="text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Saisie des ventes</h1>
            <p className="text-gray-500 text-sm">Déduction automatique du stock au cl près</p>
          </div>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg font-medium transition-colors">
          <Plus size={16} />
          <span className="hidden sm:inline">Nouvelle saisie</span>
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
          <h2 className="font-semibold text-gray-900">Nouvelle saisie de ventes</h2>
          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Date</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Service</label>
              <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="midi">Midi</option>
                <option value="soir">Soir</option>
                <option value="journee">Journée entière</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Notes (optionnel)</label>
              <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Ex: soirée privée…"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50">Annuler</button>
            <button onClick={handleCreate} disabled={creating || !form.date}
              className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50">
              {creating ? "Création…" : "Démarrer la saisie"}
            </button>
          </div>
        </div>
      )}

      {/* Liste */}
      {sessions.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <TrendingDown size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune saisie pour l&apos;instant</p>
          <button onClick={() => setShowForm(true)} className="mt-4 text-sm text-blue-600 hover:underline">
            Créer la première saisie
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const dateStr = new Date(s.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "long" });
            return (
              <Link key={s.id} href={`/ventes/${s.id}`}
                className="flex items-center gap-4 bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow">
                <div className={`p-2 rounded-lg ${s.status === "confirme" ? "bg-green-100" : "bg-blue-100"}`}>
                  {s.status === "confirme"
                    ? <CheckCircle size={20} className="text-green-600" />
                    : <Clock size={20} className="text-blue-500" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 capitalize">{dateStr}</span>
                    <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">
                      {SERVICE_LABELS[s.service]}
                    </span>
                    {s.status === "confirme" && (
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Appliqué au stock</span>
                    )}
                    {s.status === "brouillon" && (
                      <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-600 rounded-full">Brouillon</span>
                    )}
                  </div>
                  {s.total_cocktails! > 0 && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {s.total_cocktails} cocktail{s.total_cocktails! > 1 ? "s" : ""} vendu{s.total_cocktails! > 1 ? "s" : ""} ({s.total_types} référence{s.total_types! > 1 ? "s" : ""})
                    </p>
                  )}
                  {s.notes && <p className="text-xs text-gray-400 mt-0.5">{s.notes}</p>}
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
