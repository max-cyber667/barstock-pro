"use client";

import { useRouter } from "next/navigation";
import { LogOut, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/types";

export function TopBar({ profile }: { profile: Profile | null }) {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="lg:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between sticky top-0 z-20">
      <h1 className="text-lg font-bold text-amber-400">BarStock Pro</h1>
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400">
          {profile?.display_name ?? profile?.email?.split("@")[0]}
        </span>
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
