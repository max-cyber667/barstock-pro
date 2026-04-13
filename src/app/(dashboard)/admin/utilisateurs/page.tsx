"use client";

import { useEffect, useState, useCallback } from "react";
import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { RoleBadge } from "@/components/ui/Badge";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { formatDate } from "@/lib/utils";
import { Profile, Role } from "@/types";

const ROLES: Role[] = ["admin", "manager", "staff"];
const ROLE_LABELS: Record<Role, string> = { admin: "Admin", manager: "Manager", staff: "Staff" };

export default function UtilisateursPage() {
  const { user: currentUser, isAdmin } = useCurrentUser();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { success, error: showError } = useToast();

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    setProfiles((data ?? []) as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(profileId: string, newRole: Role) {
    if (profileId === currentUser?.id) {
      showError("Vous ne pouvez pas modifier votre propre rôle");
      return;
    }
    setUpdatingId(profileId);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", profileId);
    if (error) showError("Erreur lors de la modification");
    else {
      setProfiles((prev) => prev.map((p) => p.id === profileId ? { ...p, role: newRole } : p));
      success("Rôle modifié");
    }
    setUpdatingId(null);
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleting(true);
    const supabase = createClient();
    const { error } = await supabase.from("profiles").delete().eq("id", deleteId);
    if (error) showError("Erreur lors de la suppression");
    else { success("Utilisateur supprimé"); load(); }
    setDeleting(false);
    setDeleteId(null);
  }

  if (!isAdmin) {
    return (
      <div className="text-center mt-20">
        <p className="text-gray-400">Accès réservé aux administrateurs</p>
      </div>
    );
  }

  if (loading) return <LoadingSpinner className="mt-20" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-violet-100 rounded-lg">
          <Users size={20} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Utilisateurs</h1>
          <p className="text-gray-500 text-sm">{profiles.length} compte{profiles.length > 1 ? "s" : ""}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
        {profiles.map((profile) => (
          <div key={profile.id} className="p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {(profile.display_name ?? profile.email).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {profile.display_name ?? profile.email}
                  </p>
                  {profile.display_name && (
                    <p className="text-xs text-gray-400 truncate">{profile.email}</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-1 ml-10">Depuis le {formatDate(profile.created_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {profile.id === currentUser?.id ? (
                <RoleBadge role={profile.role} />
              ) : (
                <select
                  value={profile.role}
                  onChange={(e) => changeRole(profile.id, e.target.value as Role)}
                  disabled={updatingId === profile.id}
                  className="text-sm border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              )}
              {profile.id !== currentUser?.id && (
                <button
                  onClick={() => setDeleteId(profile.id)}
                  className="text-xs px-2 py-1 text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Supprimer l'utilisateur"
        message="Ce compte sera supprimé. L'utilisateur ne pourra plus se connecter."
        confirmLabel="Supprimer"
        danger
        loading={deleting}
      />
    </div>
  );
}
