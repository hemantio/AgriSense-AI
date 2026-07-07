/**
 * AgriSense AI — Dashboard Hooks
 * ==================================
 * React Query hooks for dashboard aggregated statistics.
 */

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { DashboardStats } from "@/types";

/** Fetch aggregated dashboard statistics. */
export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard", "stats"],
    queryFn: () => api.getDashboardStats().then((r) => r.data as DashboardStats),
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds
  });
}
