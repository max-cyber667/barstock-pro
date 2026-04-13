import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "ok" | "low" | "empty" | "admin" | "manager" | "staff" | "default";
  className?: string;
}

const variantClasses: Record<string, string> = {
  ok: "bg-green-100 text-green-800",
  low: "bg-yellow-100 text-yellow-800",
  empty: "bg-red-100 text-red-800",
  admin: "bg-purple-100 text-purple-800",
  manager: "bg-blue-100 text-blue-800",
  staff: "bg-gray-100 text-gray-700",
  default: "bg-gray-100 text-gray-700",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StockStatusBadge({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty <= 0) return <Badge variant="empty">Rupture</Badge>;
  if (threshold > 0 && qty <= threshold) return <Badge variant="low">Faible</Badge>;
  return <Badge variant="ok">OK</Badge>;
}

export function RoleBadge({ role }: { role: string }) {
  const labels: Record<string, string> = {
    admin: "Admin",
    manager: "Manager",
    staff: "Staff",
  };
  return (
    <Badge variant={role as "admin" | "manager" | "staff"}>
      {labels[role] ?? role}
    </Badge>
  );
}
