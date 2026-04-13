"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { AlertItem } from "@/types";
import { formatQty } from "@/lib/utils";

export function AlertBanner({ alerts }: { alerts: AlertItem[] }) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <AlertTriangle size={18} className="text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              {alerts.length} article{alerts.length > 1 ? "s" : ""} en stock faible
            </p>
            <ul className="mt-1 space-y-0.5">
              {alerts.slice(0, 5).map((a, i) => (
                <li key={i} className="text-xs text-yellow-700">
                  {a.item.name} — {formatQty(a.current, a.item.unit)} (seuil:{" "}
                  {formatQty(a.threshold, a.item.unit)})
                </li>
              ))}
              {alerts.length > 5 && (
                <li className="text-xs text-yellow-600 font-medium">
                  +{alerts.length - 5} autres...
                </li>
              )}
            </ul>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-500 hover:text-yellow-700 shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
