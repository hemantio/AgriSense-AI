/**
 * AgriSense AI — Farmer Hooks
 * ===============================
 * React Query hooks for farmer management (admin operations).
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  Farmer,
  FarmerCreateRequest,
  FarmerListParams,
  FarmerListResponse,
  FarmerUpdateRequest,
} from "@/types";

/** Fetch paginated list of farmers. */
export function useFarmers(params?: FarmerListParams) {
  return useQuery<FarmerListResponse>({
    queryKey: ["farmers", params],
    queryFn: () => api.listFarmers(params).then((r) => r.data as FarmerListResponse),
  });
}

/** Fetch a single farmer by ID. */
export function useFarmer(id: string | undefined) {
  return useQuery<Farmer>({
    queryKey: ["farmers", id],
    queryFn: () => api.getFarmer(id!).then((r) => r.data as Farmer),
    enabled: !!id,
  });
}

/** Create (register) a new farmer. */
export function useCreateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: FarmerCreateRequest) => api.createFarmer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

/** Update an existing farmer profile. */
export function useUpdateFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: FarmerUpdateRequest }) =>
      api.updateFarmer(id, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["farmers", variables.id] });
    },
  });
}

/** Delete (soft-delete) a farmer. */
export function useDeleteFarmer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteFarmer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["farmers"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
