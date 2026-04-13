"use client";

import { useMemo } from "react";
import { AlertItem, StockWithItem } from "@/types";
import { computeAlerts } from "@/lib/utils";

export function useStockAlerts(rows: StockWithItem[]): AlertItem[] {
  return useMemo(() => computeAlerts(rows), [rows]);
}
