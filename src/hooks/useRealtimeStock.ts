"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { StockWithItem } from "@/types";

export function useRealtimeStock(
  location: "bar" | "reserve",
  rows: StockWithItem[],
  onUpdate: (updated: StockWithItem[]) => void
) {
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`stock-${location}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "stock",
          filter: `location=eq.${location}`,
        },
        (payload) => {
          const updated = rowsRef.current.map((row) =>
            row.id === payload.new.id
              ? { ...row, quantity: payload.new.quantity, updated_at: payload.new.updated_at }
              : row
          );
          onUpdate(updated);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [location, onUpdate]);
}
