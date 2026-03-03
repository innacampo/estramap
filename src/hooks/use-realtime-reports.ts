import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PharmacyReport = Tables<"pharmacy_reports">;

/**
 * Subscribes to Supabase Realtime changes on pharmacy_reports
 * and merges INSERT / UPDATE / DELETE events into the React Query cache.
 */
export function useRealtimeReports() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("pharmacy_reports_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pharmacy_reports" },
        (payload) => {
          queryClient.setQueryData<PharmacyReport[]>(
            ["pharmacy_reports"],
            (old = []) => {
              switch (payload.eventType) {
                case "INSERT": {
                  const newRow = payload.new as PharmacyReport;
                  // Avoid duplicates (e.g. optimistic entry already present)
                  if (old.some((r) => r.id === newRow.id)) {
                    return old.map((r) => (r.id === newRow.id ? newRow : r));
                  }
                  // Also replace any optimistic placeholder
                  const withoutOptimistic = old.filter(
                    (r) => !r.id.startsWith("optimistic-"),
                  );
                  return [newRow, ...withoutOptimistic];
                }
                case "UPDATE": {
                  const updated = payload.new as PharmacyReport;
                  return old.map((r) => (r.id === updated.id ? updated : r));
                }
                case "DELETE": {
                  const deletedId = (payload.old as { id: string }).id;
                  return old.filter((r) => r.id !== deletedId);
                }
                default:
                  return old;
              }
            },
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}
