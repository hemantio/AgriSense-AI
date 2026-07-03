/**
 * AgriSense AI — Health Hooks
 * ==============================
 * React Query hooks for crop health analysis.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  HealthRecord,
  HealthListResponse,
  HealthListParams,
} from "@/types";

/** Fetch paginated health history. */
export function useHealthHistory(params?: HealthListParams) {
  return useQuery<HealthListResponse>({
    queryKey: ["health", "history", params],
    queryFn: () =>
      api.getHealthHistory(params).then((r) => r.data as HealthListResponse),
  });
}

/** Fetch a single health record by ID. */
export function useHealthRecord(id: string | undefined) {
  return useQuery<HealthRecord>({
    queryKey: ["health", id],
    queryFn: () => api.getHealthRecord(id!).then((r) => r.data as HealthRecord),
    enabled: !!id,
    // Poll for status updates while processing
    refetchInterval: (query) => {
      const data = query.state.data as HealthRecord | undefined;
      if (data?.status === "pending" || data?.status === "processing") {
        return 3000; // poll every 3 seconds
      }
      return false;
    },
  });
}

/** Upload a crop image for health analysis. */
export function useAnalyzeHealth() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData: FormData) => api.analyzeHealth(formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["health"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
