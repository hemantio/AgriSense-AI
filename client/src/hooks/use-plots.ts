/**
 * AgriSense AI — Plot Hooks
 * ============================
 * React Query hooks for farm plot operations.
 * Replaces direct apiClient calls with cached, type-safe data fetching.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Plot,
  PlotCreateRequest,
  PlotListParams,
  PlotListResponse,
  PlotUpdateRequest,
} from "@/types";

/** Fetch paginated list of plots. */
export function usePlots(params?: PlotListParams) {
  return useQuery<PlotListResponse>({
    queryKey: ["plots", params],
    queryFn: () => api.listPlots(params).then((r) => r.data as PlotListResponse),
  });
}

/** Fetch a single plot by ID. */
export function usePlot(id: string | undefined) {
  return useQuery<Plot>({
    queryKey: ["plots", id],
    queryFn: () => api.getPlot(id!).then((r) => r.data as Plot),
    enabled: !!id,
  });
}

/** Create a new plot with automatic cache invalidation. */
export function useCreatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PlotCreateRequest) => api.createPlot(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Update a plot with automatic cache invalidation. */
export function useUpdatePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PlotUpdateRequest }) =>
      api.updatePlot(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["plots", variables.id] });
    },
  });
}

/** Verify a plot (admin action) with automatic cache invalidation. */
export function useVerifyPlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.verifyPlot(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Delete a plot with automatic cache invalidation. */
export function useDeletePlot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deletePlot(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plots"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
