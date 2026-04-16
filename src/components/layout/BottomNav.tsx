"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wine,
  ArrowLeftRight,
  ShoppingBag,
  History,
  MoreHorizontal,
} from "lucide-react";
import { Role } from "@/types";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/stock-bar", label: "Bar", icon: Wine },
  { href: "/ventes", label: "Ventes", icon: ShoppingBag },
  { href: "/reassort", label: "Réassort", icon: ArrowLeftRight },
  { href: "/historique", label: "Historique", icon: History },
];

export function BottomNav({ role }: { role: Role | null }) {
  const pathname = usePathname();
  void role;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-30">
      <div className="flex">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
                active ? "text-amber-500" : "text-gray-500"
              }`}
            >
              <Icon size={22} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Link
          href="/articles"
          className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-xs transition-colors ${
            pathname.startsWith("/stock-reserve") ||
            pathname.startsWith("/articles") ||
            pathname.startsWith("/couts") ||
            pathname.startsWith("/commandes") ||
            pathname.startsWith("/admin")
              ? "text-amber-500"
              : "text-gray-500"
          }`}
        >
          <MoreHorizontal size={22} />
          <span>Plus</span>
        </Link>
      </div>
    </nav>
  );
}
