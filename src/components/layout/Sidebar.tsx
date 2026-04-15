"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wine,
  Warehouse,
  ArrowLeftRight,
  History,
  Package,
  TrendingUp,
  ShoppingCart,
  Users,
  LogOut,
  GlassWater,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Role } from "@/types";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  minRole?: Role;
}

const navItems: NavItem[] = [
  { href: "/", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/stock-bar", label: "Stock Bar", icon: Wine },
  { href: "/stock-reserve", label: "Stock Réserve", icon: Warehouse },
  { href: "/reassort", label: "Réassort", icon: ArrowLeftRight },
  { href: "/historique", label: "Historique", icon: History },
  { href: "/articles", label: "Articles", icon: Package, minRole: "manager" },
  { href: "/inventaire", label: "Inventaires", icon: ClipboardList, minRole: "manager" },
  { href: "/cocktails", label: "Cocktails", icon: GlassWater, minRole: "manager" },
  { href: "/couts", label: "Coûts", icon: TrendingUp, minRole: "manager" },
  { href: "/commandes", label: "Commandes", icon: ShoppingCart, minRole: "manager" },
  { href: "/admin/utilisateurs", label: "Utilisateurs", icon: Users, minRole: "admin" },
];

function canAccess(role: Role | null, minRole?: Role) {
  if (!minRole) return true;
  if (minRole === "staff") return true;
  if (minRole === "manager") return role === "manager" || role === "admin";
  if (minRole === "admin") return role === "admin";
  return false;
}

export function Sidebar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-30">
      <div className="px-6 py-5 border-b border-slate-700">
        <h1 className="text-xl font-bold text-amber-400">BarStock Pro</h1>
        <p className="text-xs text-slate-400 mt-0.5">Gestion de stock</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems
          .filter((item) => canAccess(role, item.minRole))
          .map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-amber-500/20 text-amber-400"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
      </nav>
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:bg-slate-800 hover:text-white w-full transition-colors"
        >
          <LogOut size={18} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
